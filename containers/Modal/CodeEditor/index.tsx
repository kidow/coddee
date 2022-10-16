import { useEffect } from 'react'
import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import TextareaAutosize from 'react-textarea-autosize'
import { Modal } from 'containers'
import { supabase, useObjectState, useUser } from 'services'
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
  const [user] = useUser()
  const { query } = useRouter()

  const getLanguages = async () => {
    const { data } = await supabase.from('languages').select('*')
    setState({ languageList: data || [] })
  }

  const create = async () => {
    if (!user || !content) return
    setState({ isSubmitting: true })
    const { error } = await supabase.from('chats').insert({
      content,
      language,
      code_block: codeBlock,
      user_id: user.id,
      room_id: query.id
    })
    setState({ isSubmitting: false })
    if (error) console.error(error)
    else onClose()
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
              disabled={isSubmitting || !user}
              onClick={create}
            >
              등록
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="hidden sm:block">
          <Editor
            height="300px"
            defaultLanguage={props.language}
            language={language}
            onChange={(codeBlock) => setState({ codeBlock })}
            defaultValue={props.codeBlock}
            value={codeBlock}
            theme="vs-dark"
            options={{ fontSize: 14 }}
          />
        </div>
        <div>
          <TextareaAutosize
            className="w-full resize-none border p-2 focus:border-neutral-600"
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