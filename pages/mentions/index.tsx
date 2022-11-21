import { AtSymbolIcon } from '@heroicons/react/24/outline'
import { SEO, Spinner, Tooltip } from 'components'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import {
  backdrop,
  captureException,
  EventListener,
  toast,
  TOAST_MESSAGE,
  useIntersectionObserver,
  useObjectState,
  useUser
} from 'services'
import dayjs from 'dayjs'
import { Message } from 'containers'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { HashtagIcon } from '@heroicons/react/20/solid'

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
      opengraphs: NTable.Opengraphs[]
      updated_at: string
      modified_code: string
      modified_language: string
    }
    created_at: string
    user: {
      id: string
      avatar_url: string
      nickname: string
    }
  }>
  isLoading: boolean
  page: number
  total: number
}

const MentionsPage: NextPage = () => {
  const [{ list, isLoading, page, total }, setState] = useObjectState<State>({
    list: [],
    isLoading: true,
    page: 1,
    total: 0
  })
  const [user] = useUser()
  const { push } = useRouter()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()
  const supabase = useSupabaseClient()

  const get = async (page: number = 1) => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setState({ isLoading: false })
      return
    }
    if (!isLoading) setState({ isLoading: true })
    const { data, error, count } = await supabase
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
          modified_code,
          modified_language,
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
          ),
          opengraphs (
            id,
            title,
            description,
            url,
            site_name,
            image
          ),
          saves (
            id
          )
        ),
        created_at
      `,
        { count: 'exact' }
      )
      .eq('mention_to', auth.user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)
    if (error) {
      captureException(error, auth.user)
      setState({ isLoading: false })
      return
    }
    for (const item of data) {
      let reactions: Array<{
        id: number
        text: string
        userList: Array<{ id: string; nickname: string }>
      }> = []
      // @ts-ignore
      if (item.chat.reactions.length > 0) {
        // @ts-ignore
        for (const reaction of item.chat.reactions) {
          const index = reactions.findIndex(
            (item) => item.text === reaction.text
          )
          if (index === -1) {
            reactions.push({
              id: reaction.id,
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
      item.chat.reactions = reactions
    }
    setState({
      list: page === 1 ? data : [...list, ...(data as any[])],
      isLoading: false,
      page,
      total: count || 0
    })
  }

  const createModifiedCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
    originalCode: string
    originalLanguage: string
    roomId: string
    modifiedCode: string
    modifiedLanguage: string
  }) => {
    const { error } = await supabase.from('chats').insert({
      content: payload.content,
      code_block: payload.modifiedCode || payload.originalCode,
      language: payload.modifiedLanguage || payload.originalLanguage,
      modified_code: payload.codeBlock,
      modified_language: payload.language,
      user_id: user?.id,
      room_id: payload.roomId
    })
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    EventListener.emit('message:codeblock')
  }

  const onSubscribe = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    supabase
      .channel('pages/mentions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions',
          filter: `mention_to=eq.${user.id}`
        },
        async (payload) => {
          const [
            { data: user, error: userError },
            { data: chat, error: chatError }
          ] = await Promise.all([
            supabase
              .from('users')
              .select('id, nickname, avatar_url')
              .eq('id', payload.new.mention_from)
              .single(),
            supabase
              .from('chats')
              .select(
                `
              id,
              content,
              code_block,
              language,
              updated_at,
              room:room_id (
                id,
                name
              )
            `
              )
              .eq('id', payload.new.chat_id)
              .single()
          ])
          if (userError || chatError) {
            if (userError) captureException(userError, user)
            if (chatError) captureException(chatError, user)
            return
          }
          setState({
            list: [
              {
                id: payload.new.id,
                created_at: payload.new.created_at,
                user: user as any,
                chat: {
                  ...(chat as any),
                  reactions: []
                }
              },
              ...list
            ]
          })
        }
      )
      .subscribe()
  }

  useEffect(() => {
    get()
  }, [])

  useEffect(() => {
    if (isIntersecting && page * 20 < total) get(page + 1)
  }, [isIntersecting])

  useEffect(() => {
    onSubscribe()

    return () => {
      const channels = supabase.getChannels()
      const mention = channels.find((item) => item.topic === 'pages/mentions')
      if (mention) supabase.removeChannel(mention)
    }
  }, [list])
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
              className="group m-4 cursor-pointer space-y-2 rounded-xl border p-3 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
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
              <div className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-400">
                <span>
                  <HashtagIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">
                  {item.chat.room.name}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Message.Avatar
                  url={item.user.avatar_url}
                  userId={item.user.id}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.user.nickname}</span>
                    <span className="text-xs text-neutral-400">
                      {dayjs(item.created_at).locale('ko').fromNow()}
                    </span>
                  </div>
                  <Message
                    content={item.chat.content}
                    updatedAt={item.chat.updated_at}
                  />
                  <Message.CodeBlock
                    originalCode={item.chat.code_block}
                    language={item.chat.language}
                    onSubmit={(payload) =>
                      createModifiedCodeChat({
                        ...payload,
                        originalCode: item.chat.code_block,
                        originalLanguage: item.chat.language,
                        roomId: item.chat.room.id,
                        modifiedCode: item.chat.modified_code,
                        modifiedLanguage: item.chat.modified_language
                      })
                    }
                    mention={`@[${item.user.nickname}](${item.user.avatar_url})`}
                    modifiedCode={item.chat.modified_code}
                    modifiedLanguage={item.chat.modified_language}
                  />
                  {item.chat.opengraphs?.map((item) => (
                    <Message.Opengraph {...item} key={item.id} />
                  ))}
                  {!!item.chat.reactions?.length && (
                    <Message.Reactions>
                      {item.chat.reactions.map((reaction, key) => (
                        <Tooltip.Reaction
                          userList={reaction.userList}
                          key={key}
                          onClick={() => {}}
                          text={reaction.text}
                          length={reaction?.userList.length}
                        />
                      ))}
                    </Message.Reactions>
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
                <div className="text-sm text-neutral-600 dark:text-neutral-500">
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
              <Spinner className="h-8 w-8 text-neutral-300 dark:text-neutral-400" />
            </div>
          )}
          <div ref={ref} />
        </main>
      </div>
    </>
  )
}

export default MentionsPage
