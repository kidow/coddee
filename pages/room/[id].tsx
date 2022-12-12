import {
  BackBottom,
  Dropdown,
  Textarea,
  SEO,
  Spinner,
  Typing,
  ShortKey
} from 'components'
import type { NextPage } from 'next'
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import {
  useObjectState,
  useUser,
  useIntersectionObserver,
  toast,
  TOAST_MESSAGE,
  backdrop,
  useChatList,
  chatListState,
  typingChatListState,
  captureException,
  EventListener,
  cheerio
} from 'services'
import { useEffect, useId } from 'react'
import { useRouter } from 'next/router'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRecoilState, useSetRecoilState } from 'recoil'

dayjs.extend(relativeTime)

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  total: number
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
      name,
      page,
      count,
      spamCount
    },
    setState,
    _,
    resetState
  ] = useObjectState<State>({
    content: '',
    isLoading: true,
    isCodeEditorOpen: false,
    isSubmitting: false,
    total: 0,
    name: '',
    page: 1,
    count: 0,
    spamCount: 0
  })
  const { query, back } = useRouter()
  const [user] = useUser()
  const [list, setList] = useRecoilState(chatListState)
  const [morefetchRef, isMoreFetchIntersecting] =
    useIntersectionObserver<HTMLDivElement>()
  const supabase = useSupabaseClient<Database>()
  const { onRegex } = useChatList()
  const [backBottomRef, isBackBottomIntersecting] =
    useIntersectionObserver<HTMLDivElement>()
  const setTypingChatListState = useSetRecoilState(typingChatListState)
  const id = useId()

  const getChatList = async (page: number = 1) => {
    if (!query.id || typeof query.id !== 'string') return
    if (!isLoading) setState({ isLoading: true })
    if (page === 1) setList([])
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
      modified_code,
      modified_language,
      created_at,
      updated_at,
      deleted_at,
      user_id,
      room_id,
      user:user_id (
        nickname,
        avatar_url
      ),
      reactions (
        id,
        text,
        emoji,
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
      .eq('room_id', query.id)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'reactions' })
      .order('created_at', { ascending: false, foreignTable: 'replies' })
      .range((page - 1) * 100 + count, page * 100 - 1 + count)
    if (error) {
      captureException(error, user)
      return
    }
    for (const chat of data) {
      let reactions: Array<{
        id: number
        text: string
        emoji: string
        userList: Array<{ id: string; reactionId: number; nickname: string }>
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
              emoji: reaction.emoji,
              userList: [
                {
                  id: reaction.user_id,
                  reactionId: reaction.id,
                  nickname: reaction.user.nickname
                }
              ]
            })
          } else {
            const userIndex = reactions[index].userList.findIndex(
              (item) => item.id === reaction.user_id
            )
            if (userIndex === -1)
              reactions[index].userList = [
                ...reactions[index].userList,
                {
                  id: reaction.user_id,
                  reactionId: reaction.id,
                  nickname: reaction.user.nickname
                }
              ]
          }
        }
      }
      // @ts-ignore
      chat.reactions = reactions
    }
    setList((page === 1 ? data : [...list, ...(data as any[])]) || [])
    setState({ isLoading: false, page, total: total || 0 }, () => {
      if (page === 1)
        setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100)
    })
  }

  const getRoom = async () => {
    if (!query.id) return
    const { data, error } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', query.id)
      .single()
    if (error) {
      captureException(error, user)
      return
    }
    setState({ name: data.name })
    EventListener.emit(`quill:focus:${id}`)
  }

  const createChat = async (value?: string) => {
    if (typeof query.id !== 'string') return
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (spamCount >= 3) {
      toast.warn('도배는 자제 부탁드립니다. :)')
      return
    }

    const text = cheerio.getText(value || content).trim()
    if (!text) return
    if (text.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        room_id: query.id,
        content: value || content
      })
      .select()
      .single()
    setState({ isSubmitting: false, spamCount: spamCount + 1 })
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setList([
      {
        ...data,
        reactions: [],
        saves: [],
        replies: [],
        opengraphs: [],
        user: { nickname: user.nickname, avatar_url: user.avatar_url }
      },
      ...list
    ])
    onRegex(value || content, data.id)
    setState({ content: '' })
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
      EventListener.emit(`quill:focus:${id}`)
    }, 200)
  }

  const createCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    if (typeof query.id !== 'string') return
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user?.id || '',
        room_id: query.id,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, data.id)
    setList([
      {
        ...data,
        reactions: [],
        saves: [],
        replies: [],
        opengraphs: [],
        user: {
          nickname: user?.nickname || '',
          avatar_url: user?.avatar_url || ''
        }
      },
      ...list
    ])
    setState({ isCodeEditorOpen: false, content: '' })
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
      EventListener.emit(`quill:focus:${id}`)
    }, 200)
  }

  const onEnter = async (value: string) => {
    createChat(value)
    const channel = supabase
      .getChannels()
      .find((item) => item.topic === `realtime:is-typing:chat/${query.id}`)
    if (channel) await channel.untrack()
  }

  const onKeyDown = async () => {
    if (!user) return
    const channel = supabase
      .getChannels()
      .find((item) => item.topic === `realtime:is-typing:chat/${query.id}`)
    if (channel)
      await channel.track({
        userId: user.id,
        nickname: user.nickname,
        roomId: query.id
      })
  }

  const onFocus = (e: globalThis.KeyboardEvent) => {
    if (!e.target || !/^[A-Za-z\:\@]{1}$/.test(e.key)) return
    const target = e.target as HTMLElement

    const isNotFocusingEditor = target?.className !== 'ql-editor'
    const isModalOpen =
      Array.from(document.body.childNodes).findIndex(
        (item: any) => item.id === 'modal' || item.id === 'searchbox'
      ) === -1
    const isInputFocusing =
      ['input', 'textarea'].indexOf(target.tagName?.toLowerCase()) === -1
    const isSearchBoxOpen = e.metaKey && e.code === 'KeyK'

    if (
      isNotFocusingEditor &&
      isInputFocusing &&
      isModalOpen &&
      !isSearchBoxOpen
    )
      EventListener.emit(`quill:focus:${id}`)
  }

  const onFocusHandler = ({ detail }: any) =>
    detail
      ? document.removeEventListener('keydown', onFocus)
      : document.addEventListener('keydown', onFocus)

  useEffect(() => {
    document.addEventListener('keydown', onFocus)
    EventListener.add('focus:freeze', onFocusHandler)
    return () => {
      document.removeEventListener('keydown', onFocus)
      EventListener.remove('focus:freeze', onFocusHandler)
    }
  }, [])

  useEffect(() => {
    getChatList()
    getRoom()

    let timer: NodeJS.Timeout | undefined

    if (query.id) {
      const channel = supabase
        .channel(`is-typing:chat/${query.id}`)
        .on('presence', { event: 'join' }, ({ currentPresences }) => {
          setTypingChatListState(currentPresences)
          timer = setTimeout(async () => await channel.untrack(), 5000)
        })
        .on('presence', { event: 'leave' }, ({ currentPresences }) =>
          setTypingChatListState(currentPresences)
        )
        .subscribe()
    }

    return () => {
      setList([])
      resetState()
      const channel = supabase
        .getChannels()
        .find((item) => item.topic === `realtime:is-typing:chat/${query.id}`)
      if (channel) supabase.removeChannel(channel).then()
    }
  }, [query.id])

  useEffect(() => {
    const channel = supabase
      .channel(`pages/room/${query.id}:1`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `room_id=eq.${query.id}`
        },
        async (payload: any) => {
          if (payload.new.user_id === user?.id) return
          const { data, error } = await supabase
            .from('users')
            .select('id, nickname, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            captureException(error, user)
            return
          }
          setList([
            { ...payload.new, user: data, reactions: [], saves: [] },
            ...list
          ])
          setState({ count: count + 1 })
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
          if (payload.new.user_id === user?.id) return
          const index = list.findIndex((item) => item.id === payload.new.id)
          if (index === -1) return
          setList([
            ...list.slice(0, index),
            {
              ...list[index],
              content: payload.new.content || payload.old.content,
              updated_at: payload.new.updated_at || payload.old.updated_at,
              code_block: payload.new.code_block || payload.old.code_block,
              language: payload.new.language || payload.old.language,
              deleted_at: payload.new.deleted_at
            },
            ...list.slice(index + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `room_id=eq.${query.id}`
        },
        (payload) => {
          if (payload.old.user_id === user?.id) return
          const index = list.findIndex((item) => item.id === payload.old.id)
          setList([...list.slice(0, index), ...list.slice(index + 1)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).then()
    }
  }, [list, query.id, count])

  useEffect(() => {
    const channel = supabase
      .channel(`pages/room/${query.id}:2`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `room_id=eq.${query.id}`
        },
        async (payload: any) => {
          if (payload.new.user_id === user?.id) return
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
            captureException(error, user)
            return
          }
          const chat = list[chatIndex]

          const reactionIndex = chat.reactions.findIndex(
            (item) => item.text === payload.new.text
          )
          const reaction = chat.reactions[reactionIndex]
          setList([
            ...list.slice(0, chatIndex),
            {
              ...chat,
              reactions:
                reactionIndex === -1
                  ? [
                      ...chat.reactions,
                      {
                        ...payload.new,
                        userList: [
                          {
                            id: payload.new.user_id,
                            reactionId: payload.new.id,
                            nickname: data.nickname
                          }
                        ]
                      }
                    ]
                  : [
                      ...chat.reactions.slice(0, reactionIndex),
                      {
                        ...reaction,
                        userList: [
                          ...reaction.userList,
                          {
                            id: payload.new.user_id,
                            reactionId: payload.new.id,
                            nickname: data.nickname
                          }
                        ]
                      },
                      ...chat.reactions.slice(reactionIndex + 1)
                    ]
            },
            ...list.slice(chatIndex + 1)
          ])
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
          if (payload.old.user_id === user?.id) return
          const chatIndex = list.findIndex(
            (item) => item.id === payload.old.chat_id
          )
          if (chatIndex === -1) return

          const chat = list[chatIndex]
          const reactionIndex = chat.reactions.findIndex(
            (item) => item.text === payload.old.text
          )
          if (reactionIndex === -1) return
          const reaction = chat.reactions[reactionIndex]

          setList([
            ...list.slice(0, chatIndex),
            {
              ...chat,
              reactions:
                reaction.userList.length > 1
                  ? [
                      ...chat.reactions.slice(0, reactionIndex),
                      {
                        ...reaction,
                        userList: reaction.userList.filter(
                          (item) => item.id !== payload.old.user_id
                        )
                      },
                      ...chat.reactions.slice(reactionIndex + 1)
                    ]
                  : chat.reactions.filter(
                      (item) => item.text !== payload.old.text
                    )
            },
            ...list.slice(chatIndex + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies',
          filter: `room_id=eq.${query.id}`
        },
        async (payload) => {
          if (payload.new.user_id === user?.id || !list.length) return
          const chatIndex = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (chatIndex === -1) return
          const { data, error } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            captureException(error, user)
            return
          }
          setList([
            ...list.slice(0, chatIndex),
            {
              ...list[chatIndex],
              replies: [
                ...list[chatIndex].replies,
                {
                  id: payload.new.id,
                  created_at: payload.new.created_at,
                  user: { avatar_url: data.avatar_url }
                }
              ]
            },
            ...list.slice(chatIndex + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'replies',
          filter: `room_id=eq.${query.id}`
        },
        (payload) => {
          if (payload.old.user_id === user?.id || !list.length) return
          const chatIndex = list.findIndex(
            (item) => item.id === payload.old.chat_id
          )
          if (chatIndex === -1) return
          const replyIndex = list[chatIndex].replies.findIndex(
            (item) => item.id === payload.old.id
          )
          if (replyIndex === -1) return
          setList([
            ...list.slice(0, chatIndex),
            {
              ...list[chatIndex],
              replies: [
                ...list[chatIndex].replies.slice(0, replyIndex),
                ...list[chatIndex].replies.slice(replyIndex + 1)
              ]
            },
            ...list.slice(chatIndex + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'opengraphs'
        },
        (payload: any) => {
          const index = list.findIndex(
            (item) => item.id === payload.new.chat_id
          )
          if (index === -1) return

          setList([
            ...list.slice(0, index),
            {
              ...list[index],
              opengraphs: [...list[index].opengraphs, payload.new]
            },
            ...list.slice(index + 1)
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).then()
    }
  }, [list, query.id])

  useEffect(() => {
    const timer = setInterval(() => {
      if (spamCount > 0) setState({ spamCount: 0 })
    }, 3000)
    return () => clearInterval(timer)
  }, [spamCount])

  useEffect(() => {
    if (isMoreFetchIntersecting && page * 100 < total) getChatList(page + 1)
  }, [isMoreFetchIntersecting])
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
          <Dropdown
            label={
              <EllipsisVerticalIcon className="h-5 w-5 text-neutral-400" />
            }
          >
            <li
              className="flex items-center justify-between rounded-lg p-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900"
              onClick={() => EventListener.emit('searchbox')}
            >
              <span className="text-slate-600 dark:text-slate-400">검색</span>
              <div className="flex gap-1">
                <ShortKey />
                <kbd>K</kbd>
              </div>
            </li>
          </Dropdown>
        </header>
        <main className="flex flex-1 flex-col-reverse py-3">
          <div ref={backBottomRef} />
          {list.map((_, key) => (
            <Message.Chat key={key} chatIndex={key} />
          ))}
          {!isLoading && !list.length && (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
              아직 채팅이 없습니다. 첫 채팅의 주인공이 되어 보시겠어요? :)
            </div>
          )}
          {isLoading && (
            <div className="mb-4 flex items-center justify-center">
              <Spinner className="h-8 w-8 stroke-neutral-200 dark:stroke-neutral-400" />
            </div>
          )}
          <div ref={morefetchRef} />
        </main>
        <footer className="sticky bottom-16 z-20 min-h-[59px] w-full border-t bg-white py-3 px-5 dark:border-neutral-700 dark:bg-neutral-800 sm:bottom-0">
          <div className="flex items-center gap-3">
            <div className="max-w-[682px] flex-1">
              <Textarea
                value={content}
                onChange={(content) => setState({ content })}
                readOnly={isSubmitting}
                onEnter={onEnter}
                onKeyDown={onKeyDown}
                id={id}
              />
            </div>
            <Message.Button.Code
              onClick={() => setState({ isCodeEditorOpen: true })}
            />
            <Message.Button.Submit
              disabled={isSubmitting || !content}
              onClick={() => createChat()}
              loading={isSubmitting}
            />
          </div>
          <Typing source={`chat:${query.id}`} />
        </footer>
      </div>
      <BackBottom isIntersecting={isBackBottomIntersecting} />
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={content}
        onSubmit={createCodeChat}
        typingSource="chat"
      />
    </>
  )
}

export default RoomIdPage
