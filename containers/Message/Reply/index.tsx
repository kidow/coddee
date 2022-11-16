import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { FC } from 'react'
import {
  backdrop,
  chatListState,
  EventListener,
  replyListState,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'
import classnames from 'classnames'
import { BookmarkIcon } from '@heroicons/react/20/solid'
import { useRecoilState } from 'recoil'

export interface Props {
  chatIndex: number
  replyIndex: number
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const MessageReply: FC<Props> = ({ chatIndex, replyIndex }) => {
  const [{ isUpdateMode, isSubmitting, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isSubmitting: false,
      isCodeEditorOpen: false
    })
  const [user] = useUser()
  const supabase = useSupabaseClient()
  const [chatList, setChatList] = useRecoilState(chatListState)
  const [replyList, setReplyList] = useRecoilState(replyListState)
  const { onRegex } = useChatList()

  const updateReply = async (content?: string) => {
    if (isSubmitting) return

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!content?.trim()) return
    if (content.length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('replies')
      .update({ content })
      .eq('id', reply.id)
      .select('updated_at')
      .single()
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setReplyList([
      ...replyList.slice(0, replyIndex),
      { ...reply, content, updated_at: data.updated_at },
      ...replyList.slice(replyIndex + 1)
    ])
  }

  const deleteReply = async () => {
    const { error } = await supabase.from('replies').delete().eq('id', reply.id)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      EventListener.emit('tooltip:delete:error')
      return
    }
    EventListener.emit('tooltip:delete')
    setReplyList([
      ...replyList.slice(0, replyIndex),
      ...replyList.slice(replyIndex + 1)
    ])
    setChatList([
      ...chatList.slice(0, chatIndex),
      {
        ...chatList[chatIndex],
        replies: [
          ...chatList[chatIndex].replies.slice(0, replyIndex),
          ...chatList[chatIndex].replies.slice(replyIndex + 1)
        ]
      },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const updateReplyReaction = async (reactionIndex: number) => {
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

    const userIndex = reply.reply_reactions[reactionIndex].userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { data, error } = await supabase
        .from('reply_reactions')
        .insert({
          user_id: user.id,
          reply_id: reply.id,
          text: reply.reply_reactions[reactionIndex].text,
          chat_id: reply.chat_id
        })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setReplyList([
        ...replyList.slice(0, replyIndex),
        {
          ...reply,
          reply_reactions:
            reactionIndex === -1
              ? [
                  ...reply.reply_reactions,
                  {
                    ...data,
                    userList: [{ id: user.id, nickname: user.nickname }]
                  }
                ]
              : [
                  ...reply.reply_reactions.slice(0, reactionIndex),
                  {
                    ...reply.reply_reactions[reactionIndex],
                    userList: [
                      ...reply.reply_reactions[reactionIndex].userList,
                      { id: user.id, nickname: user.nickname }
                    ]
                  },
                  ...reply.reply_reactions.slice(reactionIndex + 1)
                ]
        },
        ...replyList.slice(replyIndex + 1)
      ])
    } else {
      const { error } = await supabase
        .from('reply_reactions')
        .delete()
        .eq('id', reply.reply_reactions[reactionIndex].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setReplyList([
        ...replyList.slice(0, replyIndex),
        {
          ...reply,
          reply_reactions:
            reply.reply_reactions[reactionIndex].userList.length > 1
              ? [
                  ...reply.reply_reactions.slice(0, reactionIndex),
                  {
                    ...reply.reply_reactions[reactionIndex],
                    userList: reply.reply_reactions[
                      reactionIndex
                    ].userList.filter((item) => item.id !== user.id)
                  },
                  ...reply.reply_reactions.slice(reactionIndex + 1)
                ]
              : reply.reply_reactions.filter(
                  (item) =>
                    item.text !== reply.reply_reactions[reactionIndex].text
                )
        },
        ...replyList.slice(replyIndex + 1)
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
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const reactionIndex = reply.reply_reactions.findIndex(
      (item) => item.text === text
    )
    if (reactionIndex === -1) {
      const { data, error } = await supabase
        .from('reply_reactions')
        .insert({
          user_id: user.id,
          reply_id: reply.id,
          text,
          chat_id: reply.chat_id
        })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setReplyList([
        ...replyList.slice(0, replyIndex),
        {
          ...reply,
          reply_reactions:
            reactionIndex === -1
              ? [
                  ...reply.reply_reactions,
                  {
                    ...data,
                    userList: [{ id: user.id, nickname: user.nickname }]
                  }
                ]
              : [
                  ...reply.reply_reactions.slice(0, reactionIndex),
                  {
                    ...reply.reply_reactions[reactionIndex],
                    userList: [
                      ...reply.reply_reactions[reactionIndex].userList,
                      { id: user.id, nickname: user.nickname }
                    ]
                  },
                  ...reply.reply_reactions.slice(reactionIndex + 1)
                ]
        },
        ...replyList.slice(replyIndex + 1)
      ])
      EventListener.emit('modal:emoji')
    } else {
      const userIndex = reply.reply_reactions[reactionIndex].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { data, error } = await supabase
          .from('reply_reactions')
          .insert({
            user_id: user.id,
            reply_id: reply.id,
            text,
            chat_id: reply.chat_id
          })
          .select()
          .single()
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }

        setReplyList([
          ...replyList.slice(0, replyIndex),
          {
            ...reply,
            reply_reactions:
              reactionIndex === -1
                ? [
                    ...reply.reply_reactions,
                    {
                      ...data,
                      userList: [{ id: user.id, nickname: user.nickname }]
                    }
                  ]
                : [
                    ...reply.reply_reactions.slice(0, reactionIndex),
                    {
                      ...reply.reply_reactions[reactionIndex],
                      userList: [
                        ...reply.reply_reactions[reactionIndex].userList,
                        { id: user.id, nickname: user.nickname }
                      ]
                    },
                    ...reply.reply_reactions.slice(reactionIndex + 1)
                  ]
          },
          ...replyList.slice(replyIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      } else {
        const { error } = await supabase
          .from('reply_reactions')
          .delete()
          .eq('id', reply.reply_reactions[reactionIndex].id)
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setReplyList([
          ...replyList.slice(0, replyIndex),
          {
            ...reply,
            reply_reactions:
              reply.reply_reactions.length > 1
                ? [
                    ...reply.reply_reactions.slice(0, reactionIndex),
                    {
                      ...reply.reply_reactions[reactionIndex],
                      userList: reply.reply_reactions[
                        reactionIndex
                      ].userList.filter((item) => item.id !== user.id)
                    },
                    ...reply.reply_reactions.slice(reactionIndex + 1)
                  ]
                : reply.reply_reactions.filter((item) => item.text !== text)
          },
          ...replyList.slice(replyIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      }
    }
  }

  const onSaveReply = async () => {
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

    if (!!reply.saves?.length) {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', reply.saves[0].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setReplyList([
        ...replyList.slice(0, replyIndex),
        { ...reply, saves: [] },
        ...replyList.slice(replyIndex + 1)
      ])
    } else {
      const { data, error } = await supabase
        .from('saves')
        .insert({ user_id: user.id, reply_id: reply.id })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setReplyList([
        ...replyList.slice(0, replyIndex),
        { ...reply, saves: [data] },
        ...replyList.slice(replyIndex + 1)
      ])
    }
  }

  const updateCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('replies')
      .update({
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .eq('id', reply.id)
      .select('updated_at')
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setReplyList([
      ...replyList.slice(0, replyIndex),
      {
        ...reply,
        updated_at: data.updated_at,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      },
      ...replyList.slice(replyIndex + 1)
    ])
  }

  const createModifiedCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({
        content: payload.content,
        code_block: reply.modified_code || reply.code_block,
        language: reply.modified_language || reply.language,
        modified_code: payload.codeBlock,
        modified_language: payload.language,
        user_id: user?.id,
        chat_id: reply.chat_id
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, reply.chat_id, reply.id)
    EventListener.emit('message:codeblock')
    setReplyList([
      ...replyList,
      {
        ...data,
        reply_reactions: [],
        saves: [],
        opengraphs: [],
        user: { nickname: user?.nickname, avatar_url: user?.avatar_url }
      }
    ])
    setChatList([
      ...chatList.slice(0, chatIndex),
      {
        ...chatList[chatIndex],
        replies: [
          ...chatList[chatIndex].replies,
          {
            id: data.id,
            created_at: data.created_at,
            user: { avatar_url: user!.avatar_url }
          }
        ]
      },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const reply = useMemo(() => replyList[replyIndex], [replyList, replyIndex])
  return (
    <>
      <div
        className={classnames(
          'group relative flex items-start gap-3 py-2 pl-4 pr-6 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          { 'bg-red-50': !!reply.saves?.length }
        )}
      >
        {!!reply.saves?.length && (
          <span className="absolute top-2 right-3">
            <BookmarkIcon className="h-4 w-4 text-red-500" />
          </span>
        )}
        <Message.Avatar url={reply.user.avatar_url} userId={reply.user_id} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex cursor-pointer items-center text-sm font-medium">
              <span>{reply.user?.nickname}</span>
              {reply.user_id === user?.id && (
                <span className="ml-1 text-xs text-neutral-400">(나)</span>
              )}
            </span>
            <span className="text-xs text-neutral-400">
              {dayjs(reply.created_at).locale('ko').fromNow()}
            </span>
          </div>
          <div>
            {isUpdateMode ? (
              <Message.Update
                content={reply.content}
                onCancel={() => setState({ isUpdateMode: false })}
                onSave={updateReply}
              />
            ) : (
              <Message.Parser
                content={reply.content}
                updatedAt={reply.updated_at}
              />
            )}
          </div>
          <Message.CodeBlock
            originalCode={reply.code_block}
            language={reply.language}
            onSubmit={createModifiedCodeReply}
            mention={`@[${reply.user.nickname}](${reply.user_id})`}
            modifiedCode={reply.modified_code}
            modifiedLanguage={reply.modified_language}
            typingSource="reply"
            chatId={reply.chat_id}
          />
          {reply.opengraphs?.map((item) => (
            <Message.Opengraph {...item} key={item.id} />
          ))}
          {!!reply.reply_reactions?.length && (
            <Message.Reactions>
              {reply.reply_reactions.map((item, key) => (
                <Tooltip.Reaction
                  userList={item.userList}
                  key={key}
                  onClick={() => updateReplyReaction(key)}
                  text={item.text}
                  length={item?.userList.length}
                />
              ))}
              <Tooltip.AddReaction onSelect={onEmojiSelect} />
            </Message.Reactions>
          )}
        </div>
        <Message.Actions>
          <Tooltip.Actions.AddReaction onSelect={onEmojiSelect} />
          <Tooltip.Actions.Save
            onClick={onSaveReply}
            isSaved={!!reply.saves?.length}
          />
          {reply.user_id === user?.id && (
            <>
              <Tooltip.Actions.Update
                onClick={() =>
                  setState({
                    isUpdateMode: !reply.code_block,
                    isCodeEditorOpen: !!reply.code_block
                  })
                }
              />
              <Tooltip.Actions.Delete onClick={deleteReply} />
            </>
          )}
        </Message.Actions>
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        onSubmit={updateCodeReply}
        content={reply.content}
        codeBlock={reply.code_block}
        language={reply.language}
        typingSource="reply"
        chatId={reply.chat_id}
      />
    </>
  )
}

export default MessageReply
