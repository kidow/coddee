import { useEffect } from 'react'
import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import { Modal } from 'containers'
import {
  backdrop,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useTheme,
  useUser
} from 'services'
import { Button, Select, Textarea } from 'components'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends ModalProps {
  content?: string
  language?: string
  codeBlock?: string
  onSubmit: (payload: {
    content: string
    codeBlock: string
    language: string
  }) => void
}
interface State {
  content: string
  language: string
  codeBlock: string
  languageList: NTable.Languages[]
}

const CodeEditorModal: FC<Props> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null
  const [{ content, language, codeBlock, languageList }, setState, onChange] =
    useObjectState<State>({
      content: props.content || '',
      language: props.language || '',
      codeBlock: props.codeBlock || '',
      languageList: []
    })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()
  const theme = useTheme()

  const getLanguages = async () => {
    const { data } = await supabase.from('languages').select('*')
    setState({ languageList: data || [] })
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
      onClose()
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

  useEffect(() => {
    getLanguages()
  }, [])
  return (
    <Modal
      isOpen={isOpen}
      maxWidth="max-w-4xl"
      onClose={() => {
        if (!!codeBlock) {
          if (window.confirm('작성을 중단하시겠습니까?')) onClose()
        } else onClose()
      }}
      title={
        <Select
          className="inline-block"
          value={language}
          name="language"
          onChange={(e) => {
            setState({
              language: e.target.value,
              ...(e.target.selectedIndex !== 0
                ? {
                    codeBlock: languageList[e.target.selectedIndex - 1].template
                  }
                : {})
            })
          }}
        >
          <option value="">언어 선택</option>
          {languageList.map((item, key) => (
            <option key={key} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      }
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
                if (!!codeBlock) {
                  if (window.confirm('작성을 중단하시겠습니까?')) onClose()
                } else onClose()
              }}
            >
              취소
            </Button>
            <Button
              theme="primary"
              disabled={!content && !codeBlock}
              onClick={onSubmit}
            >
              등록
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="hidden border dark:border-none sm:block">
          <Editor
            height="300px"
            defaultLanguage={props.language}
            language={language}
            onChange={(codeBlock) => setState({ codeBlock })}
            defaultValue={props.codeBlock}
            value={codeBlock}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{ fontSize: 14, minimap: { enabled: false } }}
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
  )
}

export default CodeEditorModal
