import { SEO, Spinner, Textarea } from 'components'
import type { NextPage } from 'next'
import {
  ArrowLeftIcon,
  ArrowSmallUpIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import {
  supabase,
  useObjectState,
  useUser,
  useIntersectionObserver,
  toast,
  TOAST_MESSAGE,
  REGEXP
} from 'services'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChatMessage } from 'templates'

dayjs.extend(relativeTime)

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  total: number
  isDropdownOpen: boolean
  chatList: Array<
    NTable.Chats & {
      user: NTable.Users
      reactions: NTable.Reactions[]
      replies: Array<{
        id: string
        created_at: string
        user: { avatar_url: string }
      }>
    }
  >
  name: string
  page: number
  count: number
  spamCount: number
}

const RoomIdPage: NextPage = () => {
  const [
    {
      content,
      isLoading,
      isCodeEditorOpen,
      isSubmitting,
      total,
      isDropdownOpen,
      chatList,
      name,
      page,
      count,
      spamCount
    },
    setState,
    onChange,
    resetState
  ] = useObjectState<State>({
    content: '',
    isLoading: true,
    isCodeEditorOpen: false,
    isSubmitting: false,
    total: 0,
    isDropdownOpen: false,
    chatList: [],
    name: '',
    page: 1,
    count: 0,
    spamCount: 0
  })
  const { query, back } = useRouter()
  const [user, setUser] = useUser()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getChatList = async (page: number = 1) => {
    if (!query.id || typeof query.id !== 'string') return
    if (!isLoading) setState({ isLoading: true })
    if (page === 1) setState({ chatList: [] })
    const {
      data,
      error,
      count: total
    } = await supabase
      .from('chats')
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
      reactions (
        id,
        text,
        user_id,
        user:user_id (
          nickname
        )
      ),
      replies!replies_chat_id_fkey (
        id,
        created_at,
        user:user_id (
          avatar_url
        )
      )
    `,
        { count: 'exact' }
      )
      .eq('room_id', query.id)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'reactions' })
      .order('created_at', { ascending: false, foreignTable: 'replies' })
      .range((page - 1) * 100 + count, page * 100 - 1 + count)
    if (error) {
      console.error(error)
      return
    }
    for (const chat of data) {
      let reactions: Array<{
        id: number
        room_id: string
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
          if (index === -1)
            reactions.push({
              id: reaction.id,
              room_id: reaction.room_id,
              chat_id: reaction.chat_id,
              text: reaction.text,
              userList: [
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
            })
          else {
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
    }
    setState(
      {
        isLoading: false,
        chatList: (page === 1 ? data : [...chatList, ...(data as any[])]) || [],
        page,
        total: total || 0
      },
      () => {
        if (page === 1) window.scrollTo(0, document.body.scrollHeight)
      }
    )
  }

  const getRoom = async () => {
    if (!query.id) return
    const { data, error } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', query.id)
      .single()
    if (error) {
      console.error(error)
      return
    }
    setState({ name: data.name })
    textareaRef.current?.focus()
  }

  const createChat = async () => {
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
      return
    }
    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }
    setState({ isSubmitting: true })
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, room_id: query.id, content })
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
            chat_id: chat.id
          })
        )
      )
    }
  }

  useEffect(() => {
    getChatList()
    getRoom()
    return () => {
      resetState()
    }
  }, [query.id])

  useEffect(() => {
    const chats = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `room_id=eq.${query.id}`
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
          if (data)
            setState({
              chatList: [
                { ...payload.new, user: data, reactions: [] },
                ...chatList
              ],
              count: count + 1
            })
          if (payload.new.user_id === user?.id) {
            window.scrollTo(0, document.body.scrollHeight)
            textareaRef.current?.focus()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `room_id=eq.${query.id}`
        },
        (payload) => {
          const index = chatList.findIndex((item) => item.id === payload.new.id)
          if (index === -1) return
          setState({
            chatList: [
              ...chatList.slice(0, index),
              {
                ...chatList[index],
                isUpdating: false,
                tempContent: '',
                content: payload.new.content,
                updated_at: payload.new.updated_at
              },
              ...chatList.slice(index + 1)
            ]
          })
          toast.success('변경되었습니다.')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chats)
    }
  }, [chatList, query.id, count])

  useEffect(() => {
    const reactions = supabase
      .channel('public:reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `room_id=eq.${query.id}`
        },
        async (payload: any) => {
          const chatIndex = chatList.findIndex(
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

          const reactionIndex = chatList[chatIndex].reactions.findIndex(
            (item) => item.text === payload.new.text
          )
          setState({
            chatList: [
              ...chatList.slice(0, chatIndex),
              {
                ...chatList[chatIndex],
                reactions:
                  reactionIndex === -1
                    ? [
                        ...chatList[chatIndex].reactions,
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
                        ...chatList[chatIndex].reactions.slice(
                          0,
                          reactionIndex
                        ),
                        {
                          ...chatList[chatIndex].reactions[reactionIndex],
                          userList: [
                            ...chatList[chatIndex].reactions[reactionIndex]
                              .userList,
                            {
                              id: payload.new.user_id,
                              nickname: data.nickname
                            }
                          ]
                        },
                        ...chatList[chatIndex].reactions.slice(
                          reactionIndex + 1
                        )
                      ]
              },
              ...chatList.slice(chatIndex + 1)
            ]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions',
          filter: `room_id=eq.${query.id}`
        },
        (payload) => {
          const chatIndex = chatList.findIndex(
            (item) => item.id === payload.old.chat_id
          )
          if (chatIndex === -1) return

          const reactionIndex = chatList[chatIndex].reactions.findIndex(
            (item) => item.text === payload.old.text
          )
          if (reactionIndex === -1) return

          setState({
            chatList: [
              ...chatList.slice(0, chatIndex),
              {
                ...chatList[chatIndex],
                reactions:
                  chatList[chatIndex].reactions[reactionIndex].userList.length >
                  1
                    ? [
                        ...chatList[chatIndex].reactions.slice(
                          0,
                          reactionIndex
                        ),
                        {
                          ...chatList[chatIndex].reactions[reactionIndex],
                          userList: chatList[chatIndex].reactions[
                            reactionIndex
                          ].userList.filter(
                            (item) => item.id !== payload.old.user_id
                          )
                        },
                        ...chatList[chatIndex].reactions.slice(
                          reactionIndex + 1
                        )
                      ]
                    : chatList[chatIndex].reactions.filter(
                        (item) => item.text !== payload.old.text
                      )
              },
              ...chatList.slice(chatIndex + 1)
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(reactions)
    }
  }, [chatList, query.id])

  useEffect(() => {
    const timer = setInterval(() => {
      if (spamCount > 0) setState({ spamCount: 0 })
    }, 3000)
    return () => clearInterval(timer)
  }, [spamCount])

  useEffect(() => {
    if (isIntersecting && page * 100 < total) getChatList(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title={name} />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2">
            <button onClick={back} className="sm:hidden">
              <ArrowLeftIcon className="h-5 w-5 text-neutral-800" />
            </button>
            <span className="font-semibold">{name}</span>
          </div>
          {/* <div className="relative">
            <button
              onClick={() => setState({ isDropdownOpen: !isDropdownOpen })}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-6 right-0 z-30 rounded border bg-white p-1">
                asd
              </div>
            )}
          </div> */}
        </header>
        <main className="flex flex-1 flex-col-reverse py-3">
          {chatList.map((item, key, arr) => (
            <ChatMessage
              chat={item}
              key={key}
              nextUserId={arr[key + 1]?.user_id}
              nextCreatedAt={arr[key + 1]?.created_at}
              total={arr.length}
              index={key}
              onCreateReply={(reply) =>
                setState({
                  chatList: [
                    ...chatList.slice(0, key),
                    { ...item, replies: [reply, ...item.replies] },
                    ...chatList.slice(key + 1)
                  ]
                })
              }
              onDeleteReply={(id) =>
                setState({
                  chatList: [
                    ...chatList.slice(0, key),
                    {
                      ...item,
                      replies: item.replies.filter((item) => item.id !== id)
                    },
                    ...chatList.slice(key + 1)
                  ]
                })
              }
            />
          ))}
          {!isLoading && !chatList.length && (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
              아직 채팅이 없습니다. 첫 채팅의 주인공이 되어 보시겠어요? :)
            </div>
          )}
          {isLoading && (
            <div className="mb-4 flex items-center justify-center">
              <Spinner className="h-5 w-5 text-neutral-200 dark:text-neutral-400" />
            </div>
          )}
          <div ref={ref} />
        </main>
        <footer className="sticky bottom-16 z-20 flex min-h-[59px] w-full items-center gap-3 border-t bg-white py-3 px-5 dark:border-neutral-700 dark:bg-neutral-800 sm:bottom-0">
          <Textarea
            value={content}
            onChange={(e) => setState({ content: e.target.value })}
            disabled={isSubmitting}
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            className="flex-1 dark:bg-transparent"
            onKeyDown={(e) => {
              if (!e.shiftKey && e.keyCode === 13) {
                e.preventDefault()
                createChat()
              }
            }}
          />
          <button
            onClick={() => setState({ isCodeEditorOpen: true })}
            className="group rounded-full border bg-white p-1.5 hover:border-neutral-600 dark:border-neutral-600 dark:bg-transparent dark:hover:border-neutral-500"
          >
            <CodeBracketIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300" />
          </button>
          <button
            className="rounded-full bg-blue-500 p-1.5 duration-150 hover:bg-blue-400 active:bg-blue-600 disabled:bg-neutral-400"
            disabled={isSubmitting || !content}
            onClick={createChat}
          >
            {isSubmitting ? (
              <Spinner className="h-5 w-5 text-neutral-50" />
            ) : (
              <ArrowSmallUpIcon className="h-5 w-5 text-neutral-50" />
            )}
          </button>
        </footer>
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={content}
      />
    </>
  )
}

export default RoomIdPage
