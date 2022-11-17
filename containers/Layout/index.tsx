import { useEffect } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import {
  captureException,
  languageListState,
  REGEXP,
  toast,
  useObjectState,
  useUser
} from 'services'
import { Modal, Drawer, Presence } from 'containers'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Logo } from 'components'
import {
  AtSymbolIcon,
  BookmarkIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon as HomeOutlineIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { HomeIcon as HomeSolidIcon } from '@heroicons/react/24/solid'
import {
  useSupabaseClient,
  useUser as useAuth
} from '@supabase/auth-helpers-react'
import { useRecoilState } from 'recoil'

dayjs.extend(relativeTime)

export interface Props extends ReactProps {}
interface State {
  isMyInfoOpen: boolean
  isLoginOpen: boolean
  roomList: Array<
    NTable.Rooms & { newChat: string; newDate: string; newCount: number }
  >
  isListOpen: boolean
  isNewMentionCreated: boolean
  isNewThreadCreated: boolean
}

const Layout: FC<Props> = ({ children }) => {
  const [
    {
      isMyInfoOpen,
      isLoginOpen,
      roomList,
      isListOpen,
      isNewMentionCreated,
      isNewThreadCreated
    },
    setState
  ] = useObjectState<State>({
    isMyInfoOpen: false,
    isLoginOpen: false,
    roomList: [],
    isListOpen: false,
    isNewMentionCreated: false,
    isNewThreadCreated: false
  })
  const [user] = useUser()
  const { query, pathname, replace, push } = useRouter()
  const supabase = useSupabaseClient()
  const [languageList, setLanguageList] = useRecoilState(languageListState)
  const auth = useAuth()

  const getRoomList = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(
        `
      id,
      name,
      logo_url,
      chats!chats_room_id_fkey (
        content,
        code_block,
        created_at
      )
    `
      )
      .order('created_at', { ascending: true })
      .order('created_at', { ascending: false, foreignTable: 'chats' })
      .limit(1, { foreignTable: 'chats' })
    if (error) {
      captureException(error, auth)
      console.error(error)
      return
    }
    setState({
      roomList: (data as any[]).map((item) => ({
        ...item,
        newChat:
          (item.chats?.at(0)?.code_block
            ? '코드'
            : item.chats?.at(0)?.content) || '',
        newDate: item.chats?.at(0)?.created_at || '',
        newCount: 0
      }))
    })
  }

  const getLanguageList = async () => {
    if (!!languageList.length) return

    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .order('label', { ascending: true })

    if (error) {
      captureException(error, auth)
      console.error(error)
    } else setLanguageList(data)
  }

  useEffect(() => {
    getRoomList()
    getLanguageList()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('containers/layout')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload: any) => {
          if (payload.table === 'chats') {
            if (payload.eventType === 'INSERT') {
              const index = roomList.findIndex(
                (item) => item.id === payload.new.room_id
              )
              if (index === -1) return
              setState({
                roomList: [
                  ...roomList.slice(0, index),
                  {
                    ...roomList[index],
                    newChat: payload.new.code_block
                      ? '코드'
                      : payload.new.content,
                    newDate: payload.new.created_at,
                    ...(payload.new.room_id !== query.id
                      ? { newCount: roomList[index].newCount + 1 }
                      : {})
                  },
                  ...roomList.slice(index + 1)
                ]
              })
            }
          }

          if (payload.table === 'rooms') {
            if (payload.eventType === 'INSERT') {
              setState({ roomList: [...roomList, payload.new] })
              toast.info(`새로운 방이 생성되었습니다. ${payload.new?.name}`)
            }
            if (payload.eventType === 'UPDATE') {
              const index = roomList.findIndex(
                (item) => item.id === payload.new?.id
              )
              if (index === -1) return
              setState({
                roomList: [
                  ...roomList.slice(0, index),
                  { ...roomList[index], name: payload.new?.name },
                  ...roomList.slice(index + 1)
                ]
              })
              toast.info(`방 이름이 변경되었습니다. ${payload.new?.name}`)
            }
            if (payload.eventType === 'DELETE') {
              const index = roomList.findIndex(
                (item) => item.id === payload.old?.id
              )
              if (index === -1) return
              setState({
                roomList: [
                  ...roomList.slice(0, index),
                  ...roomList.slice(index + 1)
                ]
              })
              if (query.id === payload.old?.id) {
                toast.warn('현재 계신 방이 삭제되었습니다. 홈으로 이동합니다.')
                replace('/')
              } else toast.info('방이 삭제되었습니다.')
            }
          }

          if (payload.table === 'replies') {
            if (payload.eventType === 'INSERT') {
              const [{ data: chat }, { data: replies }] = await Promise.all([
                supabase
                  .from('chats')
                  .select('user_id')
                  .eq('id', payload.new.chat_id)
                  .single(),
                supabase
                  .from('replies')
                  .select('user_id')
                  .eq('chat_id', payload.new.chat_id)
              ])
              if (
                payload.new.user_id !== user?.id &&
                (chat?.user_id === user?.id ||
                  replies?.findIndex((item) => item.user_id === user?.id) !==
                    -1)
              ) {
                setState({ isNewThreadCreated: true })
              }
            }
          }

          if (payload.table === 'mentions') {
            if (payload.eventType === 'INSERT') {
              if (payload.new.mention_to === user?.id) {
                const [
                  { data: userData, error: userError },
                  { data: chatData, error: chatError }
                ] = await Promise.all([
                  supabase
                    .from('users')
                    .select('nickname, avatar_url')
                    .eq('id', payload.new.mention_from)
                    .single(),
                  supabase
                    .from('chats')
                    .select('content')
                    .eq('id', payload.new.chat_id)
                    .single()
                ])

                if (userError || chatError) {
                  if (userError) {
                    captureException(userError, auth)
                    console.error(userError)
                  }
                  if (chatError) {
                    captureException(chatError, auth)
                    console.error(chatError)
                  }
                  return
                }

                new Notification(userData?.nickname, {
                  body: chatData?.content.replace(REGEXP.MENTION, ''),
                  icon: userData?.avatar_url
                })

                if (
                  pathname !== '/mentions' &&
                  payload.new.mention_from !== user?.id
                )
                  setState({ isNewMentionCreated: true })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomList, query.id])

  useEffect(() => {
    if (pathname === '/mentions' && isNewMentionCreated)
      setState({ isNewMentionCreated: false })
    if (pathname === '/threads' && isNewThreadCreated)
      setState({ isNewThreadCreated: false })
  }, [pathname])
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="flex gap-5">
          <div
            className={classnames(
              'sticky top-0 hidden h-screen w-full flex-col divide-y border-x border-neutral-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 sm:flex sm:w-80'
            )}
          >
            <header className="flex h-12 items-center justify-between px-5">
              <Link href="/">
                <a>
                  <Logo />
                </a>
              </Link>
              {user ? (
                <button onClick={() => setState({ isMyInfoOpen: true })}>
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                </button>
              ) : (
                <button
                  className="text-sm"
                  onClick={() => setState({ isLoginOpen: true })}
                >
                  로그인
                </button>
              )}
            </header>
            <menu className="flex-1 overflow-auto">
              <ul>
                {roomList.map((item, key) => (
                  <li key={item.id}>
                    <Link href={`/room/${item.id}`}>
                      <a
                        className={classnames(
                          'flex h-16 items-center justify-between gap-4 px-5',
                          query.id === item.id
                            ? 'bg-blue-100 dark:bg-neutral-700'
                            : 'hover:bg-blue-50 dark:hover:bg-neutral-700',
                          { 'pointer-events-none': query.id === item.id }
                        )}
                        onClick={() => {
                          if (item.newCount > 0)
                            setState({
                              roomList: [
                                ...roomList.slice(0, key),
                                { ...item, newCount: 0 },
                                ...roomList.slice(key + 1)
                              ]
                            })
                        }}
                      >
                        <img src={item.logo_url} alt="" className="h-8 w-8" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div
                              className={classnames({
                                'font-semibold': query.id === item.id
                              })}
                            >
                              {item.name}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {!!item.newDate &&
                                dayjs(item.newDate).locale('ko').fromNow()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="w-56 truncate text-xs text-neutral-500 dark:text-neutral-400 sm:w-40">
                              {REGEXP.MENTION.test(item.newChat)
                                ? item.newChat.replace(REGEXP.MENTION, (v) =>
                                    v.slice(2, -39)
                                  )
                                : item.newChat}
                            </div>
                            <div className="flex h-4 justify-end">
                              {item.newCount > 0 && (
                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-2xs text-white">
                                  {item.newCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </menu>
            <footer className="sticky bottom-0 flex h-[59px]">
              <ul className="flex w-full">
                <li className="flex-1">
                  <Link href="/mentions">
                    <a
                      className={classnames(
                        'flex h-full w-full items-center justify-center text-neutral-600 dark:text-neutral-400',
                        pathname === '/mentions'
                          ? 'bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                          : 'hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
                      )}
                    >
                      <div>
                        <div className="flex justify-center">
                          <AtSymbolIcon className="h-5 w-5" />
                        </div>
                        <div className="relative text-xs">
                          <span
                            className={classnames({
                              'font-bold': pathname === '/mentions'
                            })}
                          >
                            멘션
                          </span>
                          {isNewMentionCreated && (
                            <span className="absolute right-0 top-0 -mr-2 -mt-1 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
                <li className="flex-1">
                  <Link href="/threads">
                    <a
                      className={classnames(
                        'flex h-full w-full items-center justify-center text-neutral-600 dark:text-neutral-400',
                        pathname === '/threads'
                          ? 'bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                          : 'hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
                      )}
                    >
                      <div>
                        <div className="flex justify-center">
                          <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                        </div>
                        <div className="relative text-xs">
                          <span
                            className={classnames({
                              'font-bold': pathname === '/threads'
                            })}
                          >
                            스레드
                          </span>
                          {isNewThreadCreated && (
                            <span className="absolute right-0 top-0 -mr-2 -mt-1 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
                <li className="flex-1">
                  <Link href="/saves">
                    <a
                      className={classnames(
                        'flex h-full w-full items-center justify-center text-neutral-600 dark:text-neutral-400',
                        pathname === '/saves'
                          ? 'bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                          : 'hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
                      )}
                    >
                      <div>
                        <div className="flex justify-center">
                          <BookmarkIcon className="h-5 w-5" />
                        </div>
                        <div className="relative text-xs">
                          <span
                            className={classnames({
                              'font-bold': pathname === '/saves'
                            })}
                          >
                            저장
                          </span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
                {/* <li className="flex-1">
                  <Link href="/posts">
                    <a
                      className={classnames(
                        'flex h-full w-full items-center justify-center text-neutral-600 dark:text-neutral-400',
                        pathname === '/posts'
                          ? 'bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                          : 'hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
                      )}
                    >
                      <div>
                        <div className="flex justify-center">
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </div>
                        <div className="relative text-xs">
                          <span
                            className={classnames({
                              'font-bold': pathname === '/posts'
                            })}
                          >
                            포스트
                          </span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </li> */}
              </ul>
            </footer>
          </div>
          <div className="flex flex-1 flex-col border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 sm:block sm:border-x">
            {children}
            <nav className="sticky bottom-0 z-10 flex h-[65px] border-t bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 sm:hidden">
              <button
                onClick={() => push('/')}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span>
                  {pathname === '/' ? (
                    <HomeSolidIcon className="h-6 w-6" />
                  ) : (
                    <HomeOutlineIcon className="h-6 w-6" />
                  )}
                </span>
                <span
                  className={classnames('text-xs', {
                    'font-semibold': pathname === '/'
                  })}
                >
                  홈
                </span>
              </button>
              <button
                onClick={() => setState({ isListOpen: true })}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span>
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                </span>
                <span className="text-xs">목록</span>
              </button>
              <button
                onClick={() =>
                  setState({ isMyInfoOpen: !!user, isLoginOpen: !user })
                }
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span>
                  <UserIcon className="h-6 w-6" />
                </span>
                <span className="text-xs">나</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
      <Modal.MyInfo
        isOpen={isMyInfoOpen}
        onClose={() => setState({ isMyInfoOpen: false })}
      />
      <Modal.Login
        isOpen={isLoginOpen}
        onClose={() => setState({ isLoginOpen: false })}
      />
      {isListOpen && (
        <Drawer
          isOpen={isListOpen}
          position="left"
          onClose={() => setState({ isListOpen: false })}
        >
          <ul>
            {roomList.map((item, key) => (
              <li key={item.id}>
                <Link href={`/room/${item.id}`}>
                  <a
                    className={classnames(
                      'flex h-16 items-center justify-between gap-4 px-5',
                      query.id === item.id
                        ? 'bg-blue-100 dark:bg-neutral-700'
                        : 'hover:bg-blue-50 dark:hover:bg-neutral-700',
                      { 'pointer-events-none': query.id === item.id }
                    )}
                    onClick={() => {
                      if (item.newCount > 0)
                        setState({
                          roomList: [
                            ...roomList.slice(0, key),
                            { ...item, newCount: 0 },
                            ...roomList.slice(key + 1)
                          ]
                        })
                      setState({ isListOpen: false })
                    }}
                  >
                    <img src={item.logo_url} alt="" className="h-8 w-8" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div
                          className={classnames({
                            'font-semibold': query.id === item.id
                          })}
                        >
                          {item.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {!!item.newDate &&
                            dayjs(item.newDate).locale('ko').fromNow()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-56 truncate text-xs text-neutral-500 dark:text-neutral-400 sm:w-40">
                          {item.newChat}
                        </div>
                        <div className="flex h-4 justify-end">
                          {item.newCount > 0 && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-2xs text-white">
                              {item.newCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </Drawer>
      )}

      <Presence />
    </>
  )
}

export default Layout
