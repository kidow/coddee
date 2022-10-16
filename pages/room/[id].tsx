import { CodePreview, SEO, Spinner } from 'components'
import type { NextPage } from 'next'
import {
  ArrowSmallUpIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import {
  roomState,
  supabase,
  useObjectState,
  useUser,
  useIntersectionObserver
} from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { Fragment, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import classnames from 'classnames'
import dayjs from 'dayjs'
import { useRecoilState } from 'recoil'

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
  page: number
  isSubmitting: boolean
  isProfileOpen: boolean
  userId: string
  total: number
  isDropdownOpen: boolean
}

const RoomIdPage: NextPage = () => {
  const [
    {
      content,
      isLoading,
      isCodeEditorOpen,
      page,
      isSubmitting,
      isProfileOpen,
      userId,
      total,
      isDropdownOpen
    },
    setState,
    onChange
  ] = useObjectState<State>({
    content: '',
    isLoading: false,
    isCodeEditorOpen: false,
    page: 1,
    isSubmitting: false,
    isProfileOpen: false,
    userId: '',
    total: 0,
    isDropdownOpen: false
  })
  const { query } = useRouter()
  const [user] = useUser()
  const [roomList, setRoomList] = useRecoilState(roomState)
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()

  const getChatList = async (page: number = 1) => {
    if (!query.id || typeof query.id !== 'string') return
    setState({ isLoading: true })
    const { data, count, error } = await supabase
      .from('chats')
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        language,
        code_block,
        user:user_id(
          id,
          avatar_url,
          nickname
        )
      `,
        { count: 'exact' }
      )
      .eq('room_id', query.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * 100, page * 100 - 1)
    if (error) {
      console.error(error)
      return
    }
    setState({
      isLoading: false,
      page,
      total: count || 0
    })
    const index = roomList.findIndex((item) => item.id === query.id)
    if (index !== -1)
      setRoomList([
        ...roomList.slice(0, index),
        {
          ...roomList[index],
          chats: [...roomList[index].chats, ...(data as any)]
        },
        ...roomList.slice(index + 1)
      ])
  }

  const create = async () => {
    if (!content.trim() || !user) return
    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, room_id: query.id, content })
    setState({ isSubmitting: false })
    if (error) console.error(error)
    else setState({ content: '' })
  }

  const room:
    | (NTable.Rooms & { chats: Array<NTable.Chats & { user: NTable.Users }> })
    | null = useMemo(() => {
    if (!query.id) return null
    return roomList.find((item) => item.id === query.id) || null
  }, [roomList, query.id])

  const chatList: Array<NTable.Chats & { user: NTable.Users }> = useMemo(() => {
    if (!room) return []
    return room.chats || []
  }, [room, query.id])

  const isBringMore: boolean = useMemo(() => {
    if (chatList.length < 100) return false
    return page * 100 < total
  }, [chatList, page, total])

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight)
    return () => {
      const index = roomList.findIndex((item) => item.id === query.id)
      setRoomList([
        ...roomList.slice(0, index),
        { ...roomList[index], chats: chatList.slice(0, 100) },
        ...roomList.slice(index + 1)
      ])
    }
  }, [query.id])

  useEffect(() => {
    if (!chatList.length) return
  }, [chatList.length])
  return (
    <>
      <SEO title="Javascript" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-5">
          <span className="font-semibold">{room?.name}</span>
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
              {!!item.code_block && (
                <div
                  className={classnames(
                    'pr-5',
                    item.user_id === user?.id ? 'pl-5' : 'pl-16'
                  )}
                >
                  <CodePreview
                    original={item.code_block}
                    language={item.language}
                  />
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
                      className="h-8 w-8 cursor-pointer rounded"
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
                  <div>
                    <div className="flex gap-2">
                      <div className="text-xs text-neutral-400">
                        {dayjs(item.created_at).format('HH:mm')}
                      </div>
                      <div className="rounded bg-blue-100 p-2">
                        {item.content}
                      </div>
                    </div>
                  </div>
                )}
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
          {!chatList.length && (
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
