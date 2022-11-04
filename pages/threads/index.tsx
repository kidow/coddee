import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import { SEO, Spinner } from 'components'
import type { NextPage } from 'next'
import {
  toast,
  useIntersectionObserver,
  useObjectState,
  useUser
} from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import classnames from 'classnames'
import { Thread } from 'templates'

interface State {
  list: Array<
    NTable.Chats & {
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
  >
  isLoading: boolean
  page: number
  total: number
}

const ThreadsPage: NextPage = () => {
  const [{ list, isLoading, page, total }, setState] = useObjectState<State>({
    list: [],
    isLoading: true,
    page: 1,
    total: 0
  })
  const [user] = useUser()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()
  const supabase = useSupabaseClient()

  const get = async (page: number = 1) => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setState({ isLoading: false })
      return
    }
    if (!isLoading) setState({ isLoading: true })
    const { data, error, count } = await supabase
      .from('chats')
      .select(
        `
      id,
      content,
      created_at,
      code_block,
      language,
      user_id,
      room_id,
      updated_at,
      deleted_at,
      user:user_id (
        id,
        nickname,
        avatar_url
      ),
      replies!replies_chat_id_fkey!inner (
        id,
        content,
        created_at,
        code_block,
        language,
        user_id,
        updated_at,
        chat_id,
        user:user_id (
          id,
          avatar_url,
          nickname
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
        )
      ),
      reactions (
        id,
        text,
        user_id,
        user:user_id (
          nickname
        )
      ),
      room:room_id (
        id,
        name
      ),
      opengraphs (
        id,
        title,
        description,
        site_name,
        url,
        image
      ),
      saves (
        id
      )
    `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'reactions' })
      .order('created_at', { ascending: true, foreignTable: 'replies' })
      .or(`user_id.eq.${user.id}`, { foreignTable: 'replies' })
      .range((page - 1) * 8, page * 8 - 1)
    if (error) {
      console.error(error)
      setState({ isLoading: false })
      return
    }
    for (const chat of data) {
      let reactions: Array<{
        id: number
        text: string
        userList: Array<{ id: string; nickname: string }>
      }> = []
      // @ts-ignore
      if (chat.reactions.length > 0) {
        // @ts-ignore
        for (const reaction of chat.reactions) {
          const index = reactions.findIndex(
            (item) => item.text === reaction.text
          )
          if (index === -1) {
            reactions.push({
              id: reaction.id,
              text: reaction.text,
              userList: [
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
            })
          } else {
            const userIndex = reactions[index].userList.findIndex(
              (item) => item.id === reaction.user_id
            )
            if (userIndex === -1)
              reactions[index].userList = [
                ...reactions[index].userList,
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
          }
        }
      }
      // @ts-ignore
      chat.reactions = reactions

      // @ts-ignore
      for (const reply of chat.replies) {
        let replyReactions: Array<{
          id: number
          text: string
          userList: Array<{ id: string; nickname: string }>
        }> = []
        if (reply.reply_reactions.length > 0) {
          for (const replyReaction of reply.reply_reactions) {
            const index = replyReactions.findIndex(
              (item) => item.text === replyReaction.text
            )
            if (index === -1) {
              replyReactions.push({
                id: replyReaction.id,
                text: replyReaction.text,
                userList: [
                  {
                    id: replyReaction.user_id,
                    nickname: replyReaction.user.nickname
                  }
                ]
              })
            } else {
              const userIndex = replyReactions[index].userList.findIndex(
                (item) => item.id === replyReaction.user_id
              )
              if (userIndex === -1)
                replyReactions[index].userList = [
                  ...replyReactions[index].userList,
                  {
                    id: replyReaction.user_id,
                    nickname: replyReaction.user.nickname
                  }
                ]
            }
          }
        }
        reply.reply_reactions = replyReactions
      }
    }
    setState({
      isLoading: false,
      list: page === 1 ? data : [...list, ...(data as any[])],
      page,
      total: count || 0
    })
  }

  useEffect(() => {
    get()
  }, [])

  useEffect(() => {
    const chats = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats'
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
                code_block: payload.new.code_block,
                language: payload.new.language,
                updated_at: payload.new.updated_at
              },
              ...list.slice(index + 1)
            ]
          })
          if (payload.new.user_id === user?.id) toast.success('변경되었습니다.')
        }
      )
      .subscribe()

    const reactions = supabase
      .channel('public:reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions'
        },
        async (payload: any) => {
          const chatIndex = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (chatIndex === -1) return

          const { data, error } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            console.error(error)
            return
          }

          const reactionIndex = list[chatIndex].reactions.findIndex(
            (item) => item.text === payload.new.text
          )
          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                reactions:
                  reactionIndex === -1
                    ? [
                        ...list[chatIndex].reactions,
                        {
                          ...payload.new,
                          userList: [
                            { id: payload.new.user_id, nickname: data.nickname }
                          ]
                        }
                      ]
                    : [
                        ...list[chatIndex].reactions.slice(0, reactionIndex),
                        {
                          ...list[chatIndex].reactions[reactionIndex],
                          userList: [
                            ...list[chatIndex].reactions[reactionIndex]
                              .userList,
                            {
                              id: payload.new.user_id,
                              nickname: data.nickname
                            }
                          ]
                        },
                        ...list[chatIndex].reactions.slice(reactionIndex + 1)
                      ]
              },
              ...list.slice(chatIndex + 1)
            ]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions'
        },
        (payload) => {
          const chatIndex = list.findIndex(
            (item) => item.id == payload.old.chat_id
          )
          if (chatIndex === -1) return

          const reactionIndex = list[chatIndex].reactions.findIndex(
            (item) => (item.text = payload.old.text)
          )
          if (reactionIndex === -1) return

          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                reactions:
                  list[chatIndex].reactions[reactionIndex].userList.length > 1
                    ? [
                        ...list[chatIndex].reactions.slice(0, reactionIndex),
                        {
                          ...list[chatIndex].reactions[reactionIndex],
                          userList: list[chatIndex].reactions[
                            reactionIndex
                          ].userList.filter(
                            (item) => item.id !== payload.old.user_id
                          )
                        },
                        ...list[chatIndex].reactions.slice(reactionIndex + 1)
                      ]
                    : list[chatIndex].reactions.filter(
                        (item) => item.text !== payload.old.text
                      )
              },
              ...list.slice(chatIndex + 1)
            ]
          })
        }
      )
      .subscribe()

    const replies = supabase
      .channel('public:replies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies'
        },
        async (payload: any) => {
          const index = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (index === -1) return

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
                ...list.slice(0, index),
                {
                  ...list[index],
                  replies: [
                    ...list[index].replies,
                    { ...payload.new, user: data, reply_reactions: [] }
                  ]
                },
                ...list.slice(index + 1)
              ]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'replies'
        },
        (payload) => {
          const chatIndex = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (chatIndex === -1) return

          const replyIndex = list[chatIndex].replies.findIndex(
            (item) => item.id === payload.new.id
          )
          if (replyIndex === -1) return

          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                replies: [
                  ...list[chatIndex].replies.slice(0, replyIndex),
                  {
                    ...list[chatIndex].replies[replyIndex],
                    content: payload.new.content,
                    updated_at: payload.new.updated_at
                  },
                  ...list[chatIndex].replies.slice(replyIndex + 1)
                ]
              },
              ...list.slice(chatIndex + 1)
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
          table: 'replies'
        },
        (payload) => {
          const chatIndex = list.findIndex(
            (item) => item.id === payload.old.chat_id
          )
          if (chatIndex === -1) return

          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                replies: list[chatIndex].replies.filter(
                  (item) => item.id !== payload.old.id
                )
              },
              ...list.slice(chatIndex + 1)
            ]
          })

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
          table: 'reply_reactions'
        },
        async (payload: any) => {
          const chatIndex = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (chatIndex === -1) return

          const replyIndex = list[chatIndex].replies.findIndex(
            (item) => item.id === payload.new.reply_id
          )
          if (replyIndex === -1) return

          const { data, error } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            console.error(error)
            return
          }

          const reactionIndex = list[chatIndex].replies[
            replyIndex
          ].reply_reactions.findIndex((item) => item.text === payload.new.text)
          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                replies: [
                  ...list[chatIndex].replies.slice(0, replyIndex),
                  {
                    ...list[chatIndex].replies[replyIndex],
                    reply_reactions:
                      reactionIndex === -1
                        ? [
                            ...list[chatIndex].replies[replyIndex]
                              .reply_reactions,
                            {
                              ...payload.new,
                              userList: [
                                {
                                  id: payload.new.user_id,
                                  nickname: data.nickname
                                }
                              ]
                            }
                          ]
                        : [
                            ...list[chatIndex].replies[
                              replyIndex
                            ].reply_reactions.slice(0, reactionIndex),
                            {
                              ...list[chatIndex].replies[replyIndex]
                                .reply_reactions[reactionIndex],
                              userList: [
                                ...list[chatIndex].replies[replyIndex]
                                  .reply_reactions[reactionIndex].userList,
                                {
                                  id: payload.new.user_id,
                                  nickname: data.nickname
                                }
                              ]
                            },
                            ...list[chatIndex].replies[
                              replyIndex
                            ].reply_reactions.slice(reactionIndex + 1)
                          ]
                  },
                  ...list[chatIndex].replies.slice(replyIndex + 1)
                ]
              },
              ...list.slice(chatIndex + 1)
            ]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reply_reactions' },
        (payload) => {
          const chatIndex = list.findIndex(
            (item) => item.id === payload.old.chat_id
          )
          if (chatIndex === -1) return

          const replyIndex = list[chatIndex].replies.findIndex(
            (item) => item.id === payload.old.reply_id
          )
          if (replyIndex === -1) return

          const reactionIndex = list[chatIndex].replies[
            replyIndex
          ].reply_reactions.findIndex((item) => item.text === payload.old.text)
          if (reactionIndex === -1) return

          setState({
            list: [
              ...list.slice(0, chatIndex),
              {
                ...list[chatIndex],
                replies: [
                  ...list[chatIndex].replies.slice(0, replyIndex),
                  {
                    ...list[chatIndex].replies[replyIndex],
                    reply_reactions:
                      list[chatIndex].replies[replyIndex].reply_reactions[
                        reactionIndex
                      ].userList.length > 1
                        ? [
                            ...list[chatIndex].replies[
                              replyIndex
                            ].reply_reactions.slice(0, reactionIndex),
                            {
                              ...list[chatIndex].replies[replyIndex]
                                .reply_reactions[reactionIndex],
                              userList: list[chatIndex].replies[
                                replyIndex
                              ].reply_reactions[reactionIndex].userList.filter(
                                (item) => item.id !== payload.old.user_id
                              )
                            },
                            ...list[chatIndex].replies[
                              replyIndex
                            ].reply_reactions.slice(reactionIndex + 1)
                          ]
                        : list[chatIndex].replies[
                            replyIndex
                          ].reply_reactions.filter(
                            (item) => item.text !== payload.old.text
                          )
                  },
                  ...list[chatIndex].replies.slice(replyIndex + 1)
                ]
              },
              ...list.slice(chatIndex + 1)
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chats)
      supabase.removeChannel(reactions)
      supabase.removeChannel(replies)
      supabase.removeChannel(replyReactions)
    }
  }, [list])

  useEffect(() => {
    if (isIntersecting && page * 8 < total) get(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title="스레드" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">스레드</span>
        </header>
        <main className="flex-1">
          {list.map((item, key) => (
            <Thread.Chat chat={item} key={key} />
          ))}
          {!isLoading && !list.length && (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-lg font-bold">
                  회원님이 속한 스레드를 확인할 수 있습니다.
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-500">
                  {!user
                    ? '로그인이 필요합니다.'
                    : '아직은 스레드가 하나도 없네요.'}
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div
              className={classnames(
                'flex items-center justify-center',
                !!list.length ? 'h-12' : 'h-full'
              )}
            >
              <Spinner className="h-5 w-5 text-neutral-300 dark:text-neutral-400" />
            </div>
          )}
          <div ref={ref} />
        </main>
      </div>
    </>
  )
}

export default ThreadsPage
