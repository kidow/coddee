import { CodePreview, SEO, Spinner } from 'components'
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
  useIntersectionObserver
} from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { Fragment, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import classnames from 'classnames'
import dayjs from 'dayjs'

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
      count
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
    count: 0
  })
  const { query } = useRouter()
  const [user, setUser] = useUser()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()

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
  }

  const create = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setUser(null)
      alert('세션이 만료되었습니다. 다시 로그인을 해주세요.')
      return
    }
    if (!content.trim()) return
    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, room_id: query.id, content })
    setState({ isSubmitting: false })
    if (error) console.error(error)
    else setState({ content: '' })
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
          if (payload.new.user_id === user?.id)
            window.scrollTo(0, document.body.scrollHeight)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatList, query.id, count])
  return (
    <>
      <SEO title="Javascript" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-5">
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
                  'group flex gap-3 py-1 px-5 hover:bg-neutral-50',
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
                      {!!item.updated_at && (
                        <span className="text-xs text-neutral-400">
                          (수정됨)
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    {item.content.split('\n').map((v, i) => (
                      <div key={i}>{v}</div>
                    ))}
                  </div>
                  {!!item.code_block && (
                    <div className="border">
                      <CodePreview
                        original={item.code_block}
                        defaultLanguage={item.language}
                      />
                    </div>
                  )}
                </div>
              </div>
              {(!!dayjs(dayjs(item.created_at).format('YYYY-MM-DD')).diff(
                dayjs(arr[key + 1]?.created_at).format('YYYY-MM-DD'),
                'day'
              ) ||
                key === arr.length - 1) && (
                <div className="relative z-10 mx-5 flex items-center justify-center py-5 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200">
                  <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-1px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400">
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
              <Spinner className="h-5 w-5 text-neutral-200" />
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
        <footer className="sticky bottom-0 z-20 flex min-h-[59px] w-full items-center gap-3 border-t bg-white py-3 px-5">
          <TextareaAutosize
            value={content}
            name="content"
            onChange={onChange}
            disabled={isSubmitting}
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            className="flex-1 resize-none"
            spellCheck={false}
            onKeyDown={(e) => {
              if (!e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                create()
              }
            }}
          />
          <button
            onClick={() => setState({ isCodeEditorOpen: true })}
            className="group rounded-full border bg-white p-1.5 hover:border-neutral-600"
          >
            <CodeBracketIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700" />
          </button>
          <button
            className="rounded-full bg-blue-500 p-1.5 duration-150 hover:bg-blue-400 active:bg-blue-600 disabled:bg-neutral-400"
            disabled={isSubmitting || !content || !user}
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
