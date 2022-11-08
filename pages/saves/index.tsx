import { BookmarkIcon } from '@heroicons/react/24/outline'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { SEO, Spinner, Tooltip } from 'components'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import {
  backdrop,
  EventListener,
  toast,
  TOAST_MESSAGE,
  useIntersectionObserver,
  useObjectState,
  useUser
} from 'services'
import classnames from 'classnames'
import { HashtagIcon } from '@heroicons/react/20/solid'
import { Message } from 'containers'
import dayjs from 'dayjs'

interface State {
  list: Array<
    NTable.Saves & {
      chat:
        | (NTable.Chats & {
            reactions: NTable.Reactions[]
            opengraphs: NTable.Opengraphs[]
            room: NTable.Rooms
            user: NTable.Users
          })
        | null
      reply:
        | (NTable.Replies & {
            reply_reactions: NTable.ReplyReactions[]
            opengraphs: NTable.Opengraphs[]
            chat: {
              room: NTable.Rooms
            }
            user: NTable.Users
          })
        | null
    }
  >
  page: number
  total: number
  isLoading: boolean
}

const SavedPage: NextPage = () => {
  const [{ list, page, total, isLoading }, setState] = useObjectState<State>({
    list: [],
    page: 1,
    total: 0,
    isLoading: true
  })
  const [user] = useUser()
  const { push } = useRouter()
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>()
  const supabase = useSupabaseClient()

  const get = async (page: number = 1) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setState({ isLoading: false })
      return
    }
    if (!isLoading) setState({ isLoading: true })
    const {
      data: saves,
      error,
      count
    } = await supabase
      .from('saves')
      .select(
        `
      id,
      chat:chat_id (
        id,
        content,
        code_block,
        language,
        user_id,
        room_id,
        created_at,
        updated_at,
        modified_code,
        modified_language,
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
          site_name,
          url,
          image
        ),
        room:room_id (
          id,
          name
        ),
        user:user_id (
          avatar_url,
          nickname
        )
      ),
      reply:reply_id (
        id,
        content,
        code_block,
        language,
        user_id,
        chat_id,
        created_at,
        updated_at,
        modified_code,
        modified_language,
        reply_reactions (
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
          site_name,
          url,
          image
        ),
        chat:chat_id (
          room:room_id (
            id,
            name
          )
        ),
        user:user_id (
          avatar_url,
          nickname
        )
      )
    `,
        { count: 'exact' }
      )
      .eq('user_id', data.user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)
    console.log('data', data)
    if (error) {
      console.error(error)
      setState({ isLoading: false })
      return
    }
    for (const data of saves) {
      let reactions: Array<{
        id: number
        text: string
        userList: Array<{ id: string; nickname: string }>
      }> = []
      if (data.chat) {
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
      if (data.reply) {
        // @ts-ignore
        if (data.reply.reply_reactions.length > 0) {
          // @ts-ignore
          for (const reaction of data.reply.reply_reactions) {
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
        data.reply_reactions = reactions
      }
    }
    setState({
      list: page === 1 ? saves : [...list, ...(saves as any[])],
      isLoading: false,
      page,
      total: count || 0
    })
  }

  const onCancelSave = async (id: number) => {
    const { error } = await supabase.from('saves').delete().eq('id', id)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ list: list.filter((item) => item.id !== id) })
  }

  const createModifiedCodeChatOrReply = async (payload: {
    content: string
    codeBlock: string
    language: string
    chat:
      | (NTable.Chats & {
          reactions: NTable.Reactions[]
          opengraphs: NTable.Opengraphs[]
          room: NTable.Rooms
          user: NTable.Users
        })
      | null
    reply:
      | (NTable.Replies & {
          reply_reactions: NTable.ReplyReactions[]
          opengraphs: NTable.Opengraphs[]
          chat: {
            room: NTable.Rooms
          }
          user: NTable.Users
        })
      | null
  }) => {
    if (payload.chat) {
      const { error } = await supabase.from('chats').insert({
        content: payload.content,
        code_block: payload.chat.code_block,
        language: payload.chat.language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        user_id: user?.id,
        room_id: payload.chat.room_id
      })
      backdrop(false)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    }
    if (payload.reply) {
      const { error } = await supabase.from('replies').insert({
        content: payload.content,
        code_block: payload.reply.code_block,
        langauge: payload.reply.language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        chat_id: payload.reply.chat_id,
        user_id: user?.id
      })
      backdrop(false)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    }
    EventListener.emit('message:codeblock')
  }

  useEffect(() => {
    get()
  }, [])

  useEffect(() => {
    if (isIntersecting && page * 20 < total) get(page + 1)
  }, [isIntersecting])
  return (
    <>
      <SEO title="저장된 항목" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">저장된 항목</span>
        </header>
        <main className="flex-1 overflow-auto">
          {list.map((item) => (
            <div
              key={item.id}
              className="group relative m-4 space-y-2 rounded-xl border p-3 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
            >
              <div
                onClick={() =>
                  push({
                    pathname: '/room/[id]',
                    query: {
                      id: item.chat?.room.id || item.reply?.chat.room.id
                    },
                    hash: !!item.chat
                      ? String(item.chat.id)
                      : !!item.reply
                      ? String(item.reply.chat_id)
                      : undefined
                  })
                }
                className="flex cursor-pointer items-center gap-0.5 text-neutral-600 dark:text-neutral-400"
              >
                <span>
                  <HashtagIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">
                  {item.chat?.room.name || item.reply?.chat.room.name}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Message.Avatar
                  url={
                    item.chat?.user.avatar_url ||
                    item.reply?.user.avatar_url ||
                    ''
                  }
                  userId={item.user_id}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {item.chat?.user.nickname || item.reply?.user.nickname}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {dayjs(item.created_at).locale('ko').fromNow()}
                    </span>
                  </div>
                  <Message.Parser
                    content={item.chat?.content || item.reply?.content || ''}
                    updatedAt={
                      item.chat?.updated_at || item.reply?.updated_at || ''
                    }
                  />
                  <Message.CodeBlock
                    originalCode={
                      item.chat?.code_block || item.reply?.code_block || ''
                    }
                    language={item.chat?.language || item.reply?.language || ''}
                    onSubmit={(payload) =>
                      createModifiedCodeChatOrReply({
                        ...payload,
                        chat: item.chat,
                        reply: item.reply
                      })
                    }
                    mention={`@[${
                      item.chat?.user.nickname || item.reply?.user.nickname
                    }](${item.chat?.user_id || item.reply?.user_id})`}
                    modifiedCode={
                      item.chat?.modified_code || item.reply?.modified_code
                    }
                    modifiedLanguage={
                      item.chat?.modified_language ||
                      item.reply?.modified_language
                    }
                  />
                  {item.chat?.opengraphs?.map((item) => (
                    <Message.Opengraph {...item} key={item.id} />
                  ))}
                  {item.reply?.opengraphs?.map((item) => (
                    <Message.Opengraph {...item} key={item.id} />
                  ))}
                  {!!item.chat?.reactions?.length && (
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
                  {!!item.reply?.reply_reactions?.length && (
                    <Message.Reactions>
                      {item.reply.reply_reactions.map((reaction, key) => (
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
              <Message.Actions>
                <Tooltip.Actions.Save
                  onClick={() => onCancelSave(item.id)}
                  isSaved
                />
              </Message.Actions>
            </div>
          ))}
          {!isLoading && !list.length && (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <BookmarkIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-lg font-bold">
                  회원님이 저장한 메시지들을 확인할 수 있습니다.
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-500">
                  {!user
                    ? '로그인이 필요합니다.'
                    : '아직은 저장한 게 하나도 없네요.'}
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

export default SavedPage
