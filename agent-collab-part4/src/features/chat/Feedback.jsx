import '../../utils/feedback-styles.scss'

import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider, useCurrentEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { UpdateIcon } from '@radix-ui/react-icons'
import { Button, Flex, IconButton } from '@radix-ui/themes'
import { $currentEleve } from '@/store/store'
import { updateAppreciationEleve, updateNoteAppreciationEleve } from '@/store/eleveForm'
import {
  onGenerateAppreciation,
  isEvaluationComplete,
  $isGeneratingAppreciation,
} from '@/store/feedback'
import { $isFeedbackFocused, focusFeedback, blurFeedback } from '@/store/feedbackFocus'
import { useStore } from '@nanostores/react'
import React, { useEffect } from 'react'
import { AgentMenu } from './AgentMenu'
import { AgentSelect } from './AgentSelect'

const MenuBar = () => {
  const { editor } = useCurrentEditor()
  const isFocused = useStore($isFeedbackFocused)

  if (!editor) {
    return null
  }

  return (
    <div className={`feedback-control-group ${isFocused ? 'modal-mode' : ''}`}>
      <div className='feedback-button-group'>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title='Gras'>
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title='Italique'>
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title='Barré'>
          <s>S</s>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title='Liste à puces'>
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title='Liste numérotée'>
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title='Annuler'>
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title='Refaire'>
          ↷
        </button>
      </div>
    </div>
  )
}

const AppreciationEditor = () => {
  const { editor } = useCurrentEditor()
  const currentEleve = useStore($currentEleve)
  const isFocused = useStore($isFeedbackFocused)

  useEffect(() => {
    if (!editor || !currentEleve) return

    let content
    if (currentEleve.appreciation && currentEleve.appreciation.trim()) {
      content = currentEleve.appreciation.includes('<')
        ? currentEleve.appreciation
        : `<p>${currentEleve.appreciation.replace(/\n/g, '</p><p>')}</p>`
    } else {
      content = '<p></p>'
    }

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, false)
    }
  }, [editor, currentEleve?.id, currentEleve?.appreciation])

  useEffect(() => {
    if (!editor || !currentEleve) return

    const handleUpdate = () => {
      const html = editor.getHTML()
      updateAppreciationEleve(currentEleve.id, html)
    }

    const handleFocus = () => {
      focusFeedback()
    }

    const handleKeyDown = (view, event) => {
      if (event.key === 'Escape' && isFocused) {
        event.preventDefault()
        blurFeedback()
        editor.commands.blur()
        return true
      }
      return false
    }

    editor.on('update', handleUpdate)
    editor.on('focus', handleFocus)
    editor.view.dom.addEventListener('keydown', handleKeyDown)

    return () => {
      editor.off('update', handleUpdate)
      editor.off('focus', handleFocus)
      editor.view.dom.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, currentEleve?.id, isFocused])

  return null
}

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
]

function Feedback() {
  const currentEleve = useStore($currentEleve)
  const isGenerating = useStore($isGeneratingAppreciation)
  const isFocused = useStore($isFeedbackFocused)
  const playDisable = !isEvaluationComplete(currentEleve)

  const initialContent =
    currentEleve?.appreciation && currentEleve.appreciation.trim()
      ? currentEleve.appreciation
      : '<p></p>'

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      blurFeedback()
    }
  }

  return (
    <>
      {isFocused && (
        <div
          className='feedback-backdrop'
          onClick={handleBackdropClick}
        />
      )}

      <Flex
        direction='column'
        width='100%'
        gap='4'
        justify='start'
        align='start'>
        <Flex gap='4'>
          <Flex
            direction='column'
            gap='3'
            width='100%'
            justify='center'
            align='center'
            className={isFocused ? 'feedback-focused' : ''}>
            <div
              className={`feedback-editor-container ${
                isFocused ? 'modal-mode' : 'normal-mode'
              }`}
              style={{ maxHeight: '800px', overflowY: 'auto' }}>
              {isFocused && (
                <div className='feedback-modal-header'>
                  <h3>✍️ Rédaction de l'appréciation</h3>
                  <p>Prenez votre temps pour rédiger une appréciation détaillée</p>
                </div>
              )}

              <EditorProvider
                slotBefore={<MenuBar />}
                extensions={extensions}
                content={initialContent}
                editorProps={{
                  attributes: {
                    class: isFocused
                      ? 'feedback-editor modal-editor'
                      : 'feedback-editor normal-editor',
                    placeholder: isFocused
                      ? 'Rédigez votre appréciation détaillée ici...\n\nVous pouvez utiliser le formatage (gras, italique, listes) pour structurer votre texte.\n\nAppuyez sur Échap pour revenir au mode compact.'
                      : "Cliquez pour rédiger l'appréciation...",
                    style: 'max-height: 800px; overflow-y: auto;',
                  },
                }}>
                <AppreciationEditor />
              </EditorProvider>
            </div>
          </Flex>
        </Flex>

        <Flex
          justify='between'
          align='start'
          className={isFocused ? 'feedback-actions-modal' : 'feedback-actions-normal'}>
          <input
            type='number'
            min={1}
            max={5}
            value={currentEleve?.note_appreciation ?? ''}
            onChange={(e) =>
              updateNoteAppreciationEleve(currentEleve.id, Number(e.target.value))
            }
            style={{
              width: 60,
              marginRight: 12,
              fontSize: 16,
              padding: 4,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
            placeholder='Note'
          />

          <Button
            size='2'
            disabled={playDisable || isGenerating}
            onClick={onGenerateAppreciation}
            title={
              isGenerating
                ? 'Génération en cours...'
                : 'Générer une appréciation automatique'
            }>
            Re-générer
            <UpdateIcon className={isGenerating ? 'animate-spin' : ''} />
          </Button>
        </Flex>

        <Flex>
          <AgentMenu></AgentMenu>
          <AgentSelect></AgentSelect>
        </Flex>
      </Flex>
    </>
  )
}

export default Feedback
