import type { FC } from 'react'
import dayjs from 'dayjs'
import classnames from 'classnames'
import {
  backdrop,
  chatListState,
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
  onNicknameClick: (mention: string) => void
}
interface State {
  isUpdateMode: boolean
  isThreadOpen: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const MessageChat: FC<Props> = ({ chatIndex, onNicknameClick }) => {
  const [
    { isUpdateMode, isThreadOpen, isSubmitting, isCodeEditorOpen },
    setState
  ] = useObjectState<State>({
    isUpdateMode: false,
    isThreadOpen: false,
    isSubmitting: false,
    isCodeEditorOpen: false
  })
  const [user, setUser] = useUser()
  const { query } = useRouter()
  const supabase = useSupabaseClient()
  const { onEmojiSelect, onReactionClick, onRegex } = useChatList()
  const [chatList, setChatList] = useRecoilState(chatListState)

  const updateChat = async (content: string) => {
    if (isSubmitting) return

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!isUpdateMode) {
      setState({ isUpdateMode: true })
      return
    }

    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chatList[chatIndex].id)
      .select('updated_at')
      .single()
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setChatList([
      ...chatList.slice(0, chatIndex),
      { ...chatList[chatIndex], content, updated_at: data.updated_at },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const deleteChat = async () => {
    if (!!chatList[chatIndex].replies.length) {
      const { data, error } = await supabase
        .from('chats')
        .update({
          // @ts-ignore
          deleted_at: new Date().toISOString().toLocaleString('ko-KR')
        })
        .eq('id', chatList[chatIndex].id)
        .select('deleted_at')
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        EventListener.emit('tooltip:delete:error')
        return
      }
      EventListener.emit('tooltip:delete')
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chatList[chatIndex], deleted_at: data.deleted_at },
        ...chatList.slice(chatIndex + 1)
      ])
    } else {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatList[chatIndex].id)
      if (error) {
        console.error(error)
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
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!!chatList[chatIndex].saves?.length) {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', chatList[chatIndex].saves[0].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chatList[chatIndex], saves: [] },
        ...chatList.slice(chatIndex + 1)
      ])
    } else {
      const { data, error } = await supabase
        .from('saves')
        .insert({ user_id: user.id, chat_id: chatList[chatIndex].id })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chatList[chatIndex], saves: [data] },
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
      .eq('id', chatList[chatIndex].id)
      .select('updated_at')
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setChatList([
      ...chatList.slice(0, chatIndex),
      {
        ...chatList[chatIndex],
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
    const { data, error } = await supabase
      .from('chats')
      .insert({
        content: payload.content,
        code_block:
          chatList[chatIndex].modified_code || chatList[chatIndex].code_block,
        language:
          chatList[chatIndex].modified_language || chatList[chatIndex].language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        user_id: user?.id,
        room_id: query.id
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, chatList[chatIndex].id)
    EventListener.emit('message:codeblock')
    setChatList([
      {
        ...data,
        reactions: [],
        saves: [],
        replies: [],
        opengraphs: [],
        user: { nickname: user?.nickname, avatar_url: user?.avatar_url }
      },
      ...chatList
    ])
  }
  return (
    <>
      <div
        id={String(chatList[chatIndex].id)}
        className={classnames(
          'group relative flex gap-3 py-1 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          {
            'bg-red-50': !!chatList[chatIndex].saves?.length,
            'z-10 animate-bounce bg-blue-50':
              window.location.hash === `#${chatList[chatIndex].id}` &&
              !chatList[chatIndex].deleted_at
          }
        )}
      >
        {!!chatList[chatIndex].saves.length && (
          <span className="absolute left-1 top-2">
            <BookmarkIcon className="h-4 w-4 text-red-500" />
          </span>
        )}
        <div className="flex w-8 items-start justify-center">
          {!!chatList[chatIndex].deleted_at ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 dark:group-hover:bg-neutral-600">
              <TrashIcon className="h-5 w-5 text-neutral-400" />
            </span>
          ) : chatList[chatIndex].user_id !==
            chatList[chatIndex + 1]?.user_id ? (
            <Message.Avatar
              url={chatList[chatIndex].user.avatar_url}
              userId={chatList[chatIndex].user_id}
            />
          ) : (
            <span className="invisible mt-[5px] text-2xs text-neutral-400 group-hover:visible">
              {dayjs(chatList[chatIndex].created_at)
                .locale('ko')
                .format('H:mm')}
            </span>
          )}
        </div>
        <div className="flex-1">
          {!chatList[chatIndex].deleted_at &&
            chatList[chatIndex].user_id !==
              chatList[chatIndex + 1]?.user_id && (
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm font-medium">
                  <span
                    onClick={() =>
                      onNicknameClick(
                        `@[${chatList[chatIndex].user?.nickname}](${chatList[chatIndex].user_id})`
                      )
                    }
                    className="cursor-pointer"
                  >
                    {chatList[chatIndex].user?.nickname}
                  </span>
                  {chatList[chatIndex].user_id === user?.id && (
                    <span className="ml-1 text-xs text-neutral-400">(나)</span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {dayjs(chatList[chatIndex].created_at)
                    .locale('ko')
                    .format('A H:mm')}
                </span>
              </div>
            )}
          <div>
            {!!chatList[chatIndex].deleted_at ? (
              <div className="flex h-8 items-center text-sm text-neutral-400">
                이 메시지는 삭제되었습니다.
              </div>
            ) : isUpdateMode ? (
              <Message.Update
                content={chatList[chatIndex].content}
                onCancel={() => setState({ isUpdateMode: false })}
                onSave={updateChat}
              />
            ) : (
              <Message.Parser
                content={chatList[chatIndex].content}
                updatedAt={chatList[chatIndex].updated_at}
              />
            )}
          </div>
          <Message.CodeBlock
            originalCode={chatList[chatIndex].code_block}
            language={chatList[chatIndex].language}
            onSubmit={createModifiedCodeChat}
            mention={`@[${chatList[chatIndex].user.nickname}](${chatList[chatIndex].user_id})`}
            modifiedCode={chatList[chatIndex].modified_code}
            modifiedLanguage={chatList[chatIndex].modified_language}
          />
          {chatList[chatIndex].opengraphs?.map((item) => (
            <Message.Opengraph {...item} key={item.id} />
          ))}
          {!!chatList[chatIndex].reactions?.length && (
            <Message.Reactions>
              {chatList[chatIndex].reactions.map((item, key) => (
                <Tooltip.Reaction
                  userList={item.userList}
                  key={key}
                  onClick={() => onReactionClick(chatList[chatIndex], key)}
                  text={item.text}
                  length={item?.userList.length}
                />
              ))}
              <Tooltip.AddReaction
                onSelect={(text) => onEmojiSelect(text, chatIndex)}
              />
            </Message.Reactions>
          )}
          {!!chatList[chatIndex].replies?.length && (
            <div
              onClick={() => setState({ isThreadOpen: true })}
              className="group/reply mt-1 flex cursor-pointer items-center justify-between rounded border border-transparent p-1 duration-150 hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            >
              <div className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-1">
                  {[
                    ...new Set(
                      chatList[chatIndex].replies.map(
                        (reply) => reply.user.avatar_url
                      )
                    )
                  ].map((url, key) => (
                    <img
                      key={key}
                      src={url}
                      alt=""
                      className="h-6 w-6 rounded"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-neutral-600 dark:text-blue-400">
                  {chatList[chatIndex].replies.length}개의 댓글
                </span>
                <div className="text-sm text-neutral-400 group-hover/reply:hidden">
                  {dayjs(chatList[chatIndex].replies[0].created_at)
                    .locale('ko')
                    .fromNow()}
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

        {!chatList[chatIndex].deleted_at && !isUpdateMode && (
          <div className="absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction
                onSelect={(text) => onEmojiSelect(text, chatIndex)}
              />
              <Tooltip.Actions.Thread
                onClick={() => setState({ isThreadOpen: true })}
              />
              <Tooltip.Actions.Save
                onClick={onSaveChat}
                isSaved={!!chatList[chatIndex].saves?.length}
              />
              {chatList[chatIndex].user_id === user?.id && (
                <>
                  <Tooltip.Actions.Update
                    onClick={() =>
                      setState({
                        isUpdateMode: !chatList[chatIndex].code_block,
                        isCodeEditorOpen: !!chatList[chatIndex].code_block
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
      {(!!dayjs(
        dayjs(chatList[chatIndex].created_at).format('YYYY-MM-DD')
      ).diff(
        dayjs(chatList[chatIndex + 1]?.created_at).format('YYYY-MM-DD'),
        'day'
      ) ||
        chatIndex === chatList.length - 1) && (
        <div className="relative z-[9] mx-5 flex items-center justify-center py-5 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200 dark:before:bg-neutral-700">
          <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-1px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400 dark:bg-neutral-800">
            {dayjs(chatList[chatIndex].created_at).format('MM월 DD일')}
          </div>
        </div>
      )}
      <Drawer.Thread
        isOpen={isThreadOpen}
        onClose={() => setState({ isThreadOpen: false })}
        chatIndex={chatIndex}
      />
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={chatList[chatIndex].content}
        codeBlock={chatList[chatIndex].code_block}
        language={chatList[chatIndex].language}
        onSubmit={updateCodeChat}
      />
    </>
  )
}

export default MessageChat
