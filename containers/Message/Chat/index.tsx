import type { FC } from 'react'
import dayjs from 'dayjs'
import classnames from 'classnames'
import { toast, TOAST_MESSAGE, useObjectState, useUser } from 'services'
import { Drawer, Message } from 'containers'
import { Tooltip } from 'components'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props {
  chat: NTable.Chats & {
    user: NTable.Users
    reactions: NTable.Reactions[]
    replies: Array<{
      id: string
      created_at: string
      user: { avatar_url: string }
    }>
    opengraphs: NTable.Opengraphs[]
  }
  nextUserId: string
  nextCreatedAt: string
  total: number
  index: number
  onCreateReply: (reply: {
    id: string
    created_at: string
    user: { avatar_url: string }
  }) => void
  onDeleteReply: (id: string) => void
  onNicknameClick: (mention: string) => void
}
interface State {
  isUpdateMode: boolean
  isThreadOpen: boolean
  isSubmitting: boolean
}

const MessageChat: FC<Props> = ({
  chat,
  nextCreatedAt,
  nextUserId,
  total,
  index,
  onCreateReply,
  onDeleteReply,
  onNicknameClick
}) => {
  const [{ isUpdateMode, isThreadOpen, isSubmitting }, setState, onChange] =
    useObjectState<State>({
      isUpdateMode: false,
      isThreadOpen: false,
      isSubmitting: false
    })
  const [user, setUser] = useUser()
  const { query } = useRouter()
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
        room_id: query.id
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
        room_id: query.id
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
      const { error } = await supabase
        .from('reactions')
        .insert({ user_id: user.id, chat_id: chat.id, text, room_id: query.id })
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
          room_id: query.id
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
          room_id: query.id
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
      <div
        id={String(chat.id)}
        className={classnames(
          'group relative flex gap-3 py-1 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          {
            'animate-bounce bg-blue-50': window.location.hash === `#${chat.id}`
          }
        )}
      >
        <div className="flex w-8 items-start justify-center">
          {chat.user_id !== nextUserId ? (
            <Message.Avatar url={chat.user.avatar_url} userId={chat.user_id} />
          ) : (
            <span className="invisible mt-[5px] text-2xs text-neutral-400 group-hover:visible">
              {dayjs(chat.created_at).locale('ko').format('H:mm')}
            </span>
          )}
        </div>
        <div className="flex-1">
          {chat.user_id !== nextUserId && (
            <div className="flex items-center gap-2">
              <div className="flex items-center text-sm font-medium">
                <span
                  onClick={() =>
                    onNicknameClick(
                      `@[${chat.user?.nickname}](${chat.user?.id})`
                    )
                  }
                  className="cursor-pointer"
                >
                  {chat.user?.nickname}
                </span>
                {chat.user_id === user?.id && (
                  <span className="ml-1 text-xs text-neutral-400">(나)</span>
                )}
              </div>
              <span className="text-xs text-neutral-400">
                {dayjs(chat.created_at).locale('ko').format('A H:mm')}
              </span>
            </div>
          )}
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
          {chat.opengraphs?.map((item) => (
            <Message.Opengraph {...item} key={item.id} />
          ))}
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
          {!!chat.replies?.length && (
            <div
              onClick={() => setState({ isThreadOpen: true })}
              className="group/reply mt-1 flex cursor-pointer items-center justify-between rounded border border-transparent p-1 duration-150 hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            >
              <div className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-1">
                  {[
                    ...new Set(
                      chat.replies.map((reply) => reply.user.avatar_url)
                    )
                  ].map((url, key) => (
                    <img
                      key={key}
                      src={url}
                      alt=""
                      className="h-6 w-6 rounded"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-neutral-600 hover:underline dark:text-blue-400">
                  {chat.replies.length}개의 댓글
                </span>
                <div className="text-sm text-neutral-400 group-hover/reply:hidden">
                  {dayjs(chat.replies[0].created_at).locale('ko').fromNow()}
                </div>
                <div className="hidden text-sm text-neutral-400 group-hover/reply:block">
                  스레드 보기
                </div>
              </div>
              <span className="hidden group-hover/reply:inline-block">
                <ChevronRightIcon className="h-5 w-5 text-neutral-500" />
              </span>
            </div>
          )}
        </div>

        {!isUpdateMode && (
          <div className="absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction onSelect={onEmojiSelect} />
              <Tooltip.Actions.Thread
                onClick={() => setState({ isThreadOpen: true })}
              />
              {chat.user_id === user?.id && (
                <Tooltip.Actions.Update
                  onClick={() => setState({ isUpdateMode: true })}
                />
              )}
            </div>
          </div>
        )}
      </div>
      {(!!dayjs(dayjs(chat.created_at).format('YYYY-MM-DD')).diff(
        dayjs(nextCreatedAt).format('YYYY-MM-DD'),
        'day'
      ) ||
        index === total - 1) && (
        <div className="relative z-10 mx-5 flex items-center justify-center py-5 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200 dark:before:bg-neutral-700">
          <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-1px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400 dark:bg-neutral-800">
            {dayjs(chat.created_at).format('MM월 DD일')}
          </div>
        </div>
      )}
      <Drawer.Thread
        isOpen={isThreadOpen}
        onClose={() => setState({ isThreadOpen: false })}
        chat={chat}
        updateReaction={updateReaction}
        onCreate={onCreateReply}
        onDelete={onDeleteReply}
      />
    </>
  )
}

export default MessageChat
