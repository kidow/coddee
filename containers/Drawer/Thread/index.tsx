import { useEffect } from 'react'
import type { FC } from 'react'
import { Drawer, Modal, Message } from 'containers'
import { REGEXP, toast, TOAST_MESSAGE, useObjectState, useUser } from 'services'
import dayjs from 'dayjs'
import { Spinner, Textarea, Tooltip } from 'components'
import { useRouter } from 'next/router'
import { ArrowSmallUpIcon } from '@heroicons/react/24/outline'
import classnames from 'classnames'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends DrawerProps {
  chat:
    | (NTable.Chats & {
        user: NTable.Users
        reactions: NTable.Reactions[]
        opengraphs: NTable.Opengraphs[]
        saves: NTable.Saves[]
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
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  list: Array<
    NTable.Replies & {
      user: NTable.Users
      reply_reactions: NTable.ReplyReactions[]
      opengraphs: NTable.Opengraphs[]
      saves: NTable.Saves[]
    }
  >
  spamCount: number
  isUpdateMode: boolean
  isUpdating: boolean
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
      isCodeEditorOpen,
      isSubmitting,
      list,
      spamCount,
      isUpdateMode,
      isUpdating
    },
    setState
  ] = useObjectState<State>({
    content: '',
    isCodeEditorOpen: false,
    isSubmitting: false,
    list: [],
    spamCount: 0,
    isUpdateMode: false,
    isUpdating: false
  })
  const supabase = useSupabaseClient()
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
        chat_id,
        user:user_id (
          id,
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
        ),
        opengraphs (
          id,
          title,
          description,
          site_name,
          url,
          image
        ),
        saves!saves_reply_id_fkey (
          id
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

    if (spamCount >= 3) {
      toast.warn('도배는 자제 부탁드립니다. :)')
      return
    }
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
    const { data: reply, error } = await supabase
      .from('replies')
      .insert({ user_id: user.id, chat_id: chat.id, content })
      .select()
      .single()
    setState({ isSubmitting: false, spamCount: spamCount + 1 })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    } else setState({ content: '' })

    if (REGEXP.MENTION.test(content)) {
      const mentions = content
        .match(REGEXP.MENTION)
        ?.filter((id) => id !== user.id)
      if (!mentions) return

      await Promise.all(
        mentions.map((id) =>
          supabase.from('mentions').insert({
            mention_to: id.slice(-37, -1),
            mention_from: user.id,
            chat_id: chat.id,
            reply_id: reply.id
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
            reply_id: reply.id,
            room_id: query.id
          })
        )
    }
  }

  const onEmojiSelect = async (text: string) => {
    if (!user || !chat) return

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

  const updateChat = async (content: string) => {
    if (isUpdating) return

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

    setState({ isUpdating: true })
    const { error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat?.id)
    setState({ isUpdating: false, isUpdateMode: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    }
  }

  const deleteChat = async () => {
    if (!!list.length) {
      const { error } = await supabase
        .from('chats')
        .update({
          // @ts-ignore
          deleted_at: new Date().toISOString().toLocaleString('ko-KR')
        })
        .eq('id', chat?.id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    } else {
      const { error } = await supabase.from('chats').delete().eq('id', chat?.id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      onClose()
    }
  }

  useEffect(() => {
    get()
  }, [chat])

  useEffect(() => {
    const timer = setInterval(() => {
      if (spamCount > 0) setState({ spamCount: 0 })
    }, 3000)
    return () => clearInterval(timer)
  }, [spamCount])

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
              list: [
                ...list,
                { ...payload.new, user: data, reactions: [], saves: [] }
              ]
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
                content: payload.new.content,
                updated_at: payload.new.updated_at
              },
              ...list.slice(index + 1)
            ]
          })
          if (payload.new.user_id === user?.id) toast.success('변경되었습니다.')
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
          if (payload.old.user_id === user?.id) toast.success('삭제되었습니다.')
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

    const opengraphs = supabase
      .channel('public:opengraphs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'oepngraphs',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload: any) => {
          const index = list.findIndex(
            (item) => item.id === payload.new.reply_id
          )
          if (index === -1) return

          setState({
            list: [
              ...list.slice(0, index),
              {
                ...list[index],
                opengraphs: [...list[index].opengraphs, payload.new]
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
      supabase.removeChannel(opengraphs)
    }
  }, [list, chat])
  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} position="right">
        <div>
          <div className="group relative flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            <Message.Avatar
              url={chat?.user.avatar_url || ''}
              userId={chat?.user_id || ''}
              deletedAt={chat?.deleted_at}
            />
            {!!chat?.deleted_at ? (
              <div className="mt-0.5 flex h-9 items-center text-sm text-neutral-400">
                이 메시지는 삭제되었습니다.
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center text-sm font-medium">
                    {chat?.user?.nickname}
                    {chat?.user_id === user?.id && (
                      <span className="ml-1 text-xs text-neutral-400">
                        (나)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {dayjs(chat?.created_at).locale('ko').format('A H:mm')}
                  </span>
                </div>
                <div>
                  {isUpdateMode ? (
                    <Message.Update
                      content={chat?.content || ''}
                      onCancel={() => setState({ isUpdateMode: false })}
                      onSave={updateChat}
                    />
                  ) : (
                    <Message.Parser
                      content={chat?.content || ''}
                      updatedAt={chat?.updated_at || ''}
                    />
                  )}
                </div>
                <Message.CodeBlock
                  originalCode={chat?.code_block}
                  defaultLanguage={chat?.language}
                />
                {chat?.opengraphs?.map((item) => (
                  <Message.Opengraph {...item} key={item.id} />
                ))}
                {!!chat?.reactions?.length && (
                  <Message.Reactions>
                    {chat.reactions.map((item, key) => (
                      <Tooltip.Reaction
                        userList={item.userList}
                        key={item.id}
                        onClick={() => updateReaction(key)}
                        text={item.text}
                        length={item?.userList.length}
                      />
                    ))}
                    <Tooltip.AddReaction onSelect={onEmojiSelect} />
                  </Message.Reactions>
                )}
              </div>
            )}
            {!chat?.deleted_at && !isUpdateMode && (
              <div className="absolute top-4 right-4 z-10 hidden rounded-lg border bg-white group-hover:flex dark:border-neutral-800 dark:bg-neutral-700">
                <div className="flex p-0.5">
                  <Tooltip.Actions.AddReaction
                    onSelect={onEmojiSelect}
                    position="bottom"
                  />
                  {chat?.user_id === user?.id && (
                    <>
                      <Tooltip.Actions.Update
                        onClick={() => setState({ isUpdateMode: true })}
                        position="bottom"
                      />
                      <Tooltip.Actions.Delete onClick={deleteChat} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {!!list.length && (
            <div className="relative m-4 border-t dark:border-neutral-700">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-white pr-2 text-xs text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                {list.length}개의 댓글
              </span>
            </div>
          )}
          <div>
            {list.map((item, key) => (
              <Message.Reply
                reply={item}
                key={key}
                onSave={(data) =>
                  setState({
                    list: [
                      ...list.slice(0, key),
                      { ...item, saves: data ? [data] : [] },
                      ...list.slice(key + 1)
                    ]
                  })
                }
              />
            ))}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700">
              <Textarea
                placeholder="메시지 보내기"
                className="flex-1 bg-transparent"
                value={content}
                onChange={(e) => setState({ content: e.target.value })}
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
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={content}
      />
    </>
  )
}

export default ThreadDrawer
