import { useCallback, useEffect } from 'react'
import type { FC } from 'react'
import type { OnChange } from '@monaco-editor/react'
import { Modal } from 'containers'
import {
  backdrop,
  cheerio,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import { Button, Textarea, Select, Editor } from 'components'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'

export interface Props extends ModalProps {
  content?: string
  language?: string
  codeBlock?: string
  onSubmit: (payload: {
    content: string
    codeBlock: string
    language: string
  }) => void
  typingSource?: 'chat' | 'reply'
  chatId?: number
}
interface State {
  content: string
  language: string
  codeBlock: string
  languageList: NTable.Languages[]
}

const CodeEditorModal: FC<Props> = ({
  isOpen,
  onClose,
  typingSource,
  chatId,
  ...props
}) => {
  const [{ content, language, codeBlock, languageList }, setState] =
    useObjectState<State>({
      content: props.content || '',
      language: props.language || '',
      codeBlock: props.codeBlock || '',
      languageList: []
    })
  const [user] = useUser()
  const supabase = useSupabaseClient<Database>()
  const { query } = useRouter()

  const getLanguages = async () => {
    const { data } = await supabase.from('languages').select('*')
    setState({ languageList: data || [] })
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
      onClose()
      return
    }
    if (!content.trim() || content === '<p><br></p>') return
    if (cheerio.getText(content).length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }
    if (codeBlock.length > 2000) {
      toast.info('코드는 2,000자 이하로 작성 부탁드립니다.')
      return
    }
    backdrop(true)
    props.onSubmit({ content, codeBlock, language })
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

  const onEditorChange: OnChange = useCallback(
    async (codeBlock) => {
      setState({ codeBlock })
      onTyping()
    },
    [codeBlock]
  )

  useEffect(() => {
    getLanguages()
  }, [])
  if (!isOpen) return null
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
                    codeBlock:
                      languageList[e.target.selectedIndex - 1].template || ''
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
              disabled={!content || !codeBlock || content === '<p><br></p>'}
              onClick={onSubmit}
            >
              {!!props.codeBlock ? '수정' : '등록'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="hidden border dark:border-none sm:block">
          <Editor
            height="300px"
            language={language}
            onChange={onEditorChange}
            value={codeBlock}
          />
        </div>
        <div className="border p-2 focus-within:border-neutral-600 dark:border-neutral-700 dark:bg-neutral-900">
          <Textarea
            value={content}
            onChange={(content) => setState({ content })}
            onKeyDown={onTyping}
          />
        </div>
      </div>
    </Modal>
  )
}

export default CodeEditorModal
