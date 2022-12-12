import { memo, useMemo } from 'react'
import type { FC } from 'react'
import dayjs from 'dayjs'
import classnames from 'classnames'
import {
  backdrop,
  captureException,
  chatListState,
  cheerio,
  EventListener,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'
import { Drawer, Message, Modal } from 'containers'
import { Tooltip } from 'components'
import { BookmarkIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useRecoilState } from 'recoil'

export interface Props {
  chatIndex: number
}
interface State {
  isUpdateMode: boolean
  isThreadOpen: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const MessageChat: FC<Props> = ({ chatIndex }) => {
  const [
    { isUpdateMode, isThreadOpen, isSubmitting, isCodeEditorOpen },
    setState
  ] = useObjectState<State>({
    isUpdateMode: false,
    isThreadOpen: false,
    isSubmitting: false,
    isCodeEditorOpen: false
  })
  const [user] = useUser()
  const { query } = useRouter()
  const supabase = useSupabaseClient<Database>()
  const { onEmojiSelect, onReactionClick, onRegex } = useChatList()
  const [chatList, setChatList] = useRecoilState(chatListState)

  const updateChat = async (content: string) => {
    if (isSubmitting) return

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!isUpdateMode) {
      setState({ isUpdateMode: true })
      return
    }

    const text = cheerio.getText(content).trim()
    if (!text) return
    if (text.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat.id)
      .select('updated_at')
      .single()
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setChatList([
      ...chatList.slice(0, chatIndex),
      { ...chat, content, updated_at: data.updated_at },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const deleteChat = async () => {
    if (!!chat.replies.length) {
      const { data, error } = await supabase
        .from('chats')
        .update({
          // @ts-ignore
          deleted_at: new Date().toISOString().toLocaleString('ko-KR')
        })
        .eq('id', chat.id)
        .select('deleted_at')
        .single()
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        EventListener.emit('tooltip:delete:error')
        return
      }
      EventListener.emit('tooltip:delete')
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chat, deleted_at: data.deleted_at },
        ...chatList.slice(chatIndex + 1)
      ])
    } else {
      const { error } = await supabase.from('chats').delete().eq('id', chat.id)
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        EventListener.emit('tooltip:delete:error')
        return
      }
      EventListener.emit('tooltip:delete')
      setChatList([
        ...chatList.slice(0, chatIndex),
        ...chatList.slice(chatIndex + 1)
      ])
    }
  }

  const onSaveChat = async () => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!!chat.saves?.length) {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', chat.saves[0].id)
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chat, saves: [] },
        ...chatList.slice(chatIndex + 1)
      ])
    } else {
      const { data, error } = await supabase
        .from('saves')
        .insert({ user_id: user.id, chat_id: chat.id })
        .select()
        .single()
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chat, saves: [data] },
        ...chatList.slice(chatIndex + 1)
      ])
    }
  }

  const updateCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('chats')
      .update({
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .eq('id', chat.id)
      .select('updated_at')
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setChatList([
      ...chatList.slice(0, chatIndex),
      {
        ...chat,
        updated_at: data.updated_at,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const createModifiedCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    if (typeof query.id !== 'string') return
    const { data, error } = await supabase
      .from('chats')
      .insert({
        content: payload.content,
        code_block: chat.modified_code || chat.code_block,
        language: chat.modified_language || chat.language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        user_id: user?.id || '',
        room_id: query.id
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, chat.id)
    EventListener.emit('message:codeblock')
    setChatList([
      {
        ...data,
        reactions: [],
        saves: [],
        replies: [],
        opengraphs: [],
        user: {
          nickname: user?.nickname || '',
          avatar_url: user?.avatar_url || ''
        }
      },
      ...chatList
    ])
  }

  const chat = useMemo(() => chatList[chatIndex], [chatList, chatIndex])
  return (
    <>
      <div
        id={String(chat.id)}
        className={classnames(
          'group relative flex gap-3 py-1 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          {
            'bg-red-50': !!chat.saves?.length,
            'z-10 animate-bounce bg-blue-50':
              window.location.hash === `#${chat.id}` && !chat.deleted_at
          }
        )}
      >
        {!!chat.saves.length && (
          <span className="absolute left-1 top-2">
            <BookmarkIcon className="h-4 w-4 text-red-500" />
          </span>
        )}
        <div className="flex w-8 items-start justify-center">
          {!!chat.deleted_at ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 dark:group-hover:bg-neutral-600">
              <TrashIcon className="h-5 w-5 text-neutral-400" />
            </span>
          ) : chat.user_id !== chatList[chatIndex + 1]?.user_id ? (
            <Message.Avatar
              url={chat.user.avatar_url || ''}
              userId={chat.user_id}
            />
          ) : (
            <span className="invisible mt-[5px] text-2xs text-neutral-400 group-hover:visible">
              {dayjs(chat.created_at).locale('ko').format('H:mm')}
            </span>
          )}
        </div>
        <div className="flex-1">
          {!chat.deleted_at &&
            chat.user_id !== chatList[chatIndex + 1]?.user_id && (
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm font-medium">
                  <span>{chat.user?.nickname}</span>
                  {chat.user_id === user?.id && (
                    <span className="ml-1 text-xs text-neutral-400">(나)</span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {dayjs(chat.created_at).locale('ko').format('A h:mm')}
                </span>
              </div>
            )}
          <div className="max-w-[726px] break-all">
            {!!chat.deleted_at ? (
              <div className="flex h-8 items-center text-sm text-neutral-400">
                이 메시지는 삭제되었습니다.
              </div>
            ) : isUpdateMode ? (
              <Message.Update
                content={chat.content}
                onCancel={() => setState({ isUpdateMode: false })}
                onSave={updateChat}
              />
            ) : (
              <Message
                content={chat.content}
                updatedAt={chat.updated_at || ''}
              />
            )}
          </div>
          <Message.CodeBlock
            originalCode={chat.code_block || ''}
            language={chat.language || ''}
            onSubmit={createModifiedCodeChat}
            modifiedCode={chat.modified_code || ''}
            modifiedLanguage={chat.modified_language || ''}
            typingSource="chat"
            username={chat.user.nickname}
            userId={chat.user_id}
          />
          {chat.opengraphs?.map((item) => (
            <Message.Opengraph {...item} key={item.id} />
          ))}
          {!!chat.reactions?.length && (
            <div className="message-reactions">
              {chat.reactions.map((item, key) => (
                <Tooltip.Reaction
                  userList={item.userList}
                  key={key}
                  onClick={() => onReactionClick(chat, key)}
                  text={item.text || ''}
                  emoji={item.emoji}
                />
              ))}
              <Tooltip.AddReaction
                onSelect={(text, emoji) =>
                  onEmojiSelect(text, emoji, chatIndex)
                }
              />
            </div>
          )}
          {!!chat.replies?.length && (
            <div
              onClick={() => {
                setState({ isThreadOpen: true })
                EventListener.emit('focus:freeze', true)
              }}
              className="group/reply mt-1 flex cursor-pointer items-center justify-between rounded border border-transparent p-1 duration-150 hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            >
              <div className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-1">
                  {[
                    ...new Set(
                      chat.replies.map((reply) => reply.user.avatar_url)
                    )
                  ].map((url, key) => (
                    <img
                      key={key}
                      src={url || ''}
                      alt=""
                      className="h-6 w-6 rounded"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-neutral-600 dark:text-blue-400">
                  {chat.replies.length}개의 댓글
                </span>
                <div className="text-sm text-neutral-400 group-hover/reply:hidden">
                  {dayjs(chat.replies[0].created_at).locale('ko').fromNow()}
                </div>
                <div className="hidden text-sm text-neutral-400 group-hover/reply:block">
                  스레드 보기
                </div>
              </div>
              <span className="hidden group-hover/reply:inline-block">
                <ChevronRightIcon className="h-5 w-5 text-neutral-500" />
              </span>
            </div>
          )}
        </div>

        {!chat.deleted_at && !isUpdateMode && (
          <div className="absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction
                onSelect={(text, emoji) =>
                  onEmojiSelect(text, emoji, chatIndex)
                }
              />
              <Tooltip.Actions.Thread
                onClick={() => {
                  setState({ isThreadOpen: true })
                  EventListener.emit('focus:freeze', true)
                }}
              />
              <Tooltip.Actions.Save
                onClick={onSaveChat}
                isSaved={!!chat.saves?.length}
              />
              {chat.user_id === user?.id && (
                <>
                  <Tooltip.Actions.Update
                    onClick={() =>
                      setState({
                        isUpdateMode: !chat.code_block,
                        isCodeEditorOpen: !!chat.code_block
                      })
                    }
                  />
                  <Tooltip.Actions.Delete onClick={deleteChat} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Message.Divider chatIndex={chatIndex} />
      <Drawer.Thread
        isOpen={isThreadOpen}
        onClose={() => {
          setState({ isThreadOpen: false })
          EventListener.emit('focus:freeze', false)
        }}
        chatIndex={chatIndex}
      />
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={chat.content}
        codeBlock={chat.code_block || ''}
        language={chat.language || ''}
        onSubmit={updateCodeChat}
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default memo(MessageChat)
