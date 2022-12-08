import { memo, useEffect, useMemo } from 'react'
import type { FC, ChangeEvent } from 'react'
import {
  captureException,
  cheerio,
  EventListener,
  useObjectState,
  useUser
} from 'services'
import { createPortal } from 'react-dom'
import {
  ArrowUturnLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Icon, Spinner } from 'components'
import { useRouter } from 'next/router'
import classnames from 'classnames'

export interface Props {}
interface State {
  isOpen: boolean
  search: string
  roomList: NTable.Rooms[]
  chatList: Array<NTable.Chats & { user: NTable.Users; room: NTable.Rooms }>
  replyList: Array<
    NTable.Replies & {
      chat: NTable.Chats
      user: NTable.Users
      room: NTable.Rooms
    }
  >
  isLoading: boolean
}

const SearchBox: FC<Props> = () => {
  const [
    { isOpen, search, roomList, chatList, replyList, isLoading },
    setState,
    _,
    resetState
  ] = useObjectState<State>({
    isOpen: false,
    search: '',
    roomList: [],
    chatList: [],
    replyList: [],
    isLoading: false
  })
  const supabase = useSupabaseClient<Database>()
  const [user] = useUser()
  const { push } = useRouter()

  const onListener = () => {
    if (isOpen) return
    setState({ isOpen: true })
  }

  const onKeyDown = (e: globalThis.KeyboardEvent) => {
    if (e.metaKey && e.code === 'KeyK') {
      e.preventDefault()
      if (
        !document.getElementById('modal') &&
        !document.getElementById('drawer')
      )
        setState({ isOpen: true })
    }
    if (isOpen && e.key === 'Escape') resetState()
  }

  const onSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    setState({ search: e.target.value })
    if (!e.target.value) {
      setState({ roomList: [], chatList: [], replyList: [] })
      return
    }
    setState({ isLoading: true })
    const [rooms, chats, replies] = await Promise.all([
      supabase
        .from('rooms')
        .select('id, name, logo_url')
        .like('name', `%${e.target.value}%`)
        .order('name', { ascending: true })
        .limit(3),
      supabase
        .from('chats')
        .select(
          `
        id,
        content,
        room_id,
        user:user_id (
          nickname,
          avatar_url
        ),
        room:room_id (
          name,
          logo_url
        )
      `
        )
        .like('content', `%${e.target.value}%`)
        .limit(3),
      supabase
        .from('replies')
        .select(
          `
          id,
          content,
          room_id,
          chat_id,
          user:user_id (
            nickname,
            avatar_url
          ),
          room:room_id (
            name,
            logo_url
          )
      `
        )
        .like('content', `%${e.target.value}%`)
        .not('room_id', 'is', null)
        .limit(3)
    ])

    let state: Partial<State> = { isLoading: false }
    if (rooms.error) captureException(rooms.error, user)
    else state.roomList = rooms.data as any[]
    if (chats.error) captureException(chats.error, user)
    else state.chatList = chats.data as any[]
    if (replies.error) captureException(replies.error, user)
    else state.replyList = replies.data as any[]
    setState(state)
  }

  const isExisted: boolean = useMemo(
    () =>
      (!!roomList.length || !!chatList.length || !!replyList.length) &&
      !!search,
    [roomList.length, chatList.length, replyList.length, search]
  )

  useEffect(() => {
    EventListener.add('searchbox', onListener)
    return () => {
      EventListener.remove('searchbox', onListener)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!isOpen) return null
  return createPortal(
    <div
      id="searchbox"
      role="searchbox"
      className="fixed inset-0 z-30 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-0 text-center md:block">
        <div
          className="fixed inset-0 bg-black/30 transition-opacity"
          aria-hidden="true"
          onClick={() => resetState()}
        />
        <span
          className="hidden h-screen align-middle md:inline-block"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="my-[60px] inline-block w-full max-w-xl transform overflow-hidden rounded-md bg-slate-100 text-left align-top shadow-xl transition-all dark:bg-neutral-800">
          <header className="flex items-center p-3">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex h-14 flex-1 items-center rounded-md border bg-white px-3 focus-within:ring-4 dark:border-black dark:bg-black"
            >
              <label htmlFor="search-input">
                {isLoading ? (
                  <Spinner className="h-6 w-6 stroke-neutral-900 dark:stroke-neutral-400" />
                ) : (
                  <MagnifyingGlassIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-400" />
                )}
              </label>
              <input
                value={search}
                className="h-full w-full flex-1 pl-2 dark:bg-black"
                placeholder="검색..."
                onChange={onSearch}
                autoFocus
                autoComplete="off"
                maxLength={64}
                autoCorrect="off"
                autoCapitalize="off"
                enterKeyHint="go"
                type="search"
                spellCheck={false}
              />
              <button
                hidden={!search}
                type="button"
                onClick={() => setState({ search: '' })}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </form>
          </header>
          <main
            className={classnames('space-y-4 px-3', {
              'pb-3': isExisted
            })}
          >
            {isExisted ? (
              <>
                {!!roomList.length && (
                  <section>
                    <div className="mb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                      채팅방
                    </div>
                    <ul role="listbox" className="space-y-1">
                      {roomList.map((item) => (
                        <li
                          key={item.id}
                          role="option"
                          className="group flex h-14 cursor-pointer items-center gap-3 rounded bg-white px-3 shadow hover:bg-blue-500 hover:text-neutral-50 dark:bg-black dark:hover:bg-blue-500"
                          onClick={() =>
                            push(`/room/${item.id}`).then(() => resetState())
                          }
                        >
                          <img src={item.logo_url} alt="" className="h-6 w-6" />
                          <div className="flex-1">{item.name}</div>
                          <span className="hidden group-hover:inline-block">
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {!!chatList.length && (
                  <section>
                    <div className="mb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                      채팅
                    </div>
                    <ul role="listbox" className="space-y-1">
                      {chatList.map((item) => (
                        <li
                          key={item.id}
                          role="option"
                          className="group flex h-14 cursor-pointer items-center gap-3 rounded bg-white px-3 shadow hover:bg-blue-500 hover:text-neutral-50 dark:bg-black dark:hover:bg-blue-500"
                          onClick={() =>
                            push(`/room/${item.room_id}#${item.id}`).then(() =>
                              resetState()
                            )
                          }
                        >
                          <img
                            src={item.user.avatar_url || ''}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="max-w-md truncate">
                              {cheerio.getText(item.content)}
                            </div>
                            <div className="text-xs text-neutral-400 group-hover:text-neutral-300">
                              #{item.room.name}
                            </div>
                          </div>
                          <span className="hidden group-hover:inline-block">
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {!!replyList.length && (
                  <section>
                    <div className="mb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                      답글
                    </div>
                    <ul role="listbox" className="space-y-1">
                      {replyList.map((item) => (
                        <li
                          key={item.id}
                          role="option"
                          className="group flex h-14 cursor-pointer items-center gap-3 rounded bg-white px-3 shadow hover:bg-blue-500 hover:text-neutral-50 dark:bg-black dark:hover:bg-blue-500"
                          onClick={() =>
                            push(`/room/${item.room_id}#${item.chat_id}`).then(
                              () => resetState()
                            )
                          }
                        >
                          <img
                            src={item.user.avatar_url || ''}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="max-w-md truncate">
                              {cheerio.getText(item.content)}
                            </div>
                            <div className="text-xs text-neutral-400 group-hover:text-neutral-300">
                              #{item.room.name}
                            </div>
                          </div>
                          <span className="hidden group-hover:inline-block">
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              !!search &&
              !isLoading && (
                <div className="h-40 py-[36px] text-center">
                  <div className="flex items-center justify-center pb-3">
                    <Icon.NoSearch />
                  </div>
                  <div className="text-neutral-600">
                    검색 결과 없음 "<b>{search}</b>"
                  </div>
                </div>
              )
            )}
          </main>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default memo(SearchBox)
