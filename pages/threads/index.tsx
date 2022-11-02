import {
  ArrowSmallUpIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import { SEO, Spinner, Textarea, Tooltip } from 'components'
import type { NextPage } from 'next'
import { useIntersectionObserver, useObjectState, useUser } from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import { Message, Modal } from 'containers'
import { HashtagIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import dayjs from 'dayjs'

interface State {
  list: Array<
    NTable.Chats & {
      user: NTable.Users
      replies: Array<
        NTable.Replies & {
          user: NTable.Users
          value?: string
          isUpdateMode?: boolean
        }
      >
      reactions: Array<NTable.Reactions & { user: NTable.Users }>
      room: NTable.Rooms
      value?: string
      isUpdateMode?: boolean
    }
  >
  isProfileOpen: boolean
  userId: string
  isLoading: boolean
  page: number
  total: number
  isCodeEditorOpen: boolean
  isSubmitting: boolean
}

const ThreadsPage: NextPage = () => {
  const [
    {
      list,
      isLoading,
      isProfileOpen,
      userId,
      page,
      total,
      isCodeEditorOpen,
      isSubmitting
    },
    setState
  ] = useObjectState<State>({
    list: [],
    isProfileOpen: false,
    userId: '',
    isLoading: true,
    page: 1,
    total: 0,
    isCodeEditorOpen: false,
    isSubmitting: false
  })
  const [user] = useUser()
  const { push } = useRouter()
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
        user:user_id (
          id,
          avatar_url,
          nickname
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
      .limit(4, { foreignTable: 'replies' })
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
    }
    setState({
      isLoading: false,
      list: page === 1 ? data : [...list, ...(data as any[])],
      page,
      total: count || 0
    })
  }

  const onEmojiSelect = (text: string) => {}

  const createReply = async () => {}

  const updateChat = async () => {}

  const updateReply = async () => {}

  const getMoreReply = async () => {}

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
      supabase.removeChannel(replies)
      supabase.removeChannel(chats)
      supabase.removeChannel(reactions)
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
          {list.map((chat, chatKey) => (
            <div key={chat.id} className="m-4">
              <div className="ml-2 mb-2 space-y-1">
                <div className="flex items-center gap-0.5">
                  <span>
                    <HashtagIcon className="h-4 w-4" />
                  </span>
                  <Link href={`/room/${chat.room.id}`}>
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
                  <Message.Avatar
                    url={chat.user.avatar_url}
                    userId={chat.user.id}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center text-sm font-medium">
                        <span>{chat.user.nickname}</span>
                        {chat.user_id === user?.id && (
                          <span className="ml-1 text-xs text-neutral-400">
                            (나)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        {dayjs(chat.created_at).locale('ko').fromNow()}
                      </span>
                    </div>
                    <div>
                      {chat.isUpdateMode ? (
                        <div>
                          <div className="rounded-lg bg-neutral-200 p-2 dark:bg-neutral-600 dark:text-neutral-200">
                            <Textarea
                              value={chat.value || ''}
                              autoFocus
                              onChange={(e) =>
                                setState({
                                  list: [
                                    ...list.slice(0, chatKey),
                                    { ...chat, value: e.target.value },
                                    ...list.slice(chatKey + 1)
                                  ]
                                })
                              }
                            />
                          </div>
                          <div className="flex gap-2 text-xs text-blue-500">
                            <button
                              onClick={() =>
                                setState({
                                  list: [
                                    ...list.slice(0, chatKey),
                                    { ...chat, value: '', isUpdateMode: false },
                                    ...list.slice(chatKey + 1)
                                  ]
                                })
                              }
                            >
                              취소
                            </button>
                            <button
                              disabled={isSubmitting}
                              onClick={updateChat}
                            >
                              저장
                            </button>
                          </div>
                        </div>
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
                            onClick={() => {}}
                            text={item.text}
                            length={item?.userList.length}
                          />
                        ))}
                        <Tooltip.AddReaction onSelect={onEmojiSelect} />
                      </Message.Reactions>
                    )}
                  </div>
                </div>
                <hr className="my-2" />
                {chat.replies.map((reply, replyKey) => (
                  <div
                    key={reply.id}
                    className="group relative flex gap-3 py-2 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <Message.Avatar
                      url={reply.user.avatar_url}
                      userId={reply.user.id}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-sm font-medium">
                          <span>{reply.user.nickname}</span>
                          {reply.user_id === user?.id && (
                            <span className="ml-1 text-xs text-neutral-400">
                              (나)
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400">
                          {dayjs(reply.created_at).locale('ko').fromNow()}
                        </span>
                      </div>
                      <div>
                        {reply.isUpdateMode ? (
                          <div>
                            <div className="rounded-lg bg-neutral-200 p-2 dark:bg-neutral-600 dark:text-neutral-200">
                              <Textarea
                                value={reply.value || ''}
                                autoFocus
                                onChange={(e) =>
                                  setState({
                                    list: [
                                      ...list.slice(0, chatKey),
                                      {
                                        ...chat,
                                        replies: [
                                          ...chat.replies.slice(0, replyKey),
                                          {
                                            ...reply,
                                            value: e.target.value
                                          },
                                          ...chat.replies.slice(replyKey + 1)
                                        ]
                                      },
                                      ...list.slice(chatKey + 1)
                                    ]
                                  })
                                }
                              />
                            </div>
                            <div className="flex gap-2 text-xs text-blue-500">
                              <button
                                onClick={() =>
                                  setState({
                                    list: [
                                      ...list.slice(0, chatKey),
                                      {
                                        ...chat,
                                        replies: [
                                          ...chat.replies.slice(0, replyKey),
                                          {
                                            ...reply,
                                            value: '',
                                            isUpdateMode: false
                                          },
                                          ...chat.replies.slice(replyKey + 1)
                                        ]
                                      },
                                      ...list.slice(chatKey + 1)
                                    ]
                                  })
                                }
                              >
                                취소
                              </button>
                              <button onClick={updateReply}>저장</button>
                            </div>
                          </div>
                        ) : (
                          <Message.Parser
                            content={reply.content}
                            updatedAt={reply.updated_at}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-2 px-4">
                  <div className="flex items-center gap-3 rounded-xl border py-2 px-3">
                    <Textarea
                      value={chat.value || ''}
                      onChange={(e) =>
                        setState({
                          list: [
                            ...list.slice(0, chatKey),
                            { ...chat, value: e.target.value },
                            ...list.slice(chatKey + 1)
                          ]
                        })
                      }
                      placeholder="답글 남기기"
                      className="flex-1 dark:bg-transparent"
                    />
                    <button
                      onClick={() => setState({ isCodeEditorOpen: true })}
                      className="group flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1.5 hover:border-neutral-600 dark:border-neutral-600 dark:bg-transparent dark:hover:border-neutral-500"
                    >
                      <CodeBracketIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 p-1.5 duration-150 hover:bg-blue-400 active:bg-blue-600 disabled:bg-neutral-400"
                      onClick={createReply}
                      disabled={isSubmitting || !chat.value}
                    >
                      <ArrowSmallUpIcon className="h-5 w-5 text-neutral-50" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
      />
    </>
  )
}

export default ThreadsPage
