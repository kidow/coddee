import { SEO, Spinner } from 'components'
import type { NextPage } from 'next'
import { ArrowSmallUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { supabase, useObjectState, useUser } from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { Fragment, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import classnames from 'classnames'
import dayjs from 'dayjs'

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  chatList: Array<NTable.Chats & { user: NTable.Users }>
  name: string
  page: number
  isSubmitting: boolean
  isProfileOpen: boolean
  userId: string
}

const RoomIdPage: NextPage = () => {
  const [
    {
      content,
      isLoading,
      isCodeEditorOpen,
      chatList,
      name,
      page,
      isSubmitting,
      isProfileOpen,
      userId
    },
    setState,
    onChange
  ] = useObjectState<State>({
    content: '',
    isLoading: false,
    isCodeEditorOpen: false,
    chatList: [],
    name: '',
    page: 1,
    isSubmitting: false,
    isProfileOpen: false,
    userId: ''
  })
  const { query } = useRouter()
  const [user] = useUser()
  const ref = useRef<HTMLTextAreaElement>(null)

  const getRoom = async () => {
    if (!query.id || typeof query.id !== 'string') return
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', query.id)
      .single()
    setState({ name: data?.name || '' })
  }

  const getChatList = async (page: number = 1) => {
    if (!query.id || typeof query.id !== 'string') return
    if (page === 1) setState({ isLoading: true, chatList: [] })
    else setState({ isLoading: true })
    const { data } = await supabase
      .from('chats')
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        user:user_id(
          id,
          avatar_url,
          nickname
        )
      `
      )
      .eq('room_id', query.id)
      .order('created_at')
      .range((page - 1) * 20, page * 20 - 1)
    setState({
      isLoading: false,
      chatList: (data as Array<NTable.Chats & { user: NTable.Users }>) || []
    })
  }

  const create = async () => {
    if (!content.trim() || !user) return
    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, room_id: query.id, content })
    setState({ isSubmitting: false })
    if (error) console.error(error)
    else {
      setState({ content: '' })
      ref.current?.focus()
    }
  }

  useEffect(() => {
    getRoom()
    getChatList()
  }, [query.id])

  useEffect(() => {
    const channel = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        (payload) => setState({ chatList: [...chatList, payload.new as any] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatList.length, query.id])
  return (
    <>
      <SEO title="Javascript" />
      <div className="divide-y">
        <header className="flex h-12 items-center px-5">
          <span className="font-semibold">{name}</span>
        </header>
        <main className="h-[calc(100vh-107px)] flex-1 overflow-auto py-3">
          {!!chatList.length ? (
            chatList.map((item, key, arr) => (
              <Fragment key={key}>
                {(!!dayjs(item.created_at).diff(
                  arr[key - 1]?.created_at,
                  'day'
                ) ||
                  key === 0) && (
                  <div className="relative z-10 mx-5 flex items-center justify-center py-3 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200">
                    <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-2px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400">
                      {dayjs(item.created_at).format('MM월 DD일')}
                    </div>
                  </div>
                )}
                <div
                  id={String(item.id)}
                  className={classnames(
                    'flex py-1 px-5 hover:bg-neutral-50',
                    item.user_id === user?.id
                      ? 'justify-end gap-2'
                      : 'items-center gap-4 text-sm',
                    window.location.hash === `#${item.id}`
                      ? 'animate-bounce bg-blue-50'
                      : 'hover:bg-neutral-50'
                  )}
                >
                  {item.user_id !== user?.id ? (
                    <>
                      <img
                        src={item.user?.avatar_url || ''}
                        alt=""
                        className="h-8 w-8 cursor-pointer"
                        onClick={() =>
                          setState({
                            isProfileOpen: true,
                            userId: item.user_id
                          })
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="cursor-pointer font-medium">
                            {item.user.nickname}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {dayjs(item.created_at).format('HH:mm')}
                          </span>
                        </div>
                        <div>{item.content}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-neutral-400">
                        {dayjs(item.created_at).format('HH:mm')}
                      </div>
                      <div className="rounded bg-blue-100 p-2">
                        {item.content}
                      </div>
                    </>
                  )}
                </div>
              </Fragment>
            ))
          ) : (
            <div className="flex h-full items-center justify-center">asd</div>
          )}
        </main>
        <footer className="flex items-center gap-3 py-3 px-5">
          <TextareaAutosize
            value={content}
            name="content"
            onChange={onChange}
            disabled={isSubmitting}
            ref={ref}
            placeholder="서로를 존중하는 매너를 보여주세요 :)"
            className="flex-1 resize-none rounded-lg border border-neutral-200 px-2 py-1 placeholder:text-sm focus:border-neutral-600"
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
