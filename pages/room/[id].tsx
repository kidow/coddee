import { CodePreview, SEO, Spinner, Tooltip } from 'components'
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
  TOAST_MESSAGE
} from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { Fragment, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Drawer, Modal } from 'containers'
import classnames from 'classnames'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

dayjs.extend(relativeTime)

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  isProfileOpen: boolean
  userId: string
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
  isEmojiOpen: boolean
  chatId: number
  isThreadOpen: boolean
  chatIndex: number | null
  spamCount: number
}

const RoomIdPage: NextPage = () => {
  const [
    {
      content,
      isLoading,
      isCodeEditorOpen,
      isSubmitting,
      isProfileOpen,
      userId,
      total,
      isDropdownOpen,
      chatList,
      name,
      page,
      count,
      isEmojiOpen,
      chatId,
      isThreadOpen,
      chatIndex,
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
    isProfileOpen: false,
    userId: '',
    total: 0,
    isDropdownOpen: false,
    chatList: [],
    name: '',
    page: 1,
    count: 0,
    isEmojiOpen: false,
    chatId: 0,
    isThreadOpen: false,
    chatIndex: null,
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
    const { error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, room_id: query.id, content })
    setState({ isSubmitting: false, spamCount: spamCount + 1 })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    } else setState({ content: '' })
  }

  const updateChat = async (index: number) => {
    const item = chatList[index]
    if (!item.isUpdating) {
      setState({
        chatList: [
          ...chatList
            .slice(0, index)
            .map((item) => ({ ...item, isUpdating: false })),
          { ...item, isUpdating: true, tempContent: item.content },
          ...chatList
            .slice(index + 1)
            .map((item) => ({ ...item, isUpdating: false }))
        ]
      })
      return
    }

    if (!item.tempContent?.trim()) return
    const { error } = await supabase
      .from('chats')
      .update({ content: item.tempContent })
      .eq('id', item.id)
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const onReaction = async (text: string) => {
    if (!user) return

    if (!chatId) {
      setState({ isEmojiOpen: false, chatId: 0 })
      console.error('Chat id is empty.')
      return
    }
    const chatIndex = chatList.findIndex((item) => item.id === chatId)
    if (chatIndex === -1) {
      setState({ isEmojiOpen: false, chatId: 0 })
      console.error('Chat index is empty')
      return
    }

    const reactionIndex = chatList[chatIndex].reactions.findIndex(
      (item) => item.text === text
    )
    if (reactionIndex === -1) {
      const { error } = await supabase
        .from('reactions')
        .insert({ user_id: user.id, chat_id: chatId, text, room_id: query.id })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const userIndex = chatList[chatIndex].reactions[
        reactionIndex
      ].userList.findIndex((item) => item.id === user.id)
      if (userIndex === -1) {
        const { error } = await supabase.from('reactions').insert({
          user_id: user.id,
          chat_id: chatId,
          text,
          room_id: query.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      } else {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .match({ user_id: user.id, chat_id: chatId, text, room_id: query.id })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      }
    }

    setState({ isEmojiOpen: false, chatId: 0 })
  }

  const updateReaction = async (chatIndex: number, reactionIndex: number) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const chat = chatList[chatIndex]
    const reaction = chat.reactions[reactionIndex]
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
    const timer = setInterval(() => setState({ spamCount: 0 }), 3000)
    return () => clearInterval(timer)
  }, [spamCount])

  useEffect(() => {
    if (isIntersecting && page * 100 < total) getChatList(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title="Javascript" />
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
            <Fragment key={key}>
              <div
                id={String(item.id)}
                className={classnames(
                  'group relative flex gap-3 py-1 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-700',
                  {
                    'animate-bounce bg-blue-50':
                      window.location.href === `#${item.id}`
                  }
                )}
              >
                <div className="flex w-8 items-start justify-center">
                  {item.user_id !== arr[key + 1]?.user_id ? (
                    <img
                      src={item.user.avatar_url}
                      alt=""
                      className="mt-1 h-8 w-8 cursor-pointer rounded-full"
                      onClick={() =>
                        setState({ isProfileOpen: true, userId: item.user_id })
                      }
                    />
                  ) : (
                    <span className="mt-[5px] text-2xs text-neutral-400 opacity-0 group-hover:opacity-100">
                      {dayjs(item.created_at).locale('ko').format('H:mm')}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  {item.user_id !== arr[key + 1]?.user_id && (
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
                        {dayjs(item.created_at).locale('ko').format('A H:mm')}
                      </span>
                    </div>
                  )}
                  <div>
                    {item.isUpdating ? (
                      <div>
                        <TextareaAutosize
                          value={item.tempContent}
                          className="rounded-lg bg-neutral-200 p-2 dark:bg-neutral-600 dark:text-neutral-200"
                          spellCheck={false}
                          autoFocus
                          autoComplete="off"
                          onChange={(e) =>
                            setState({
                              chatList: [
                                ...chatList.slice(0, key),
                                { ...item, tempContent: e.target.value },
                                ...chatList.slice(key + 1)
                              ]
                            })
                          }
                        />
                        <div className="flex gap-2 text-xs text-blue-500">
                          <button
                            onClick={() =>
                              setState({
                                chatList: [
                                  ...chatList.slice(0, key),
                                  {
                                    ...item,
                                    tempContent: '',
                                    isUpdating: false
                                  },
                                  ...chatList.slice(key + 1)
                                ]
                              })
                            }
                          >
                            취소
                          </button>
                          <button onClick={() => updateChat(key)}>저장</button>
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
                  {!!item.reactions?.length && (
                    <div className="mt-1 flex gap-1">
                      {item.reactions.map((reaction, reactionKey) => (
                        <Tooltip.Reaction
                          userList={reaction.userList}
                          key={reaction.id}
                          onClick={() => updateReaction(key, reactionKey)}
                          text={reaction.text}
                          length={reaction?.userList.length}
                        />
                      ))}
                      <Tooltip.AddReaction
                        onClick={() =>
                          setState({ isEmojiOpen: true, chatId: item.id })
                        }
                      />
                    </div>
                  )}
                  {!!item.replies?.length && (
                    <div
                      onClick={() =>
                        setState({ isThreadOpen: true, chatIndex: key })
                      }
                      className="group/reply mt-1 flex cursor-pointer items-center justify-between rounded border border-transparent p-1 duration-150 hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <img
                          src={item.replies[0].user.avatar_url}
                          alt=""
                          className="h-6 w-6 rounded"
                        />
                        <span className="text-sm font-semibold text-neutral-600 hover:underline dark:text-blue-400">
                          {item.replies.length}개의 댓글
                        </span>
                        <div className="text-sm text-neutral-400 group-hover/reply:hidden">
                          {dayjs(item.replies[0].created_at)
                            .locale('ko')
                            .fromNow()}
                        </div>
                        <div className="hidden text-sm text-neutral-400 group-hover/reply:block">
                          스레드 보기
                        </div>
                      </div>
                      <button className="hidden group-hover/reply:inline-block">
                        <ChevronRightIcon className="h-5 w-5 text-neutral-500" />
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className={classnames(
                    'absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-700',
                    { 'group-hover:block': !item.isUpdating }
                  )}
                >
                  <div className="flex p-0.5">
                    <Tooltip.Actions.AddReaction
                      onClick={() =>
                        setState({ isEmojiOpen: true, chatId: item.id })
                      }
                    />
                    <Tooltip.Actions.Thread
                      onClick={() =>
                        setState({ isThreadOpen: true, chatIndex: key })
                      }
                    />
                    {item.user_id === user?.id && (
                      <Tooltip.Actions.Update onClick={() => updateChat(key)} />
                    )}
                  </div>
                </div>
              </div>
              {(!!dayjs(dayjs(item.created_at).format('YYYY-MM-DD')).diff(
                dayjs(arr[key + 1]?.created_at).format('YYYY-MM-DD'),
                'day'
              ) ||
                key === arr.length - 1) && (
                <div className="relative z-10 mx-5 flex items-center justify-center py-5 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200 dark:before:bg-neutral-700">
                  <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-1px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400 dark:bg-neutral-800">
                    {dayjs(item.created_at).format('MM월 DD일')}
                  </div>
                </div>
              )}
            </Fragment>
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
          <TextareaAutosize
            value={content}
            name="content"
            onChange={onChange}
            disabled={isSubmitting}
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            className="flex-1 dark:bg-transparent"
            spellCheck={false}
            onKeyDown={(e) => {
              if (!e.shiftKey && e.keyCode === 13) {
                e.preventDefault()
                createChat()
              }
            }}
            autoComplete="off"
            ref={textareaRef}
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
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
      <Modal.Emoji
        isOpen={isEmojiOpen}
        onClose={() => setState({ isEmojiOpen: false })}
        onSelect={onReaction}
      />
      <Drawer.Thread
        isOpen={isThreadOpen}
        onClose={() => setState({ isThreadOpen: false, chatIndex: null })}
        chat={chatIndex === null ? null : chatList[chatIndex]}
        updateReaction={(reactionIndex) =>
          updateReaction(chatIndex!, reactionIndex)
        }
        onCreate={(reply) => {
          if (!chatIndex || chatIndex < 0) return
          setState({
            chatList: [
              ...chatList.slice(0, chatIndex),
              {
                ...chatList[chatIndex],
                replies: [reply, ...chatList[chatIndex].replies]
              },
              ...chatList.slice(chatIndex + 1)
            ]
          })
        }}
        onDelete={(id) => {
          if (!chatIndex || chatIndex < 0) return
          setState({
            chatList: [
              ...chatList.slice(0, chatIndex),
              {
                ...chatList[chatIndex],
                replies: chatList[chatIndex].replies.filter(
                  (item) => item.id !== id
                )
              },
              ...chatList.slice(chatIndex + 1)
            ]
          })
        }}
      />
    </>
  )
}

export default RoomIdPage
