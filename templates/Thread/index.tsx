import { useMemo } from 'react'
import type { FC } from 'react'

import ThreadChat from './Chat'
import ThreadReply from './Reply'
import {
  backdrop,
  REGEXP,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { HashtagIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { Message, Modal } from 'containers'
import { Textarea } from 'components'

export interface Props {
  chat: NTable.Chats & {
    user: NTable.Users
    replies: Array<
      NTable.Replies & {
        user: NTable.Users
        reply_reactions: NTable.ReplyReactions[]
        opengraphs: NTable.Opengraphs[]
      }
    >
    reactions: Array<NTable.Reactions & { user: NTable.Users }>
    room: NTable.Rooms
    opengraphs: NTable.Opengraphs[]
  }
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  content: string
  isCodeEditorOpen: boolean
  isMoreOpen: boolean
}

const Thread: FC<Props> = ({ chat }) => {
  const [
    { isUpdateMode, isSubmitting, content, isCodeEditorOpen, isMoreOpen },
    setState
  ] = useObjectState<State>({
    isUpdateMode: false,
    isSubmitting: false,
    content: '',
    isCodeEditorOpen: false,
    isMoreOpen: false
  })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()

  const createReply = async () => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data: reply, error } = await supabase
      .from('replies')
      .insert({ user_id: user.id, chat_id: chat.id, content })
      .select()
      .single()
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    }
    onRegex(content, reply.id)
    setState({ content: '' })
  }

  const createCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({
        user_id: user?.id,
        chat_id: chat?.id,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, data.id)
    setState({ content: '', isCodeEditorOpen: false })
  }

  const onRegex = async (content: string, id: number) => {
    if (REGEXP.MENTION.test(content)) {
      const mentions = content
        .match(REGEXP.MENTION)
        ?.filter((id) => id !== user?.id)
      if (!mentions) return

      await Promise.all(
        mentions.map((id) =>
          supabase.from('mentions').insert({
            mention_to: id.slice(-37, -1),
            mention_from: user?.id,
            chat_id: chat?.id,
            reply_id: id
          })
        )
      )
    }

    if (REGEXP.URL.test(content)) {
      const urls = content.match(REGEXP.URL)
      if (!urls) return

      const res = await Promise.all(
        urls.map((url) =>
          fetch('/api/opengraph', {
            method: 'POST',
            headers: new Headers({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ url })
          })
        )
      )
      const json = await Promise.all(res.map((result) => result.json()))
      json
        .filter((item) => item.success)
        .forEach(({ data }) =>
          supabase.from('opengraphs').insert({
            title: data.title || data['og:title'] || data['twitter:title'],
            description:
              data.description ||
              data['og:description'] ||
              data['twitter:description'],
            image: data.image || data['og:image'] || data['twitter:image'],
            url: data.url || data['og:url'] || data['twitter:domain'],
            site_name: data['og:site_name'] || '',
            reply_id: id,
            room_id: chat.room_id
          })
        )
    }
  }

  const participants: string = useMemo(() => {
    if (!user) return ''

    return ''
  }, [user, chat])
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
          <ThreadChat chat={chat} />
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
            .map((item, key) => (
              <ThreadReply reply={item} key={key} />
            ))}
          <div className="mt-2 px-4">
            <div className="flex items-center gap-3 rounded-xl border py-2 px-3 dark:border-neutral-700">
              <Textarea
                value={content}
                onChange={(e) => setState({ content: e.target.value })}
                placeholder="답글 남기기"
                className="flex-1 dark:bg-transparent"
              />
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
      />
    </>
  )
}

export default Object.assign(Thread, { Chat: ThreadChat, Reply: ThreadReply })
