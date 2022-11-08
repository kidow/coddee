import { useEffect } from 'react'
import type { FC } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  backdrop,
  EventListener,
  languageListState,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useTheme,
  useUser
} from 'services'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Modal } from 'containers'
import { Button, Select, Textarea } from 'components'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRecoilValue } from 'recoil'

export interface Props {
  originalCode?: string
  language?: string
  onSubmit: (payload: {
    codeBlock: string
    language: string
    content: string
  }) => void
  mention: string
  modifiedCode?: string
  modifiedLanguage?: string
}
interface State {
  isCollapse: boolean
  isDiffEditorOpen: boolean
  codeBlock: string
  content: string
  language: string
}

const MessageCodeBlock: FC<Props> = ({
  originalCode,
  mention,
  modifiedCode,
  modifiedLanguage,
  ...props
}) => {
  if (!originalCode) return null
  const [
    { isCollapse, isDiffEditorOpen, codeBlock, content, language },
    setState,
    onChange
  ] = useObjectState<State>({
    isCollapse: false,
    isDiffEditorOpen: false,
    codeBlock: '',
    content: `${mention} `,
    language: ''
  })
  const theme = useTheme()
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()
  const languageList = useRecoilValue(languageListState)

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
    element.style.height = `${lineHeight * lineCount}px`
    element.style.maxHeight = `${lineHeight * lineCount}px`
    editor.layout()
  }

  const onDiffMount = (
    editor: Monaco.editor.IStandaloneDiffEditor,
    monaco: typeof Monaco
  ) => {
    const element = editor.getContainerDomNode()
    if (!element) return
    const model = editor.getModel()
    if (!model) return
    const lineHeight = Math.max(
      editor
        .getOriginalEditor()
        .getOption(monaco.editor.EditorOption.lineHeight),
      editor
        .getModifiedEditor()
        .getOption(monaco.editor.EditorOption.lineHeight),
      1
    )
    const lineCount = Math.max(
      model.original.getLineCount(),
      model.modified.getLineCount(),
      1
    )
    element.style.height = `${lineHeight * lineCount}px`
    element.style.maxHeight = `${lineHeight * lineCount}px`
    editor.layout()
  }

  const onSubmit = async () => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }
    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      setState({ isDiffEditorOpen: false })
      return
    }
    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }
    backdrop(true)
    props.onSubmit({ content, codeBlock, language })
  }

  const listener = () => setState({ isDiffEditorOpen: false })

  useEffect(() => {
    if (!isDiffEditorOpen) return
    EventListener.add('message:codeblock', listener)
    return () => EventListener.remove('message:codeblock', listener)
  }, [])
  return (
    <>
      <div className="text-xs text-neutral-600 dark:text-neutral-400">
        {isCollapse && (
          <div className="border dark:border-transparent">
            {!!modifiedCode ? (
              <DiffEditor
                original={originalCode}
                modified={modifiedCode}
                originalLanguage={language}
                modifiedLanguage={modifiedLanguage}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: true,
                  scrollbar: {
                    vertical: 'hidden',
                    alwaysConsumeMouseWheel: false
                  },
                  scrollBeyondLastLine: false,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on'
                }}
                onMount={onDiffMount}
              />
            ) : (
              <Editor
                language={language}
                onMount={onMount}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: true,
                  scrollbar: {
                    vertical: 'hidden',
                    alwaysConsumeMouseWheel: false
                  },
                  scrollBeyondLastLine: false,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on'
                }}
                value={originalCode}
              />
            )}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1">
          <button onClick={() => setState({ isCollapse: !isCollapse })}>
            {isCollapse ? '코드 닫기' : '코드 보기'}
          </button>
          {!!modifiedLanguage ? (
            <>
              <span>·</span>
              <span>{modifiedLanguage}</span>
            </>
          ) : (
            !!language && (
              <>
                <span>·</span>
                <span>{language}</span>
              </>
            )
          )}
          {!!isCollapse && (
            <>
              <span>·</span>
              <CopyToClipboard
                text={modifiedCode || originalCode}
                onCopy={() => toast.success('복사되었습니다.')}
              >
                <button>복사</button>
              </CopyToClipboard>
              <span>·</span>
              <button
                onClick={() =>
                  setState({
                    isDiffEditorOpen: true,
                    codeBlock: modifiedCode || originalCode
                  })
                }
              >
                리뷰
              </button>
            </>
          )}
        </div>
      </div>
      <Modal
        isOpen={isDiffEditorOpen}
        onClose={() => setState({ isDiffEditorOpen: false })}
        title="코드 리뷰"
        maxWidth="max-w-6xl"
        footer={
          <div className="flex items-center justify-between">
            <div>
              {!user && (
                <p className="text-sm italic text-red-500">
                  로그인한 경우에만 가능합니다.
                </p>
              )}
              <p className="text-sm italic sm:hidden">
                모바일에서는 코드 에디터를 사용할 수 없습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                shape="outlined"
                onClick={() => {
                  if (originalCode !== codeBlock) {
                    if (window.confirm('작성을 중단하시겠습니까?'))
                      setState({ isDiffEditorOpen: false })
                  } else setState({ isDiffEditorOpen: false })
                }}
              >
                취소
              </Button>
              <Button
                theme="primary"
                disabled={!content || !codeBlock}
                onClick={onSubmit}
              >
                등록
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-1">
              <div className="flex h-[42px] w-[74px] items-center rounded border border-neutral-300 bg-white px-3 capitalize text-neutral-800 dark:border-neutral-700 dark:bg-black dark:text-neutral-400">
                {language}
              </div>
            </div>
            <div className="flex-1">
              <Select
                value={language}
                name="language"
                onChange={onChange}
                className="inline-block"
              >
                {languageList.map((item) => (
                  <option key={item.id} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <DiffEditor
              original={originalCode}
              modified={codeBlock}
              originalLanguage={language}
              modifiedLanguage={language}
              height="300px"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on'
              }}
            />
          </div>
          <div className="border p-2 focus-within:border-neutral-600 dark:border-neutral-700 dark:bg-neutral-900">
            <Textarea
              value={content}
              className="w-full"
              placeholder="서로를 존중하는 매너를 보여주세요 :)"
              onChange={(e) => setState({ content: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default MessageCodeBlock
