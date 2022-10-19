import { useEffect } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import { supabase, useObjectState, useUser } from 'services'
import { Modal } from 'containers'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Logo } from 'components'

dayjs.extend(relativeTime)

export interface Props extends ReactProps {}
interface State {
  isMyInfoOpen: boolean
  isLoginOpen: boolean
  roomList: Array<
    NTable.Rooms & { newChat: string; newDate: string; newCount: number }
  >
}

const Layout: FC<Props> = ({ children }) => {
  const [{ isMyInfoOpen, isLoginOpen, roomList }, setState] =
    useObjectState<State>({
      isMyInfoOpen: false,
      isLoginOpen: false,
      roomList: []
    })
  const [user] = useUser()
  const { query, pathname } = useRouter()

  const getRoomList = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(
        `
      id,
      name,
      logo_url,
      chats (
        content,
        code_block,
        created_at
      )
    `
      )
      .order('created_at', { ascending: false, foreignTable: 'chats' })
      .limit(1, { foreignTable: 'chats' })
    if (error) {
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

  useEffect(() => {
    getRoomList()
  }, [])

  useEffect(() => {
    supabase
      .channel('*')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public' },
        (payload: any) => {
          if (payload.table !== 'chats') return
          const index = roomList.findIndex(
            (item) => item.id === payload.new.room_id
          )
          setState({
            roomList: [
              ...roomList.slice(0, index),
              {
                ...roomList[index],
                newChat: payload.new.code_block ? '코드' : payload.new.content,
                newDate: payload.new.created_at,
                ...(payload.new.room_id !== query.id
                  ? { newCount: roomList[index].newCount + 1 }
                  : {})
              },
              ...roomList.slice(index + 1)
            ]
          })
        }
      )
      .subscribe()
  }, [roomList, query.id])
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="flex gap-5">
          <div
            className={classnames(
              'sticky top-0 h-screen w-full flex-col divide-y border-x border-neutral-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 sm:w-80',
              pathname === '/' ? 'flex' : 'hidden sm:block'
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
            </menu>
          </div>
          <div
            className={classnames(
              'flex-1 border-x border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800',
              { 'hidden sm:block': pathname === '/' }
            )}
          >
            {children}
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
    </>
  )
}

export default Layout
