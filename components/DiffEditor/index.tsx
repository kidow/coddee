import type { FC } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { DiffEditorProps } from '@monaco-editor/react'
import { registerSvelte, registerVue, useTheme } from 'services'
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export interface Props extends DiffEditorProps {}
interface State {}

const MonacoDiffEditor: FC<Props> = ({ ...props }) => {
  const theme = useTheme()

  const beforeMount = (monaco: typeof Monaco) => {
    registerVue(monaco)
    registerSvelte(monaco)
  }
  return (
    <DiffEditor
      {...props}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        ...props.options,
        scrollbar: {
          vertical: 'hidden',
          alwaysConsumeMouseWheel: false
        },
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on'
      }}
      loading=""
      beforeMount={beforeMount}
    />
  )
}

export default MonacoDiffEditor
