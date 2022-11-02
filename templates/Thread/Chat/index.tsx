import { HashtagIcon } from '@heroicons/react/20/solid'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Textarea, Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import Link from 'next/link'
import type { FC } from 'react'
import { toast, TOAST_MESSAGE, useObjectState, useUser } from 'services'
import { Thread } from 'templates'

export interface Props {
  chat: NTable.Chats & {
    user: NTable.Users
    replies: Array<
      NTable.Replies & {
        user: NTable.Users
        reply_reactions: NTable.ReplyReactions[]
      }
    >
    reactions: Array<NTable.Reactions & { user: NTable.Users }>
    room: NTable.Rooms
  }
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  content: string
  isCodeEditorOpen: boolean
  isMoreOpen: boolean
}

const ThreadChat: FC<Props> = ({ chat }) => {
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

  const updateChat = async (content: string) => {
    if (isSubmitting) return

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!isUpdateMode) {
      setState({ isUpdateMode: true })
      return
    }

    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat.id)
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const createReply = async () => {}

  const updateReaction = async (key: number) => {
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

    const reaction = chat.reactions[key]
    const userIndex = reaction.userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reactions').insert({
        chat_id: chat.id,
        user_id: user.id,
        text: reaction.text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const { error } = await supabase.from('reactions').delete().match({
        user_id: user.id,
        chat_id: chat.id,
        text: reaction.text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    }
  }

  const onEmojiSelect = async (text: string) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const reactionIndex = chat.reactions.findIndex((item) => item.text === text)
    if (reactionIndex === -1) {
      const { error } = await supabase.from('reactions').insert({
        user_id: user.id,
        chat_id: chat.id,
        text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    } else {
      const userIndex = chat.reactions[reactionIndex].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { error } = await supabase.from('reactions').insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: chat.room.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
      } else {
        const { error } = await supabase.from('reactions').delete().match({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: chat.room.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
      }
    }
  }
  return (
    <>
      <div className="m-4">
        <div className="ml-2 mb-2 space-y-1">
          <div className="flex items-center gap-0.5">
            <span>
              <HashtagIcon className="h-4 w-4" />
            </span>
            <Link href={`/room/${chat.room_id}`}>
              <a className="text-sm font-bold text-neutral-700 hover:underline">
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
        <div className="rounded-xl border py-2">
          <div className="group relative flex gap-3 py-1 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            <Message.Avatar url={chat.user.avatar_url} userId={chat.user.id} />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center text-sm font-medium">
                  <span>{chat.user.nickname}</span>
                  {chat.user_id === user?.id && (
                    <span className="ml-1 text-xs text-neutral-400">(나)</span>
                  )}
                </div>
                <span className="'text-xs text-neutral-400">
                  {dayjs(chat.created_at).locale('ko').fromNow()}
                </span>
              </div>
              <div>
                {isUpdateMode ? (
                  <Message.Update
                    content={chat.content}
                    onCancel={() => setState({ isUpdateMode: false })}
                    onSave={updateChat}
                  />
                ) : (
                  <Message.Parser
                    content={chat.content}
                    updatedAt={chat.updated_at}
                  />
                )}
              </div>
              <Message.CodeBlock
                originalCode={chat.code_block}
                defaultLanguage={chat.language}
              />
              {!!chat.reactions?.length && (
                <Message.Reactions>
                  {chat.reactions.map((item, key) => (
                    <Tooltip.Reaction
                      userList={item.userList}
                      key={key}
                      onClick={() => updateReaction(key)}
                      text={item.text}
                      length={item?.userList.length}
                    />
                  ))}
                  <Tooltip.AddReaction onSelect={onEmojiSelect} />
                </Message.Reactions>
              )}
            </div>
            {!isUpdateMode && (
              <div className="absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
                <div className="flex p-0.5">
                  <Tooltip.Actions.AddReaction onSelect={onEmojiSelect} />
                  {chat.user_id === user?.id && (
                    <Tooltip.Actions.Update
                      onClick={() => setState({ isUpdateMode: true })}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <hr className="my-2" />
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
              <Thread.Reply reply={item} key={key} />
            ))}
          <div className="mt-2 px-4">
            <div className="flex items-center gap-3 rounded-xl border py-2 px-3">
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
      />
    </>
  )
}

export default ThreadChat
