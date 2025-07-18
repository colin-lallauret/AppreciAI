import { Dialog } from '@radix-ui/themes'
import AgentForm from '@/features/agent/AgentForm'
import { $selectedAgentId, setSelectedAgent } from '@/store/store'
import { $agents, $selectedChatAgents, setSelectChatAgents } from '@/store/store'
import {
  closestCenter,
  DndContext,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '@nanostores/react'
import { Cross1Icon, Pencil1Icon } from '@radix-ui/react-icons'
import { Flex, IconButton, Text } from '@radix-ui/themes'
import React, { useState } from 'react'

function SortableAgent({ agent, onRemove }) {
  const [open, setOpen] = useState(false)

  const handleEdit = () => {
    setSelectedAgent(agent.id)
    setOpen(true)
  }

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: agent.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '0.5rem 1rem',
    background: '#eee',
    borderRadius: '28px',
    margin: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}>
      <Text size='1'>
        {agent.emoji} {agent.title}
      </Text>
      <IconButton
        variant='ghost'
        size='1'
        onClick={handleEdit}>
        <Pencil1Icon />
      </IconButton>
      <IconButton
        variant='ghost'
        size='1'
        color='red'
        onClick={onRemove}>
        <Cross1Icon />
      </IconButton>

      {/* Dialog pour édition */}
      <Dialog.Root
        open={open}
        onOpenChange={setOpen}>
        <Dialog.Content maxWidth='500px'>
          <Dialog.Title>Modifier l’agent</Dialog.Title>
          <AgentForm />
          <Dialog.Close>
            <button style={{ marginTop: 16 }}>Fermer</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}

export function AgentSelect() {
  const agents = useStore($agents)
  const selected = useStore($selectedChatAgents)

  const selectedAgents = selected
    .map((id) => agents.find((e) => e.id === id))
    .filter(Boolean)

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = selected.indexOf(active.id)
      const newIndex = selected.indexOf(over.id)
      const newSelected = arrayMove(selected, oldIndex, newIndex)
      setSelectChatAgents(newSelected)
      $selectedChatAgents.set(newSelected)
    }
  }

  const handleRemove = (idToRemove) => {
    const newSelected = selected.filter((id) => id !== idToRemove)
    console.log('handleRemove', idToRemove, newSelected)
    setSelectChatAgents(newSelected)
  }

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
      },
    }),
    useSensor(TouchSensor),
  )

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}>
      <SortableContext
        items={selected}
        strategy={horizontalListSortingStrategy}>
        <Flex wrap='wrap'>
          {selectedAgents.map((agent) => (
            <SortableAgent
              key={agent.id}
              agent={agent}
              onRemove={() => handleRemove(agent.id)}
            />
          ))}
        </Flex>
      </SortableContext>
    </DndContext>
  )
}
