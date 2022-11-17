import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { FC } from 'react'
import { useRecoilState } from 'recoil'
import {
  backdrop,
  captureException,
  EventListener,
  threadListState,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'

export interface Props {
  index: number
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const ThreadChat: FC<Props> = ({ index }) => {
  const [{ isUpdateMode, isSubmitting, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isSubmitting: false,
      isCodeEditorOpen: false
    })
  const [user] = useUser()
  const supabase = useSupabaseClient()
  const [list, setList] = useRecoilState(threadListState)
  const { onRegex } = useChatList()

  const updateChat = async (content: string) => {
    if (isSubmitting) return

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setList([])
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
      .eq('id', chat.id)
      .select('updated_at')
      .single()
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      captureException(error, user)
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setList([
      ...list.slice(0, index),
      { ...chat, content, updated_at: data.updated_at },
      ...list.slice(index + 1)
    ])
  }

  const onReactionClick = async (reactionIndex: number) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setList([])
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const reaction = chat.reactions[reactionIndex]
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
        captureException(error, user)
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, index),
        {
          ...chat,
          reactions: [
            ...chat.reactions.slice(0, reactionIndex),
            {
              ...reaction,
              userList: [
                ...chat.reactions[reactionIndex].userList,
                { id: user.id, nickname: user.nickname }
              ]
            },
            ...chat.reactions.slice(reactionIndex + 1)
          ]
        },
        ...list.slice(index + 1)
      ])
    } else {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', reaction.id)
      if (error) {
        captureException(error, user)
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }

      setList([
        ...list.slice(0, index),
        {
          ...chat,
          reactions: [
            ...chat.reactions.slice(0, reactionIndex),
            ...chat.reactions.slice(reactionIndex + 1)
          ]
        },
        ...list.slice(index + 1)
      ])
    }
  }

  const onEmojiSelect = async (text: string) => {
    if (!user) {
      toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setList([])
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const reactionIndex = chat.reactions.findIndex((item) => item.text === text)
    const reaction = chat.reactions[reactionIndex]
    if (reactionIndex === -1) {
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: chat.room.id
        })
        .select()
        .single()
      if (error) {
        captureException(error, user)
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }

      setList([
        ...list.slice(0, index),
        {
          ...chat,
          reactions:
            reactionIndex === -1
              ? [
                  ...chat.reactions,
                  {
                    ...data,
                    userList: [{ id: user.id, nickname: user.nickname }]
                  }
                ]
              : [
                  ...chat.reactions.slice(0, reactionIndex),
                  {
                    ...reaction,
                    userList: [
                      ...reaction.userList,
                      { id: user.id, nickname: user.nickname }
                    ]
                  },
                  ...chat.reactions.slice(reactionIndex + 1)
                ]
        },
        ...list.slice(index + 1)
      ])
      EventListener.emit('modal:emoji')
    } else {
      const userIndex = chat.reactions[reactionIndex].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            chat_id: chat.id,
            text,
            room_id: chat.room.id
          })
          .select()
          .single()
        if (error) {
          captureException(error, user)
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setList([
          ...list.slice(0, index),
          {
            ...chat,
            reactions:
              reactionIndex === -1
                ? [
                    ...chat.reactions,
                    {
                      ...data,
                      userList: [{ id: user.id, nickname: user.nickname }]
                    }
                  ]
                : [
                    ...chat.reactions.slice(0, reactionIndex),
                    {
                      ...reaction,
                      userList: [
                        ...reaction.userList,
                        { id: user.id, nickname: user.nickname }
                      ]
                    },
                    ...chat.reactions.slice(reactionIndex + 1)
                  ]
          },
          ...list.slice(index + 1)
        ])
        EventListener.emit('modal:emoji')
      } else {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', chat.reactions[reactionIndex].id)
        if (error) {
          captureException(error, user)
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setList([
          ...list.slice(0, index),
          {
            ...chat,
            reactions:
              reaction.userList.length > 1
                ? [
                    ...chat.reactions.slice(0, reactionIndex),
                    {
                      ...reaction,
                      userList: reaction.userList.filter(
                        (item) => item.id !== user.id
                      )
                    },
                    ...chat.reactions.slice(reactionIndex + 1)
                  ]
                : chat.reactions.filter((item) => item.text !== text)
          },
          ...list.slice(index + 1)
        ])
        EventListener.emit('modal:emoji')
      }
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
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setList([
      ...list.slice(0, index),
      {
        ...chat,
        updated_at: data.updated_at,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      },
      ...list.slice(index + 1)
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
        code_block: chat.modified_code || chat.code_block,
        language: chat.modified_language || chat.language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        user_id: user?.id,
        room_id: chat.room_id
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, chat.id)
    EventListener.emit('message:codeblock')
    setList([
      {
        ...data,
        reactions: [],
        saves: [],
        replies: [],
        opengraphs: [],
        user: { nickname: user?.nickname, avatar_url: user?.avatar_url }
      },
      ...list
    ])
  }

  const chat = useMemo(() => list[index], [list, index])
  return (
    <>
      <div className="group relative flex gap-3 py-1 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <Message.Avatar
          url={chat.user.avatar_url}
          userId={chat.user.id}
          deletedAt={chat.deleted_at}
        />
        {!!chat.deleted_at ? (
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
                    key={key}
                    onClick={() => onReactionClick(key)}
                    text={item.text}
                    length={item?.userList.length}
                  />
                ))}
                <Tooltip.AddReaction onSelect={onEmojiSelect} />
              </Message.Reactions>
            )}
          </div>
        )}
        {!chat.deleted_at && !isUpdateMode && (
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
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default ThreadChat
