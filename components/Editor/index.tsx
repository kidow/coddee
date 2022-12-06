import type { FC } from 'react'
import MonacoEditor from '@monaco-editor/react'
import type { EditorProps } from '@monaco-editor/react'
import { registerSvelte, registerVue, useTheme } from 'services'
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export interface Props extends EditorProps {}
interface State {}

const Editor: FC<Props> = ({ ...props }) => {
  const theme = useTheme()

  const beforeMount = (monaco: typeof Monaco) => {
    registerVue(monaco)
    registerSvelte(monaco)
  }
  return (
    <MonacoEditor
      {...props}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      loading=""
      beforeMount={beforeMount}
      options={{
        ...props.options,
        wordWrap: 'on',
        fontSize: 14,
        minimap: { enabled: false },
        scrollbar: {
          vertical: 'hidden',
          alwaysConsumeMouseWheel: false
        },
        tabSize: 4
      }}
    />
  )
}

export default Editor
