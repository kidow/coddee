import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import type { FC } from 'react'
import {
  backdrop,
  EventListener,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'

export interface Props {
  chat: NTable.Chats & {
    user: NTable.Users
    replies: Array<
      NTable.Replies & {
        user: NTable.Users
        reply_reactions: NTable.ReplyReactions[]
        opengraphs: NTable.Opengraphs[]
      }
    >
    reactions: Array<NTable.Reactions & { user: NTable.Users }>
    room: NTable.Rooms
    opengraphs: NTable.Opengraphs[]
  }
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const ThreadChat: FC<Props> = ({ chat }) => {
  const [{ isUpdateMode, isSubmitting, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isSubmitting: false,
      isCodeEditorOpen: false
    })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()

  const updateChat = async (content: string) => {
    if (isSubmitting) return

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

    setState({ isSubmitting: true })
    const { error } = await supabase
      .from('chats')
      .update({ content })
      .eq('id', chat.id)
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const updateReaction = async (key: number) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const reaction = chat.reactions[key]
    const userIndex = reaction.userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reactions').insert({
        chat_id: chat.id,
        user_id: user.id,
        text: reaction.text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const { error } = await supabase.from('reactions').delete().match({
        user_id: user.id,
        chat_id: chat.id,
        text: reaction.text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    }
  }

  const onEmojiSelect = async (text: string) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const reactionIndex = chat.reactions.findIndex((item) => item.text === text)
    if (reactionIndex === -1) {
      const { error } = await supabase.from('reactions').insert({
        user_id: user.id,
        chat_id: chat.id,
        text,
        room_id: chat.room.id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    } else {
      const userIndex = chat.reactions[reactionIndex].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { error } = await supabase.from('reactions').insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: chat.room.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
      } else {
        const { error } = await supabase.from('reactions').delete().match({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: chat.room.id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
      }
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
      code_block: chat.code_block,
      language: chat.language,
      modified_code: payload.codeBlock,
      modified_language: payload.language,
      user_id: user?.id,
      room_id: chat.room_id
    })
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    EventListener.emit('message:codeblock')
  }
  return (
    <>
      <div className="group relative flex gap-3 py-1 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <Message.Avatar
          url={chat.user.avatar_url}
          userId={chat.user.id}
          deletedAt={chat.deleted_at}
        />
        {!!chat?.deleted_at ? (
          <div className="mt-0.5 flex h-9 items-center text-sm text-neutral-400">
            이 메시지는 삭제되었습니다.
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <div className="flex items-center text-sm font-medium">
                <span>{chat.user.nickname}</span>
                {chat.user_id === user?.id && (
                  <span className="ml-1 text-xs text-neutral-400">(나)</span>
                )}
              </div>
              <span className="text-xs text-neutral-400">
                {dayjs(chat.created_at).locale('ko').fromNow()}
              </span>
            </div>
            <div>
              {isUpdateMode ? (
                <Message.Update
                  content={chat.content}
                  onCancel={() => setState({ isUpdateMode: false })}
                  onSave={updateChat}
                />
              ) : (
                <Message.Parser
                  content={chat.content}
                  updatedAt={chat.updated_at}
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
            />
            {chat.opengraphs?.map((item) => (
              <Message.Opengraph {...item} key={item.id} />
            ))}
            {!!chat.reactions?.length && (
              <Message.Reactions>
                {chat.reactions.map((item, key) => (
                  <Tooltip.Reaction
                    userList={item.userList}
                    key={key}
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
          <div className="absolute right-6 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
            <div className="flex p-0.5">
              <Tooltip.Actions.AddReaction onSelect={onEmojiSelect} />
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
      />
    </>
  )
}

export default ThreadChat
