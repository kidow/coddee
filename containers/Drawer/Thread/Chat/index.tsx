import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import type { FC } from 'react'
import { useRecoilState } from 'recoil'
import {
  backdrop,
  captureException,
  chatListState,
  EventListener,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'

export interface Props {
  chatIndex: number
  replyLength: number
  onClose: () => void
}
interface State {
  isUpdateMode: boolean
  isUpdating: boolean
  isCodeEditorOpen: boolean
}

const ThreadDrawerChat: FC<Props> = ({ replyLength, onClose, chatIndex }) => {
  const [{ isUpdateMode, isUpdating, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isUpdating: false,
      isCodeEditorOpen: false
    })
  const [user] = useUser()
  const supabase = useSupabaseClient()
  const { query } = useRouter()
  const { onEmojiSelect, onReactionClick } = useChatList()
  const [chatList, setChatList] = useRecoilState(chatListState)

  const updateChat = async (content: string) => {
    if (isUpdating) return

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

    if (!content.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isUpdating: true })
    const { data, error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat.id)
      .select('updated_at')
      .single()
    setState({ isUpdating: false, isUpdateMode: false })
    if (error) {
      captureException(error, user)
      console.error(error)
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
    if (!!replyLength) {
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
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        EventListener.emit('tooltip:delete:error')
        return
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        { ...chat, deleted_at: data.deleted_at },
        ...chatList.slice(chatIndex + 1)
      ])
      EventListener.emit('tooltip:delete')
    } else {
      const { error } = await supabase.from('chats').delete().eq('id', chat.id)
      if (error) {
        captureException(error, user)
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        EventListener.emit('tooltip:delete:error')
        return
      }
      setChatList([
        ...chatList.slice(0, chatIndex),
        ...chatList.slice(chatIndex + 1)
      ])
      EventListener.emit('tooltip:delete')
      onClose()
      const channel = supabase
        .getChannels()
        .find((item) => item.topic === `realtime:is-typing:reply/${chat.id}`)
      if (channel) await supabase.removeChannel(channel)
    }
  }

  const updateCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { error } = await supabase
      .from('chats')
      .update({
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .eq('id', chat.id)
    backdrop(false)
    if (error) {
      captureException(error, user)
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
  }

  const createModifiedCodeChat = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { error } = await supabase.from('chats').insert({
      content: payload.content,
      code_block: chat.modified_code || chat.code_block,
      language: chat.modified_language || chat.language,
      modified_code: payload.codeBlock,
      modified_language: payload.language,
      user_id: user?.id,
      room_id: query.id
    })
    backdrop(false)
    if (error) {
      captureException(error, user)
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    EventListener.emit('message:codeblock')
  }
  const chat = useMemo(() => chatList[chatIndex], [chatList, chatIndex])
  return (
    <>
      <div className="group relative flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <Message.Avatar
          url={chat.user.avatar_url || ''}
          userId={chat.user_id || ''}
          deletedAt={chat.deleted_at}
        />
        {!!chat.deleted_at ? (
          <div className="mt-0.5 flex h-9 items-center text-sm text-neutral-400">
            이 메시지는 삭제되었습니다.
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center text-sm font-medium">
                {chat.user?.nickname}
                {chat.user_id === user?.id && (
                  <span className="ml-1 text-xs text-neutral-400">(나)</span>
                )}
              </span>
              <span className="text-xs text-neutral-400">
                {dayjs(chat.created_at).locale('ko').format('A H:mm')}
              </span>
            </div>
            <div>
              {isUpdateMode ? (
                <Message.Update
                  content={chat.content || ''}
                  onCancel={() => setState({ isUpdateMode: false })}
                  onSave={updateChat}
                />
              ) : (
                <Message.Parser
                  content={chat.content || ''}
                  updatedAt={chat.updated_at || ''}
                />
              )}
            </div>
            <Message.CodeBlock
              originalCode={chat.code_block}
              language={chat.language}
              onSubmit={createModifiedCodeChat}
              mention={`@[${chat.user.nickname}](${chat.user_id})`}
              modifiedCode={chat.modified_code}
              modifiedLanguage={chat.modified_language}
              typingSource="reply"
              chatId={chat.id}
            />
            {chat.opengraphs?.map((item) => (
              <Message.Opengraph {...item} key={item.id} />
            ))}
            {!!chat.reactions?.length && (
              <Message.Reactions>
                {chat.reactions.map((item, key) => (
                  <Tooltip.Reaction
                    userList={item.userList}
                    key={item.id}
                    onClick={() => onReactionClick(chat, key)}
                    text={item.text}
                    length={item?.userList.length}
                  />
                ))}
                <Tooltip.AddReaction
                  onSelect={(text) => onEmojiSelect(text, chatIndex)}
                />
              </Message.Reactions>
            )}
          </div>
        )}
        {!chat.deleted_at && !isUpdateMode && (
          <div className="absolute top-4 right-4 z-10 hidden rounded-lg border bg-white group-hover:flex dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction
                onSelect={(text) => onEmojiSelect(text, chatIndex)}
                position="bottom"
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
                    position="bottom"
                  />
                  <Tooltip.Actions.Delete
                    onClick={deleteChat}
                    position="bottom"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={chat.content}
        codeBlock={chat.code_block}
        language={chat.language}
        onSubmit={updateCodeChat}
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default ThreadDrawerChat
