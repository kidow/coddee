import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import type { EditorProps } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export interface Props extends EditorProps {
  original: string
}
interface State {}

const CodePreview: FC<Props> = ({ original, ...props }) => {
  const onMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
  ) => {
    const element = editor.getDomNode()
    if (!element) return
    const model = editor.getModel()
    if (!model) return
    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight)
    const lineCount = model.getLineCount() || 1
    const height = editor.getTopForLineNumber(lineCount + 1) + lineHeight
    element.style.height = `${height}px`
    element.style.maxHeight = `${height}px`
    editor.layout()
  }
  return (
    <Editor
      {...props}
      onMount={onMount}
      theme="light"
      options={{
        readOnly: true,
        scrollbar: { vertical: 'hidden' },
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        fontSize: 14
      }}
      defaultValue={original}
    />
  )
}

export default CodePreview
