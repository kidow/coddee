import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import { SEO, Spinner } from 'components'
import type { NextPage } from 'next'
import { useIntersectionObserver, useObjectState, useUser } from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import classnames from 'classnames'
import { Modal } from 'containers'
import { Thread } from 'templates'

interface State {
  list: Array<
    NTable.Chats & {
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
      updated_at,
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
      )
    `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'reactions' })
      .order('created_at', { ascending: true, foreignTable: 'replies' })
      .or(`user_id.eq.${user.id},user_id.eq.${user.id}`, {
        foreignTable: 'replies'
      })
      .range((page - 1) * 8, page * 8 - 1)
    if (error) {
      console.error(error)
      setState({ isLoading: false })
      return
    }
    for (const chat of data) {
      let reactions: Array<{
        id: number
        chat_id: number
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
              chat_id: reaction.chat_id,
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
        { event: 'UPDATE', schema: 'public', table: 'chats' },
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
        }
      )
      .subscribe()

    const replies = supabase
      .channel('public:replies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'replies' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const chatIndex = list.findIndex(
              (item) => item.id === payload.new.chat_id
            )
            if (chatIndex === -1) {
            }
            setState({})
          }

          if (payload.eventType === 'UPDATE') {
          }

          if (payload.eventType === 'DELETE') {
          }
        }
      )
      .subscribe()

    const reactions = supabase
      .channel('public:reactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        (payload) => {}
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chats)
      supabase.removeChannel(reactions)
      supabase.removeChannel(replies)
    }
  }, [list])
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
                <div className="text-sm text-neutral-600">
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
