import Image from 'next/image'
import type { FC } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import { supabase, useObjectState, useUser } from 'services'
import { Modal } from 'containers'

export interface Props extends ReactProps {}
interface State {
  isProfileOpen: boolean
}

const Layout: FC<Props> = ({ children }) => {
  const [{ isProfileOpen }, setState] = useObjectState<State>({
    isProfileOpen: false
  })
  const [user] = useUser()
  console.log('user', user)

  const onLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: process.env.NEXT_PUBLIC_REDIRECT_TO }
    })
  }
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="flex gap-5">
          <div className="flex h-screen w-80 flex-col divide-y border-x border-neutral-200 bg-white">
            <header className="flex h-12 items-center justify-between px-5">
              <Link href="/">
                <a>
                  <img src="/coddee-black.svg" alt="" className="h-5" />
                </a>
              </Link>
              {user ? (
                <button onClick={() => setState({ isProfileOpen: true })}>
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                </button>
              ) : (
                <button className="text-sm" onClick={onLogin}>
                  로그인
                </button>
              )}
            </header>
            <menu className="flex-1 overflow-auto">
              <ul>
                {Array.from({ length: 30 }).map((_, key) => (
                  <li key={key}>
                    <Link href="/rooms/1">
                      <a
                        className={classnames(
                          'flex h-12 items-center gap-4 px-5 hover:bg-blue-50'
                        )}
                      >
                        <Image
                          src="https://i.pravatar.cc"
                          alt=""
                          height={24}
                          width={24}
                        />
                        <span className="font-semibold">Javascript</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </menu>
          </div>
          <div className="flex-1 border-x border-neutral-200 bg-white">
            {children}
          </div>
        </div>
      </div>
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false })}
      />
    </>
  )
}

export default Layout
