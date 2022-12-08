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
  cheerio,
  EventListener,
  threadListState,
  toast,
  TOAST_MESSAGE,
  useChatList,
  useObjectState,
  useUser
} from 'services'

export interface Props {
  chatIndex: number
  replyIndex: number
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const ThreadReply: FC<Props> = ({ chatIndex, replyIndex }) => {
  const [{ isSubmitting, isUpdateMode, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isSubmitting: false,
      isUpdateMode: false,
      isCodeEditorOpen: false
    })
  const [user] = useUser()
  const supabase = useSupabaseClient<Database>()
  const [list, setList] = useRecoilState(threadListState)
  const { onRegex } = useChatList()

  const updateReply = async (content?: string) => {
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

    if (!content?.trim() || content === '<p><br></p>') return
    if (cheerio.getText(content).length > 300) {
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
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setList([
      ...list.slice(0, chatIndex),
      { ...chat, content, updated_at: data.updated_at },
      ...list.slice(chatIndex + 1)
    ])
  }

  const updateReplyReaction = async (index: number) => {
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

    const userIndex = reply.reply_reactions[index].userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { data, error } = await supabase
        .from('reply_reactions')
        .insert({
          user_id: user.id,
          reply_id: reply.id,
          text: reply.reply_reactions[index].text,
          chat_id: reply.chat_id
        })
        .select()
        .single()
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, chatIndex),
        {
          ...chat,
          replies: [
            ...chat.replies.slice(0, replyIndex),
            {
              ...reply,
              reply_reactions:
                index === -1
                  ? [
                      ...reply.reply_reactions,
                      {
                        ...data,
                        user: { nickname: user.nickname },
                        userList: [
                          {
                            id: user.id,
                            reactionId: data.id,
                            nickname: user.nickname
                          }
                        ]
                      }
                    ]
                  : [
                      ...reply.reply_reactions.slice(0, index),
                      {
                        ...reply.reply_reactions[index],
                        userList: [
                          ...reply.reply_reactions[index].userList,
                          {
                            id: user.id,
                            reactionId: data.id,
                            nickname: user.nickname
                          }
                        ]
                      },
                      ...reply.reply_reactions.slice(index + 1)
                    ]
            },
            ...chat.replies.slice(replyIndex + 1)
          ]
        },
        ...list.slice(chatIndex + 1)
      ])
    } else {
      const { error } = await supabase
        .from('reply_reactions')
        .delete()
        .eq('id', reply.reply_reactions[index].id)
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, chatIndex),
        {
          ...chat,
          replies: [
            ...chat.replies.slice(0, replyIndex),
            {
              ...reply,
              reply_reactions:
                reply.reply_reactions[index].userList.length > 1
                  ? [
                      ...reply.reply_reactions.slice(0, index),
                      {
                        ...reply.reply_reactions[index],
                        userList: reply.reply_reactions[index].userList.filter(
                          (item) => item.id !== user.id
                        )
                      },
                      ...reply.reply_reactions.slice(index + 1)
                    ]
                  : reply.reply_reactions.filter(
                      (item) => item.text !== reply.reply_reactions[index].text
                    )
            },
            ...chat.replies.slice(replyIndex + 1)
          ]
        },
        ...list.slice(chatIndex + 1)
      ])
    }
  }

  const onEmojiSelect = async (text: string, emoji: string) => {
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
          chat_id: reply.chat_id,
          emoji
        })
        .select()
        .single()
      if (error) {
        captureException(error, user)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, chatIndex),
        {
          ...chat,
          replies: [
            ...chat.replies.slice(0, replyIndex),
            {
              ...reply,
              reply_reactions:
                reactionIndex === -1
                  ? [
                      ...reply.reply_reactions,
                      {
                        ...data,
                        user: { nickname: user.nickname },
                        userList: [
                          {
                            id: user.id,
                            reactionId: data.id,
                            nickname: user.nickname
                          }
                        ]
                      }
                    ]
                  : [
                      ...reply.reply_reactions.slice(0, reactionIndex),
                      {
                        ...reply.reply_reactions[reactionIndex],
                        userList: [
                          ...reply.reply_reactions[reactionIndex].userList,
                          {
                            id: user.id,
                            reactionId: data.id,
                            nickname: user.nickname
                          }
                        ]
                      },
                      ...reply.reply_reactions.slice(reactionIndex + 1)
                    ]
            },
            ...chat.replies.slice(replyIndex + 1)
          ]
        },
        ...list.slice(chatIndex + 1)
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
            chat_id: reply.chat_id,
            emoji
          })
          .select()
          .single()
        if (error) {
          captureException(error, user)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setList([
          ...list.slice(0, chatIndex),
          {
            ...chat,
            replies: [
              ...chat.replies.slice(0, replyIndex),
              {
                ...reply,
                reply_reactions:
                  reactionIndex === -1
                    ? [
                        ...reply.reply_reactions,
                        {
                          ...data,
                          user: { nickname: user.nickname },
                          userList: [
                            {
                              id: user.id,
                              reactionId: data.id,
                              nickname: user.nickname
                            }
                          ]
                        }
                      ]
                    : [
                        ...reply.reply_reactions.slice(0, reactionIndex),
                        {
                          ...reply.reply_reactions[reactionIndex],
                          userList: [
                            ...reply.reply_reactions[reactionIndex].userList,
                            {
                              id: user.id,
                              reactionId: data.id,
                              nickname: user.nickname
                            }
                          ]
                        },
                        ...reply.reply_reactions.slice(reactionIndex + 1)
                      ]
              },
              ...chat.replies.slice(replyIndex + 1)
            ]
          },
          ...list.slice(chatIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      } else {
        const { error } = await supabase
          .from('reply_reactions')
          .delete()
          .eq('id', reply.reply_reactions[reactionIndex].id)
        if (error) {
          captureException(error, user)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setList([
          ...list.slice(0, chatIndex),
          {
            ...chat,
            replies: [
              ...chat.replies.slice(0, replyIndex),
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
              ...chat.replies.slice(replyIndex + 1)
            ]
          },
          ...list.slice(chatIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      }
    }
  }

  const deleteReply = async () => {
    const { error } = await supabase.from('replies').delete().eq('id', reply.id)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      EventListener.emit('tooltip:delete:error')
      return
    }
    EventListener.emit('tooltip:delete')
    setList([
      ...list.slice(0, chatIndex),
      {
        ...chat,
        replies: [
          ...chat.replies.slice(0, replyIndex),
          ...chat.replies.slice(replyIndex + 1)
        ]
      },
      ...list.slice(chatIndex + 1)
    ])
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
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setList([
      ...list.slice(0, chatIndex),
      {
        ...chat,
        replies: [
          ...chat.replies.slice(0, replyIndex),
          {
            ...reply,
            updated_at: data.updated_at,
            content: payload.content,
            code_block: payload.codeBlock,
            language: payload.language
          },
          ...chat.replies.slice(replyIndex + 1)
        ]
      },
      ...list.slice(chatIndex + 1)
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
        chat_id: reply.chat_id,
        user_id: user?.id || ''
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, chat.id, reply.id)
    EventListener.emit('message:codeblock')
    setList([
      ...list.slice(0, chatIndex),
      {
        ...chat,
        replies: [
          ...chat.replies,
          {
            ...data,
            reply_reactions: [],
            saves: [],
            opengraphs: [],
            user: {
              id: user?.id || '',
              nickname: user?.nickname || '',
              avatar_url: user?.avatar_url || ''
            }
          }
        ]
      },
      ...list.slice(chatIndex + 1)
    ])
  }

  const chat = useMemo(() => list[chatIndex], [list, chatIndex])

  const reply = useMemo(() => chat.replies[replyIndex], [chat, replyIndex])
  return (
    <>
      <div className="group relative flex gap-3 py-2 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-700">
        <Message.Avatar
          url={reply.user.avatar_url || ''}
          userId={reply.user.id}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm font-medium">
              <span>{reply.user.nickname}</span>
              {reply.user_id === user?.id && (
                <span className="ml-1 text-xs text-neutral-400">(나)</span>
              )}
            </div>
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
                className="max-w-[684px]"
              />
            ) : (
              <Message
                content={reply.content}
                updatedAt={reply.updated_at || ''}
              />
            )}
          </div>
          <Message.CodeBlock
            originalCode={reply.code_block || ''}
            language={reply.language || ''}
            onSubmit={createModifiedCodeReply}
            modifiedCode={reply.modified_code || ''}
            modifiedLanguage={reply.modified_language || ''}
            typingSource="reply"
            chatId={chat.id}
            username={reply.user.nickname}
            userId={reply.user_id}
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
                  emoji={item.emoji || ''}
                />
              ))}
              <Tooltip.AddReaction onSelect={onEmojiSelect} />
            </Message.Reactions>
          )}
        </div>
        <Message.Actions>
          <Tooltip.Actions.AddReaction onSelect={onEmojiSelect} />
          {reply.user_id === user?.id && (
            <>
              <Tooltip.Actions.Update onClick={() => updateReply()} />
              <Tooltip.Actions.Delete onClick={deleteReply} />
            </>
          )}
        </Message.Actions>
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        onSubmit={updateCodeReply}
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default ThreadReply
