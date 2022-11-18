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
import { useRouter } from 'next/router'

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
  typingSource?: string
  chatId?: number
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
  typingSource,
  chatId,
  ...props
}) => {
  if (!originalCode) return null
  const [
    { isCollapse, isDiffEditorOpen, codeBlock, content, language },
    setState,
    onChange,
    resetState
  ] = useObjectState<State>({
    isCollapse: false,
    isDiffEditorOpen: false,
    codeBlock: '',
    content: '',
    language: ''
  })
  const theme = useTheme()
  const [user] = useUser()
  const supabase = useSupabaseClient()
  const languageList = useRecoilValue(languageListState)
  const { query } = useRouter()

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

  const onTyping = async () => {
    if (!user) return
    if (typingSource === 'chat') {
      const channel = supabase
        .getChannels()
        .find((item) => item.topic === `realtime:is-typing:chat/${query.id}`)
      if (channel)
        await channel.track({
          userId: user.id,
          nickname: user.nickname,
          roomId: query.id
        })
    }
    if (typingSource === 'reply') {
      const channel = supabase
        .getChannels()
        .find((item) => item.topic === `realtime:is-typing:reply/${chatId}`)
      if (channel)
        await channel.track({
          userId: user.id,
          nickname: user.nickname,
          chatId
        })
    }
  }

  const onSubmit = async () => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }
    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
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

  const listener = () => resetState()

  useEffect(() => {
    if (!isDiffEditorOpen) return
    EventListener.add('message:codeblock', listener)
    return () => EventListener.remove('message:codeblock', listener)
  }, [isDiffEditorOpen])
  return (
    <>
      <div className="text-xs text-neutral-600 dark:text-neutral-400">
        {isCollapse && (
          <div className="border dark:border-transparent">
            {!!modifiedCode ? (
              <DiffEditor
                original={originalCode}
                modified={modifiedCode}
                originalLanguage={props.language}
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
                  wordWrap: 'on',
                  lineNumbers: 'off'
                }}
                onMount={onDiffMount}
                loading={false}
              />
            ) : (
              <Editor
                language={props.language}
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
                  wordWrap: 'on',
                  lineNumbers: 'off'
                }}
                value={originalCode}
                loading={false}
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
            !!props.language && (
              <>
                <span>·</span>
                <span>{props.language}</span>
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
                onClick={() => {
                  setState({
                    isDiffEditorOpen: true,
                    codeBlock: modifiedCode || originalCode,
                    content: `${mention} `,
                    language: props.language
                  })
                }}
              >
                답장
              </button>
            </>
          )}
        </div>
      </div>
      <Modal
        isOpen={isDiffEditorOpen}
        onClose={() =>
          setState({
            isDiffEditorOpen: false,
            content: '',
            language: '',
            codeBlock: ''
          })
        }
        title="코드 답장"
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
              {!!props.language && (
                <div className="inline-flex h-[42px] items-center rounded border border-neutral-300 bg-white px-3 capitalize text-neutral-800 dark:border-neutral-700 dark:bg-black dark:text-neutral-400">
                  {props.language}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Select
                value={language}
                name="language"
                onChange={onChange}
                className="inline-block"
              >
                <option value="">언어 선택</option>
                {languageList.map((item) => (
                  <option key={item.id} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="border dark:border-transparent">
            <DiffEditor
              original={modifiedCode || originalCode}
              modified={codeBlock}
              originalLanguage={props.language}
              modifiedLanguage={language}
              height="300px"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollbar: {
                  vertical: 'hidden',
                  alwaysConsumeMouseWheel: false
                }
              }}
              loading={false}
              onMount={(editor, monaco) => {
                editor.getModifiedEditor().onDidChangeModelContent(async () => {
                  setState({ codeBlock: editor.getModifiedEditor().getValue() })
                  onTyping()
                })
              }}
            />
          </div>
          <div className="border p-2 focus-within:border-neutral-600 dark:border-neutral-700 dark:bg-neutral-900">
            <Textarea
              value={content}
              className="w-full"
              placeholder="서로를 존중하는 매너를 보여주세요 :)"
              onChange={(e) => setState({ content: e.target.value })}
              onKeyDown={onTyping}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default MessageCodeBlock
