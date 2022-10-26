import { useEffect } from 'react'
import type { FC } from 'react'
import { Drawer, Modal } from 'containers'
import {
  supabase,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import dayjs from 'dayjs'
import TextareaAutosize from 'react-textarea-autosize'
import { CodePreview, Icon, Spinner, Tooltip } from 'components'
import { useRouter } from 'next/router'
import { ArrowSmallUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import classnames from 'classnames'

export interface Props extends DrawerProps {
  chat:
    | (NTable.Chats & {
        user: NTable.Users
        reactions: NTable.Reactions[]
      })
    | null
  updateReaction: (reactionIndex: number) => void
  onCreate: (reply: {
    id: string
    created_at: string
    user: { avatar_url: string }
  }) => void
  onDelete: (id: string) => void
}
interface State {
  content: string
  isEmojiOpen: boolean
  isCodeEditorOpen: boolean
  isProfileOpen: boolean
  userId: string
  isSubmitting: boolean
  list: Array<
    NTable.Replies & {
      user: NTable.Users
      reply_reactions: NTable.ReplyReactions[]
    }
  >
  replyId: number
}

const ThreadDrawer: FC<Props> = ({
  isOpen,
  onClose,
  chat,
  updateReaction,
  onCreate,
  onDelete
}) => {
  if (!isOpen) return null
  const [
    {
      content,
      isEmojiOpen,
      isCodeEditorOpen,
      isProfileOpen,
      userId,
      isSubmitting,
      list,
      replyId
    },
    setState,
    onChange
  ] = useObjectState<State>({
    content: '',
    isEmojiOpen: false,
    isCodeEditorOpen: false,
    isProfileOpen: false,
    userId: '',
    isSubmitting: false,
    list: [],
    replyId: 0
  })
  const [user, setUser] = useUser()
  const { query } = useRouter()

  const get = async () => {
    if (!chat) return
    const { data, error } = await supabase
      .from('replies')
      .select(
        `
        id,
        content,
        language,
        code_block,
        created_at,
        updated_at,
        user_id,
        user:user_id (
            nickname,
            avatar_url
        ),
        reply_reactions (
            id,
            text,
            user_id,
            user:user_id (
                nickname
            )
        )
    `
      )
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
      .order('created_at', { ascending: true, foreignTable: 'reply_reactions' })
    if (error) {
      console.error(error)
      return
    }
    for (const reply of data) {
      let reply_reactions: Array<{
        id: number
        reply_id: number
        text: string
        userList: Array<{ id: string; nickname: string }>
      }> = []
      // @ts-ignore
      if (reply.reply_reactions.length > 0) {
        // @ts-ignore
        for (const reaction of reply.reply_reactions) {
          const index = reply_reactions.findIndex(
            (item) => item.text === reaction.text
          )
          if (index === -1) {
            reply_reactions.push({
              id: reaction.id,
              reply_id: reaction.reply_id,
              text: reaction.text,
              userList: [
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
            })
          } else {
            const userIndex = reply_reactions[index].userList.findIndex(
              (item) => item.id === reaction.user_id
            )
            if (userIndex === -1)
              reply_reactions[index].userList = [
                ...reply_reactions[index].userList,
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
          }
        }
      }
      // @ts-ignore
      reply.reply_reactions = reply_reactions
    }
    setState({ list: (data as any) || [] })
  }

  const createReply = async () => {
    if (!chat) return
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
    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('replies')
      .insert({ user_id: user.id, chat_id: chat.id, content })
    setState({ isSubmitting: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    } else setState({ content: '' })
  }

  const updateReply = async (index: number) => {
    const item = list[index]
    if (!item.isUpdating) {
      setState({
        list: [
          ...list
            .slice(0, index)
            .map((item) => ({ ...item, isUpdating: false })),
          { ...item, isUpdating: true, tempContent: item.content },
          ...list
            .slice(index + 1)
            .map((item) => ({ ...item, isUpdating: false }))
        ]
      })
      return
    }

    if (!item.tempContent?.trim()) return
    const { error } = await supabase
      .from('replies')
      .update({ content: item.tempContent })
      .eq('id', item.id)
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const deleteReply = async (id: number) => {
    const { error } = await supabase.from('replies').delete().eq('id', id)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const onReaction = async (text: string) => {
    if (!user || !chat) return

    if (!!replyId) {
      const index = list.findIndex((item) => item.id === replyId)
      if (index === -1) {
        setState({ isEmojiOpen: false, replyId: 0 })
        console.error('Reply index is empty')
        return
      }

      const reactionIndex = list[index].reply_reactions.findIndex(
        (item) => item.text === text
      )
      if (reactionIndex === -1) {
        const { error } = await supabase.from('reply_reactions').insert({
          user_id: user.id,
          reply_id: replyId,
          text,
          chat_id: chat.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      } else {
        const userIndex = list[index].reply_reactions[
          reactionIndex
        ].userList.findIndex((item) => item.id === user.id)
        if (userIndex === -1) {
          const { error } = await supabase.from('reply_reactions').insert({
            user_id: user.id,
            reply_id: replyId,
            text,
            chat_id: chat.id
          })
          if (error) {
            console.error(error)
            toast.error(TOAST_MESSAGE.API_ERROR)
          }
        } else {
          const { error } = await supabase
            .from('reply_reactions')
            .delete()
            .match({
              user_id: user.id,
              reply_id: replyId,
              text,
              chat_id: chat.id
            })
          if (error) {
            console.error(error)
            toast.error(TOAST_MESSAGE.API_ERROR)
          }
        }
      }
    } else {
      const index = chat.reactions.findIndex((item) => item.text === text)
      if (index === -1) {
        const { error } = await supabase.from('reactions').insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: query.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      } else {
        const userIndex = chat.reactions[index].userList.findIndex(
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
          }
        }
      }
    }

    setState({ isEmojiOpen: false, replyId: 0 })
  }

  const updateReplyReaction = async (index: number, reactionIndex: number) => {
    if (!chat) return
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const reply = list[index]
    const reaction = reply.reply_reactions[reactionIndex]
    const userIndex = reaction.userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reply_reactions').insert({
        user_id: user.id,
        reply_id: reply.id,
        text: reaction.text,
        chat_id: chat.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const { error } = await supabase.from('reply_reactions').delete().match({
        user_id: user.id,
        reply_id: reply.id,
        text: reaction.text,
        chat_id: chat.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    }
  }

  useEffect(() => {
    get()
  }, [chat])

  useEffect(() => {
    if (!chat) return

    const replies = supabase
      .channel('public:replies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        async (payload: any) => {
          const { data, error } = await supabase
            .from('users')
            .select('id, nickname, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            console.error(error)
            return
          }
          if (data) {
            setState({
              list: [...list, { ...payload.new, user: data, reactions: [] }]
            })
            onCreate({
              id: payload.new.id,
              created_at: payload.new.created_at,
              user: { avatar_url: data.avatar_url }
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          const index = list.findIndex((item) => item.id === payload.new.id)
          if (index === -1) return
          setState({
            list: [
              ...list.slice(0, index),
              {
                ...list[index],
                isUpdating: false,
                tempContent: '',
                content: payload.new.content,
                updated_at: payload.new.updated_at
              },
              ...list.slice(index + 1)
            ]
          })
          toast.success('변경되었습니다.')
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          setState({ list: list.filter((item) => item.id !== payload.old.id) })
          onDelete(payload.old.id)
          toast.success('삭제되었습니다.')
        }
      )
      .subscribe()

    const replyReactions = supabase
      .channel('public:reply_reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reply_reactions',
          filter: `chat_id=eq.${chat.id}`
        },
        async (payload: any) => {
          const index = list.findIndex(
            (item) => item.id === payload.new.reply_id
          )
          if (index === -1) return
          const { data, error } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            console.error(error)
            return
          }

          const reactionIndex = list[index].reply_reactions.findIndex(
            (item) => item.text === payload.new.text
          )
          setState({
            list: [
              ...list.slice(0, index),
              {
                ...list[index],
                reply_reactions:
                  reactionIndex === -1
                    ? [
                        ...list[index].reply_reactions,
                        {
                          ...payload.new,
                          userList: [
                            { id: payload.new.user_id, nickname: data.nickname }
                          ]
                        }
                      ]
                    : [
                        ...list[index].reply_reactions.slice(0, reactionIndex),
                        {
                          ...list[index].reply_reactions[reactionIndex],
                          userList: [
                            ...list[index].reply_reactions[reactionIndex]
                              .userList,
                            {
                              id: payload.new.user_id,
                              nickname: data.nickname
                            }
                          ]
                        },
                        ...list[index].reply_reactions.slice(reactionIndex + 1)
                      ]
              },
              ...list.slice(index + 1)
            ]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reply_reactions',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          const index = list.findIndex(
            (item) => item.id === payload.old.reply_id
          )
          if (index === -1) return

          const reactionIndex = list[index].reply_reactions.findIndex(
            (item) => item.text === payload.old.text
          )
          if (reactionIndex === -1) return

          setState({
            list: [
              ...list.slice(0, index),
              {
                ...list[index],
                reply_reactions:
                  list[index].reply_reactions[reactionIndex].userList.length > 1
                    ? [
                        ...list[index].reply_reactions.slice(0, reactionIndex),
                        {
                          ...list[index].reply_reactions[reactionIndex],
                          userList: list[index].reply_reactions[
                            reactionIndex
                          ].userList.filter(
                            (item) => item.id !== payload.old.user_id
                          )
                        },
                        ...list[index].reply_reactions.slice(reactionIndex + 1)
                      ]
                    : list[index].reply_reactions.filter(
                        (item) => item.text !== payload.old.text
                      )
              },
              ...list.slice(index + 1)
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(replies)
      supabase.removeChannel(replyReactions)
    }
  }, [list, chat])
  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} position="right">
        <div>
          <div className="group relative flex items-start gap-3 p-4 hover:bg-neutral-50">
            <img
              src={chat?.user?.avatar_url}
              alt=""
              className="mt-1 h-9 w-9 cursor-pointer rounded-full"
              onClick={() =>
                setState({ isProfileOpen: true, userId: chat?.user_id })
              }
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center text-sm font-medium">
                  {chat?.user?.nickname}
                  {chat?.user_id === user?.id && (
                    <span className="ml-1 text-xs text-neutral-400">(나)</span>
                  )}
                </span>
                <span className="text-xs text-neutral-400">
                  {dayjs(chat?.created_at).locale('ko').format('A H:mm')}
                </span>
              </div>
              <div>{chat?.content}</div>
              {!!chat?.reactions?.length && (
                <div className="group mt-1 flex flex-wrap gap-1 pr-16">
                  {chat.reactions.map((item, key) => (
                    <Tooltip.Reaction
                      content={`${item.userList
                        .map((user) => user.nickname)
                        .join(', ')} 님이 반응하였습니다.`}
                      key={item.id}
                      onClick={() => updateReaction(key)}
                      text={item.text}
                      length={item?.userList.length}
                    />
                  ))}
                  <Tooltip.AddReaction
                    onClick={() => setState({ isEmojiOpen: true })}
                  />
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 hidden rounded-md border bg-white group-hover:flex">
              <button
                className="p-1"
                onClick={() => setState({ isEmojiOpen: true })}
              >
                <Icon.AddReaction />
              </button>
            </div>
          </div>
          {!!list.length && (
            <div className="relative m-4 border-t">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-white pr-2 text-xs text-neutral-400">
                {list.length}개의 댓글
              </span>
            </div>
          )}
          <div>
            {list.map((item, key) => (
              <div
                key={item.id}
                className="group relative flex items-start gap-3 py-2 pl-4 pr-6 hover:bg-neutral-50"
              >
                <img
                  src={item.user?.avatar_url}
                  alt=""
                  className="mt-1 h-9 w-9 cursor-pointer rounded-full"
                  onClick={() =>
                    setState({ isProfileOpen: true, userId: item.user_id })
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex cursor-pointer items-center text-sm font-medium">
                      <span>{item.user?.nickname}</span>
                      {item.user_id === user?.id && (
                        <span className="ml-1 text-xs text-neutral-400">
                          (나)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {dayjs(item.created_at).locale('ko').fromNow()}
                    </span>
                  </div>
                  <div>
                    {item.isUpdating ? (
                      <div>
                        <TextareaAutosize
                          className="rounded-lg bg-neutral-200 p-2"
                          spellCheck={false}
                          value={item.tempContent}
                          autoFocus
                          autoComplete="off"
                          onChange={(e) =>
                            setState({
                              list: [
                                ...list.slice(0, key),
                                { ...item, tempContent: e.target.value },
                                ...list.slice(key + 1)
                              ]
                            })
                          }
                        />
                        <div className="flex gap-2 text-xs text-blue-500">
                          <button
                            onClick={() =>
                              setState({
                                list: [
                                  ...list.slice(0, key),
                                  {
                                    ...item,
                                    tempContent: '',
                                    isUpdating: false
                                  },
                                  ...list.slice(key + 1)
                                ]
                              })
                            }
                          >
                            취소
                          </button>
                          <button onClick={() => updateReply(key)}>저장</button>
                        </div>
                      </div>
                    ) : (
                      item.content.split('\n').map((v, i, arr) => (
                        <div key={i}>
                          <span>{v}</span>
                          {!!item.updated_at && i === arr.length - 1 && (
                            <span className="ml-1 text-2xs text-neutral-400">
                              (수정됨)
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {!!item.code_block && (
                    <div className="border dark:border-transparent">
                      <CodePreview
                        original={item.code_block}
                        defaultLanguage={item.language}
                      />
                    </div>
                  )}
                  {!!item.reply_reactions?.length && (
                    <div className="mt-1 flex gap-1">
                      {item.reply_reactions.map((reaction, reactionKey) => (
                        <Tooltip.Reaction
                          content={`${reaction.userList
                            .map((item) => item.nickname)
                            .join(', ')}님 이 반응하였습니다.`}
                          key={reaction.id}
                          onClick={() => updateReplyReaction(key, reactionKey)}
                          text={reaction.text}
                          length={reaction?.userList?.length}
                        />
                      ))}
                      <Tooltip.AddReaction
                        onClick={() =>
                          setState({ isEmojiOpen: true, replyId: item.id })
                        }
                      />
                    </div>
                  )}
                </div>
                <div
                  className={classnames(
                    'absolute right-8 -top-4 z-10 hidden rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-700',
                    { 'group-hover:block': !item.isUpdating }
                  )}
                >
                  <div className="flex p-0.5">
                    <Tooltip.Actions.AddReaction
                      onClick={() =>
                        setState({ isEmojiOpen: true, replyId: item.id })
                      }
                    />
                    {item.user_id === user?.id && (
                      <>
                        <Tooltip.Actions.Update
                          onClick={() => updateReply(key)}
                        />
                        <Tooltip.Actions.Delete
                          onClick={() => deleteReply(item.id)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-2">
              <TextareaAutosize
                placeholder="메시지 보내기"
                className="flex-1 bg-transparent"
                value={content}
                name="content"
                onChange={onChange}
                spellCheck={false}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (!e.shiftKey && e.keyCode === 13) {
                    e.preventDefault()
                    createReply()
                  }
                }}
              />
              {/* <button
                onClick={() => setState({ isCodeEditorOpen: true })}
                className="rounded-full border border-transparent p-1.5 text-neutral-500 hover:border-neutral-500 hover:bg-neutral-50"
              >
                <CodeBracketIcon className="h-5 w-5" />
              </button> */}
              <button
                className={classnames(
                  'rounded-full border border-transparent p-1.5 hover:text-neutral-50',
                  { 'bg-blue-500': !!user && !!content }
                )}
                disabled={isSubmitting || !content}
                onClick={createReply}
              >
                {isSubmitting ? (
                  <Spinner className="h-5 w-5 text-neutral-500" />
                ) : (
                  <ArrowSmallUpIcon
                    className={classnames(
                      'h-5 w-5',
                      !!user && !!content
                        ? 'text-neutral-50'
                        : 'text-neutral-500'
                    )}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </Drawer>
      <Modal.Emoji
        isOpen={isEmojiOpen}
        onClose={() => setState({ isEmojiOpen: false, replyId: 0 })}
        onSelect={onReaction}
      />
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={content}
      />
    </>
  )
}

export default ThreadDrawer
