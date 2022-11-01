import { AtSymbolIcon } from '@heroicons/react/24/outline'
import { CodePreview, SEO, Spinner, Tooltip } from 'components'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import {
  supabase,
  useIntersectionObserver,
  useObjectState,
  useUser
} from 'services'
import dayjs from 'dayjs'
import { ChatMessage } from 'templates'
import { Modal } from 'containers'
import { useRouter } from 'next/router'
import classnames from 'classnames'

interface State {
  list: Array<{
    id: number
    chat: {
      id: string
      code_block: string
      content: string
      language: string
      reactions: NTable.Reactions[]
      room: {
        id: string
        name: string
      }
      updated_at: string
    }
    created_at: string
    user: {
      id: string
      avatar_url: string
      nickname: string
    }
  }>
  isProfileOpen: boolean
  userId: string
  isLoading: boolean
  page: number
  total: number
}

const MentionsPage: NextPage = () => {
  const [{ list, isProfileOpen, userId, isLoading, page, total }, setState] =
    useObjectState<State>({
      list: [],
      isProfileOpen: false,
      userId: '',
      isLoading: true,
      page: 1,
      total: 0
    })
  const [user] = useUser()
  const { push } = useRouter()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()

  const get = async (page: number = 1) => {
    if (!user) {
      setState({ isLoading: false })
      return
    }
    // const { data } = await supabase.auth.getUser()
    // if (!data.user) {
    //   setState({ isLoading: false })
    //   return
    // }
    if (!isLoading) setState({ isLoading: true })
    const {
      data: mentions,
      error,
      count
    } = await supabase
      .from('mentions')
      .select(
        `
        id,
        user:mention_from (
          id,
          nickname,
          avatar_url
        ),
        chat:chat_id (
          id,
          content,
          code_block,
          language,
          updated_at,
          room:room_id (
            id,
            name
          ),
          reactions (
            id,
            text,
            user_id,
            user:user_id (
              nickname
            )
          )
        ),
        created_at
      `,
        { count: 'exact' }
      )
      .eq('mention_to', user.id)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'chats:reactions' })
      .range((page - 1) * 20, page * 20 - 1)
    if (error) {
      console.error(error)
      setState({ isLoading: false })
      return
    }
    for (const data of mentions) {
      let reactions: Array<{
        id: number
        room_id: string
        chat_id: number
        text: string
        userList: Array<{ id: string; nickname: string }>
      }> = []
      // @ts-ignore
      if (data.chat.reactions.length > 0) {
        // @ts-ignore
        for (const reaction of data.chat.reactions) {
          const index = reactions.findIndex(
            (item) => item.text === reaction.text
          )
          if (index === -1) {
            reactions.push({
              id: reaction.id,
              room_id: reaction.room_id,
              chat_id: reaction.chat_id,
              text: reaction.text,
              userList: [
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
            })
          } else {
            const userIndex = reactions[index].userList.findIndex(
              (item) => item.id === reaction.user_id
            )
            if (userIndex === -1)
              reactions[index].userList = [
                ...reactions[index].userList,
                { id: reaction.user_id, nickname: reaction.user.nickname }
              ]
          }
        }
      }
      // @ts-ignore
      data.chat.reactions = reactions
    }
    setState({
      list: [...list, ...(mentions as any[])],
      isLoading: false,
      page,
      total: count || 0
    })
  }

  useEffect(() => {
    get()
  }, [])

  useEffect(() => {
    if (isIntersecting && page * 20 < total) get(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title="멘션" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">멘션</span>
        </header>
        <main className="flex-1">
          {list.map((item) => (
            <div
              key={item.id}
              className="group m-4 cursor-pointer space-y-2 rounded-xl border p-3 hover:bg-neutral-100"
              onClick={() =>
                push({
                  pathname: '/room/[id]',
                  query: {
                    id: item.chat.room.id
                  },
                  hash: item.chat.id
                })
              }
            >
              <div className="text-sm font-semibold text-neutral-600">
                {item.chat.room.name}
              </div>
              <div className="flex items-start gap-3">
                <img
                  src={item.user.avatar_url}
                  alt=""
                  className="h-9 w-9 cursor-pointer rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    setState({ isProfileOpen: true, userId: item.user.id })
                  }}
                />
                <div className="-mt-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setState({
                          isProfileOpen: true,
                          userId: item.user.id
                        })
                      }}
                      className="font-semibold"
                    >
                      {item.user.nickname}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {dayjs(item.created_at).locale('ko').fromNow()}
                    </span>
                  </div>
                  <ChatMessage.Parser
                    content={item.chat.content}
                    updatedAt={item.chat.updated_at}
                  />
                  {!!item.chat.code_block && (
                    <div className="border dark:border-transparent">
                      <CodePreview
                        original={item.chat.code_block}
                        defaultLanguage={item.chat.language}
                      />
                    </div>
                  )}
                  {!!item.chat.reactions?.length && (
                    <div className="mt-1 flex gap-1">
                      {item.chat.reactions.map((reaction, key) => (
                        <Tooltip.Reaction
                          userList={reaction.userList}
                          key={key}
                          onClick={() => {}}
                          text={reaction.text}
                          length={reaction?.userList.length}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!isLoading && !list.length && (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <AtSymbolIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-lg font-bold">
                  회원님을 언급한 메시지들을 확인하실 수 있습니다.
                </div>
                <div className="text-sm text-neutral-600">
                  {!user
                    ? '로그인이 필요합니다.'
                    : '아직은 멘션이 하나도 없네요.'}
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div
              className={classnames(
                'flex items-center justify-center',
                !!list.length ? 'h-12' : 'h-full'
              )}
            >
              <Spinner className="h-5 w-5 text-neutral-300 dark:text-neutral-400" />
            </div>
          )}
          <div ref={ref} />
        </main>
      </div>
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
    </>
  )
}

export default MentionsPage
