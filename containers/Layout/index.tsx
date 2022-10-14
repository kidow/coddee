import { useEffect } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import { supabase, useObjectState, useUser } from 'services'
import { Modal } from 'containers'
import { useRouter } from 'next/router'

export interface Props extends ReactProps {}
interface State {
  isMyInfoOpen: boolean
  roomList: NTable.Rooms[]
  isLoginOpen: boolean
}

const Layout: FC<Props> = ({ children }) => {
  const [{ isMyInfoOpen, roomList, isLoginOpen }, setState] =
    useObjectState<State>({
      isMyInfoOpen: false,
      roomList: [],
      isLoginOpen: false
    })
  const [user] = useUser()
  const { query } = useRouter()

  const get = async () => {
    const { data, error } = await supabase.from('rooms').select()
    if (error) console.error(error)
    setState({ roomList: data || [] })
  }

  useEffect(() => {
    get()
  }, [])
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
                  <li key={key}>
                    <Link href={`/room/${item.id}`}>
                      <a
                        className={classnames(
                          'flex h-12 items-center gap-4 px-5',
                          query.id === item.id
                            ? 'bg-blue-100'
                            : 'hover:bg-blue-50'
                        )}
                      >
                        <img src={item.logo_url} alt="" className="h-6 w-6" />
                        <span
                          className={classnames({
                            'font-semibold': query.id === item.id
                          })}
                        >
                          {item.name}
                        </span>
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
