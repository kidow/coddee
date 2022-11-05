import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import type { FC } from 'react'
import {
  backdrop,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'

export interface Props {
  chat:
    | (NTable.Chats & {
        user: NTable.Users
        reactions: NTable.Reactions[]
        opengraphs: NTable.Opengraphs[]
        saves: NTable.Saves[]
      })
    | null
  updateReaction: (reactionIndex: number) => void
  replyLength: number
  onClose: () => void
}
interface State {
  isUpdateMode: boolean
  isUpdating: boolean
  isCodeEditorOpen: boolean
}

const ThreadDrawerChat: FC<Props> = ({
  chat,
  updateReaction,
  replyLength,
  onClose
}) => {
  const [{ isUpdateMode, isUpdating, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isUpdating: false,
      isCodeEditorOpen: false
    })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()
  const { query } = useRouter()

  const updateChat = async (content: string) => {
    if (isUpdating) return

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
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

    setState({ isUpdating: true })
    const { error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat?.id)
    setState({ isUpdating: false, isUpdateMode: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    }
  }

  const onEmojiSelect = async (text: string) => {
    if (!user || !chat) return

    const index = chat.reactions.findIndex((item) => item.text === text)
    if (index === -1) {
      const { error } = await supabase.from('reactions').insert({
        user_id: user.id,
        chat_id: chat.id,
        text,
        room_id: query.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const userIndex = chat.reactions[index].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { error } = await supabase.from('reactions').insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: query.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      } else {
        const { error } = await supabase.from('reactions').delete().match({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: query.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      }
    }
  }

  const deleteChat = async () => {
    if (!!replyLength) {
      const { error } = await supabase
        .from('chats')
        .update({
          // @ts-ignore
          deleted_at: new Date().toISOString().toLocaleString('ko-KR')
        })
        .eq('id', chat?.id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    } else {
      const { error } = await supabase.from('chats').delete().eq('id', chat?.id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      onClose()
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
      .eq('id', chat?.id)
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
  }
  return (
    <>
      <div className="group relative flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <Message.Avatar
          url={chat?.user.avatar_url || ''}
          userId={chat?.user_id || ''}
          deletedAt={chat?.deleted_at}
        />
        {!!chat?.deleted_at ? (
          <div className="mt-0.5 flex h-9 items-center text-sm text-neutral-400">
            이 메시지는 삭제되었습니다.
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center text-sm font-medium">
                {chat?.user?.nickname}
                {chat?.user_id === user?.id && (
                  <span className="ml-1 text-xs text-neutral-400">(나)</span>
                )}
              </span>
              <span className="text-xs text-neutral-400">
                {dayjs(chat?.created_at).locale('ko').format('A H:mm')}
              </span>
            </div>
            <div>
              {isUpdateMode ? (
                <Message.Update
                  content={chat?.content || ''}
                  onCancel={() => setState({ isUpdateMode: false })}
                  onSave={updateChat}
                />
              ) : (
                <Message.Parser
                  content={chat?.content || ''}
                  updatedAt={chat?.updated_at || ''}
                />
              )}
            </div>
            <Message.CodeBlock
              originalCode={chat?.code_block}
              language={chat?.language}
            />
            {chat?.opengraphs?.map((item) => (
              <Message.Opengraph {...item} key={item.id} />
            ))}
            {!!chat?.reactions?.length && (
              <Message.Reactions>
                {chat.reactions.map((item, key) => (
                  <Tooltip.Reaction
                    userList={item.userList}
                    key={item.id}
                    onClick={() => updateReaction(key)}
                    text={item.text}
                    length={item?.userList.length}
                  />
                ))}
                <Tooltip.AddReaction onSelect={onEmojiSelect} />
              </Message.Reactions>
            )}
          </div>
        )}
        {!chat?.deleted_at && !isUpdateMode && (
          <div className="absolute top-4 right-4 z-10 hidden rounded-lg border bg-white group-hover:flex dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction
                onSelect={onEmojiSelect}
                position="bottom"
              />
              {chat?.user_id === user?.id && (
                <>
                  <Tooltip.Actions.Update
                    onClick={() =>
                      setState({
                        isUpdateMode: !chat?.code_block,
                        isCodeEditorOpen: !!chat?.code_block
                      })
                    }
                    position="bottom"
                  />
                  <Tooltip.Actions.Delete onClick={deleteChat} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={chat?.content}
        codeBlock={chat?.code_block}
        language={chat?.language}
        onSubmit={updateCodeChat}
      />
    </>
  )
}

export default ThreadDrawerChat
