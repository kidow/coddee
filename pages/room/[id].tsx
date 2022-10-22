import { CodePreview, SEO, Spinner, Tooltip } from 'components'
import type { NextPage } from 'next'
import {
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
import { Fragment, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import classnames from 'classnames'
import dayjs from 'dayjs'
import { FaceSmileIcon, PencilIcon } from '@heroicons/react/24/solid'
import { SlackSelector } from '@charkour/react-reactions'

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  isProfileOpen: boolean
  userId: string
  total: number
  isDropdownOpen: boolean
  chatList: Array<NTable.Chats & { user: NTable.Users }>
  name: string
  page: number
  count: number
  isSpamming: boolean
  isReactionOpen: boolean
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
      isSpamming,
      isReactionOpen
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
    isSpamming: false,
    isReactionOpen: false
  })
  const { query } = useRouter()
  const [user, setUser] = useUser()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

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
      )
    `,
        { count: 'exact' }
      )
      .eq('room_id', query.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * 100 + count, page * 100 - 1 + count)
    if (error) {
      console.error(error)
      return
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

  const create = async () => {
    if (isSpamming) return
    if (!user) {
      toast.info('로그인이 필요합니다.')
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
      .insert({ user_id: user?.id, room_id: query.id, content })
    setState({ isSubmitting: false, isSpamming: true })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    } else setState({ content: '' })
  }

  const update = async (index: number) => {
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

    const { error } = await supabase
      .from('chats')
      .update({ content: item.tempContent })
      .eq('id', item.id)
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({
      chatList: [
        ...chatList.slice(0, index),
        {
          ...item,
          isUpdating: false,
          tempContent: '',
          content: item.tempContent || ''
        },
        ...chatList.slice(index + 1)
      ]
    })
    toast.success('변경되었습니다.')
  }

  const isBringMore: boolean = useMemo(() => {
    if (chatList.length < 100) return false
    return page * 100 < total
  }, [page, total, chatList.length, count])

  useEffect(() => {
    getChatList()
    getRoom()
    return () => {
      resetState()
    }
  }, [query.id])

  useEffect(() => {
    const channel = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        async (payload: any) => {
          if (payload.new.room_id !== query.id) return
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
              chatList: [{ ...payload.new, user: data }, ...chatList],
              count: count + 1
            })
          if (payload.new.user_id === user?.id) {
            window.scrollTo(0, document.body.scrollHeight)
            textareaRef.current?.focus()
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatList, query.id, count])

  useEffect(() => {
    if (isSpamming) setTimeout(() => setState({ isSpamming: false }), 3000)
  }, [isSpamming])

  useEffect(() => {
    if (isIntersecting && page * 100 < total) getChatList(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title="Javascript" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">{name}</span>
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
                        {item.user?.nickname}
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
                          className="resize-none rounded-lg bg-neutral-200 p-2 dark:bg-neutral-600 dark:text-neutral-200"
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
                          <button onClick={() => update(key)}>저장</button>
                        </div>
                      </div>
                    ) : (
                      item.content.split('\n').map((v, i, arr) => (
                        <div key={i}>
                          {v}
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
                    <div className="border dark:border-none">
                      <CodePreview
                        original={item.code_block}
                        defaultLanguage={item.language}
                      />
                    </div>
                  )}
                </div>
                <div
                  className={classnames(
                    'absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-700',
                    { 'group-hover:block': !item.isUpdating }
                  )}
                >
                  <div className="relative flex">
                    {isReactionOpen && (
                      <div className="absolute top-0 -right-4 z-20 rounded-md border dark:[&>div]:!bg-neutral-900 dark:[&>div>div:nth-child(3)]:!bg-neutral-800">
                        <SlackSelector
                          onSelect={(id) => console.log('id', id)}
                          frequent={[
                            '👍',
                            '🙌',
                            '😊',
                            '🚀',
                            '👋',
                            '😭',
                            '🥳',
                            '💪'
                          ]}
                        />
                      </div>
                    )}
                    <Tooltip
                      position="top"
                      content="반응 추가"
                      size="sm"
                      theme={
                        window.localStorage.getItem('theme') === 'dark'
                          ? 'dark'
                          : 'light'
                      }
                      border={window.localStorage.getItem('theme') !== 'dark'}
                      className="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    >
                      <button
                        onClick={() => setState({ isReactionOpen: true })}
                      >
                        <FaceSmileIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                    </Tooltip>
                    {item.user_id === user?.id && (
                      <Tooltip
                        position="top"
                        size="sm"
                        content="수정"
                        theme={
                          window.localStorage.getItem('theme') === 'dark'
                            ? 'dark'
                            : 'light'
                        }
                        border={window.localStorage.getItem('theme') !== 'dark'}
                        className="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-neutral-200 dark:hover:bg-neutral-600"
                      >
                        <button onClick={() => update(key)}>
                          <PencilIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        </button>
                      </Tooltip>
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
          {isLoading ? (
            <div className="mb-4 flex items-center justify-center">
              <Spinner className="h-5 w-5 text-neutral-200 dark:text-neutral-400" />
            </div>
          ) : (
            isBringMore && (
              <div className="mb-4 flex items-center justify-center">
                <button
                  className="text-sm text-neutral-400"
                  onClick={() => getChatList(page + 1)}
                >
                  더 보기
                </button>
              </div>
            )
          )}
          <div ref={ref} />
        </main>
        <footer className="sticky bottom-0 z-20 flex min-h-[59px] w-full items-center gap-3 border-t bg-white py-3 px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <TextareaAutosize
            value={content}
            name="content"
            onChange={onChange}
            disabled={isSubmitting}
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            className="flex-1 resize-none dark:bg-transparent"
            spellCheck={false}
            onKeyDown={(e) => {
              if (!e.shiftKey && e.keyCode === 13) {
                e.preventDefault()
                create()
              }
            }}
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
            onClick={create}
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
    </>
  )
}

export default RoomIdPage
