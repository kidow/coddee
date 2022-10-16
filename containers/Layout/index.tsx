import type { FC } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import { roomState, useObjectState, useUser } from 'services'
import { Modal } from 'containers'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRecoilState } from 'recoil'

dayjs.extend(relativeTime)

export interface Props extends ReactProps {}
interface State {
  isMyInfoOpen: boolean
  isLoginOpen: boolean
}

const Layout: FC<Props> = ({ children }) => {
  const [{ isMyInfoOpen, isLoginOpen }, setState] = useObjectState<State>({
    isMyInfoOpen: false,
    isLoginOpen: false
  })
  const [user] = useUser()
  const { query } = useRouter()
  const [roomList, setRoomList] = useRecoilState(roomState)
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="flex gap-5">
          <div className="sticky top-0 flex h-screen w-80 flex-col divide-y border-x border-neutral-200 bg-white">
            <header className="flex h-12 items-center justify-between px-5">
              <Link href="/">
                <a>
                  <img src="/coddee-black.svg" alt="" className="h-5" />
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
                            ? 'bg-blue-100'
                            : 'hover:bg-blue-50'
                        )}
                        onClick={() => {
                          if (item.newCount > 0)
                            setRoomList([
                              ...roomList.slice(0, key),
                              { ...item, newCount: 0 },
                              ...roomList.slice(key + 1)
                            ])
                        }}
                      >
                        <img src={item.logo_url} alt="" className="h-8 w-8" />
                        <div className="flex-1">
                          <div
                            className={classnames({
                              'font-semibold': query.id === item.id
                            })}
                          >
                            {item.name}
                          </div>
                          <div className="w-40 truncate text-xs text-neutral-500">
                            {item.recentMessage}
                          </div>
                        </div>
                        {!!item.chats.length && (
                          <div className="space-y-1 text-right">
                            <div className="text-xs text-neutral-500">
                              {dayjs(item.chats[0].created_at)
                                .locale('ko')
                                .fromNow()}
                            </div>
                            <div className="flex h-4 justify-end">
                              {item.newCount > 0 && (
                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-2xs text-white">
                                  {item.newCount}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </menu>
          </div>
          <div id="div" className="flex-1 border-x border-neutral-200 bg-white">
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
