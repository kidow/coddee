import { useEffect } from 'react'
import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import TextareaAutosize from 'react-textarea-autosize'
import { Modal } from 'containers'
import {
  supabase,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import { Button, Select } from 'components'
import { useRouter } from 'next/router'

export interface Props extends ModalProps {
  content?: string
  language?: string
  codeBlock?: string
}
interface State {
  content: string
  language: string
  codeBlock: string
  isSubmitting: boolean
  languageList: NTable.Languages[]
}

const CodeEditorModal: FC<Props> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null
  const [
    { content, language, codeBlock, isSubmitting, languageList },
    setState,
    onChange
  ] = useObjectState<State>({
    content: props.content || '',
    language: props.language || '',
    codeBlock: props.codeBlock || '',
    isSubmitting: false,
    languageList: []
  })
  const [user, setUser] = useUser()
  const { query } = useRouter()

  const getLanguages = async () => {
    const { data } = await supabase.from('languages').select('*')
    setState({ languageList: data || [] })
  }

  const create = async () => {
    const { data } = await supabase.auth.getUser()
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }

    if (!codeBlock && !content) return
    setState({ isSubmitting: true })
    const { error } = await supabase.from('chats').insert({
      content,
      language,
      code_block: codeBlock,
      user_id: user?.id,
      room_id: query.id
    })
    setState({ isSubmitting: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    } else onClose()
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
          onChange={onChange}
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
              disabled={isSubmitting || !user || (!content && !codeBlock)}
              onClick={create}
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
            theme={
              window.localStorage.getItem('theme') === 'dark'
                ? 'vs-dark'
                : 'light'
            }
            options={{ fontSize: 14 }}
          />
        </div>
        <div>
          <TextareaAutosize
            className="w-full border p-2 focus:border-neutral-600 dark:border-neutral-700 dark:bg-neutral-900"
            value={content}
            name="content"
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            spellCheck={false}
            onChange={onChange}
          />
        </div>
      </div>
    </Modal>
  )
}

export default CodeEditorModal
