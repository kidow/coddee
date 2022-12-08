import { useMemo } from 'react'
import type { FC } from 'react'
import {
  backdrop,
  captureException,
  cheerio,
  threadListState,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { HashtagIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { Message, Modal } from 'containers'
import { Textarea } from 'components'
import { useRecoilState } from 'recoil'

import ThreadChat from './Chat'
import ThreadReply from './Reply'

export interface Props {
  index: number
}
interface State {
  isSubmitting: boolean
  content: string
  isCodeEditorOpen: boolean
  isMoreOpen: boolean
}

const Thread: FC<Props> = ({ index }) => {
  const [{ isSubmitting, content, isCodeEditorOpen, isMoreOpen }, setState] =
    useObjectState<State>({
      isSubmitting: false,
      content: '',
      isCodeEditorOpen: false,
      isMoreOpen: false
    })
  const [user] = useUser()
  const supabase = useSupabaseClient<Database>()
  const { onRegex } = useChatList()
  const [list, setList] = useRecoilState(threadListState)

  const createReply = async () => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setList([])
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!content.trim() || content === '<p><br></p>') return
    if (cheerio.getText(content).length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('replies')
      .insert({ user_id: user.id, chat_id: chat.id, content })
      .select()
      .single()
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(content, data.chat_id, data.id)
    setState({ content: '' })
    setList([
      ...list.slice(0, index),
      {
        ...chat,
        replies: [
          ...chat.replies,
          {
            ...data,
            user: {
              id: user.id,
              avatar_url: user.avatar_url,
              nickname: user.nickname
            },
            reply_reactions: [],
            opengraphs: [],
            saves: []
          }
        ]
      },
      ...list.slice(index + 1)
    ])
  }

  const createCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({
        user_id: user?.id || '',
        chat_id: chat.id,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .select(
        `
        *,
        room:room_id (
          id,
          name
        )
      `
      )
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, data.chat_id, data.id)
    setState({ content: '', isCodeEditorOpen: false })
    setList([
      ...list.slice(0, index),
      {
        ...chat,
        replies: [
          ...chat.replies,
          {
            ...data,
            reply_reactions: [],
            saves: [],
            opengraphs: [],
            user: {
              id: user?.id || '',
              nickname: user?.nickname || '',
              avatar_url: user?.avatar_url || ''
            },
            // @ts-ignore
            room: {
              // @ts-ignore
              id: data.room.id,
              // @ts-ignore
              name: data.room.name
            }
          }
        ]
      },
      ...list.slice(index + 1)
    ])
  }

  const chat = useMemo(() => list[index], [list, index])

  const participants: string = useMemo(() => {
    if (!user) return ''

    return ''
  }, [user, index])
  return (
    <>
      <div className="m-4">
        <div className="ml-2 mb-2 space-y-1">
          <div className="flex items-center gap-0.5 text-neutral-700 dark:text-neutral-400">
            <span>
              <HashtagIcon className="h-4 w-4" />
            </span>
            <Link href={`/room/${chat.room_id}`}>
              <a className="text-sm font-bold hover:underline">
                {chat.room.name}
              </a>
            </Link>
          </div>
          <div className="text-xs text-neutral-400">
            {chat.user_id === user?.id &&
              chat.replies.every((item) => item.user_id === user?.id) &&
              '나만'}
          </div>
        </div>
        <div className="rounded-xl border py-2 dark:border-neutral-700">
          <ThreadChat index={index} />
          <hr className="my-2 dark:border-neutral-700" />
          {chat.replies.length > 3 && !isMoreOpen && (
            <div className="flex h-6 items-center pl-4">
              <span
                onClick={() => setState({ isMoreOpen: true })}
                className="cursor-pointer text-sm text-blue-500 hover:underline"
              >
                {chat.replies.length - 3}개의 추가 댓글 표시
              </span>
            </div>
          )}
          {chat.replies
            .slice(chat.replies.length > 3 && !isMoreOpen ? -3 : undefined)
            .map((_, key) => (
              <ThreadReply chatIndex={index} replyIndex={key} key={key} />
            ))}
          <div className="mt-2 px-4">
            <div className="flex items-center gap-3 rounded-xl border py-2 px-3 dark:border-neutral-700">
              <div className="max-w-[630px] flex-1">
                <Textarea
                  value={content}
                  onChange={(content) => setState({ content })}
                  placeholder="답글 남기기"
                  readOnly={isSubmitting}
                />
              </div>
              <Message.Button.Code
                onClick={() => setState({ isCodeEditorOpen: true })}
              />
              <Message.Button.Submit
                onClick={createReply}
                disabled={isSubmitting || !content}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        onSubmit={createCodeReply}
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default Object.assign(Thread, { Chat: ThreadChat, Reply: ThreadReply })
