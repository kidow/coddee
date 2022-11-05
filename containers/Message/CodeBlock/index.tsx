import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import type { EditorProps } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { copyText, toast, useObjectState, useTheme } from 'services'

export interface Props extends EditorProps {
  originalCode?: string
}
interface State {
  isOpen: boolean
  theme: string
}

const MessageCodeBlock: FC<Props> = ({ originalCode, ...props }) => {
  if (!originalCode) return null
  const [{ isOpen }, setState] = useObjectState<State>({
    isOpen: false,
    theme: 'light'
  })
  const theme = useTheme()

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
    <div className="text-xs text-neutral-600 dark:text-neutral-400">
      {isOpen && (
        <div className="border dark:border-transparent">
          <Editor
            {...props}
            onMount={onMount}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              scrollbar: { vertical: 'hidden', alwaysConsumeMouseWheel: false },
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              fontSize: 14
            }}
            value={originalCode}
          />
        </div>
      )}
      <div className="mt-1 flex items-center gap-1">
        <button onClick={() => setState({ isOpen: !isOpen })}>
          {isOpen ? '코드 닫기' : '코드 보기'}
        </button>
        {!!props.language && (
          <>
            <span>·</span>
            <span>{props.language}</span>
          </>
        )}
        {!!isOpen && (
          <>
            <span>·</span>
            <button
              onClick={() =>
                copyText(originalCode)?.then(() =>
                  toast.success('복사되었습니다.')
                )
              }
            >
              복사
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default MessageCodeBlock
