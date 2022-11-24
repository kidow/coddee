import { useEffect, useId, useMemo } from 'react'
import type { FC } from 'react'
import { Drawer, Modal, Message } from 'containers'
import {
  backdrop,
  captureException,
  chatListState,
  cheerio,
  EventListener,
  replyListState,
  toast,
  TOAST_MESSAGE,
  typingReplyListState,
  useChatList,
  useObjectState,
  useUser
} from 'services'
import { Textarea, Spinner, Typing } from 'components'
import { ArrowSmallUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import classnames from 'classnames'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import ThreadDrawerChat from './Chat'
import { useRecoilState, useSetRecoilState } from 'recoil'

export interface Props extends DrawerProps {
  chatIndex: number
}
interface State {
  content: string
  isCodeEditorOpen: boolean
  isSubmitting: boolean
  spamCount: number
}

const ThreadDrawer: FC<Props> = ({ isOpen, onClose, chatIndex }) => {
  if (!isOpen) return null
  const [{ content, isCodeEditorOpen, isSubmitting, spamCount }, setState] =
    useObjectState<State>({
      content: '',
      isCodeEditorOpen: false,
      isSubmitting: false,
      spamCount: 0
    })
  const supabase = useSupabaseClient()
  const [user] = useUser()
  const { onRegex } = useChatList()
  const [chatList, setChatList] = useRecoilState(chatListState)
  const [replyList, setReplyList] = useRecoilState(replyListState)
  const setTypingReplyList = useSetRecoilState(typingReplyListState)
  const id = useId()

  const get = async () => {
    const { data, error } = await supabase
      .from('replies')
      .select(
        `
        id,
        content,
        language,
        code_block,
        created_at,
        updated_at,
        user_id,
        chat_id,
        modified_code,
        modified_language,
        user:user_id (
          id,
          nickname,
          avatar_url
        ),
        reply_reactions (
          id,
          text,
          emoji,
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
        saves!saves_reply_id_fkey (
          id
        )
    `
      )
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
      .order('created_at', { ascending: true, foreignTable: 'reply_reactions' })
    if (error) {
      captureException(error, user)
      return
    }
    if (!data.length) {
      EventListener.emit(`quill:focus:${id}`)
      return
    }
    for (const reply of data) {
      let reply_reactions: Array<{
        id: number
        reply_id: number
        text: string
        emoji: string
        userList: Array<{ id: string; reactionId: number; nickname: string }>
      }> = []
      // @ts-ignore
      if (reply.reply_reactions.length > 0) {
        // @ts-ignore
        for (const reaction of reply.reply_reactions) {
          const index = reply_reactions.findIndex(
            (item) => item.text === reaction.text
          )
          if (index === -1) {
            reply_reactions.push({
              id: reaction.id,
              reply_id: reaction.reply_id,
              text: reaction.text,
              emoji: reaction.emoji,
              userList: [
                {
                  id: reaction.user_id,
                  reactionId: reaction.id,
                  nickname: reaction.user.nickname
                }
              ]
            })
          } else {
            const userIndex = reply_reactions[index].userList.findIndex(
              (item) => item.id === reaction.user_id
            )
            if (userIndex === -1)
              reply_reactions[index].userList = [
                ...reply_reactions[index].userList,
                {
                  id: reaction.user_id,
                  reactionId: reaction.id,
                  nickname: reaction.user.nickname
                }
              ]
          }
        }
      }
      // @ts-ignore
      reply.reply_reactions = reply_reactions
    }
    setReplyList(data as any[])
  }

  const createReply = async (value?: string) => {
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

    if (spamCount >= 3) {
      toast.warn('도배는 자제 부탁드립니다. :)')
      return
    }

    const v = value || content

    if (!v.trim() || v === '<p><br></p>') return
    if (cheerio.getText(v).length > 300) {
      toast.info('300자 이상은 너무 길어요 :(')
      return
    }

    setState({ isSubmitting: true })
    const { data, error } = await supabase
      .from('replies')
      .insert({ user_id: user.id, chat_id: chat.id, content: v })
      .select()
      .single()
    setState({ isSubmitting: false, spamCount: spamCount + 1 })
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(content, data.chat_id, data.id)
    setState({ content: '' })
    setReplyList([
      ...replyList,
      {
        ...data,
        user: {
          id: user.id,
          avatar_url: user.avatar_url,
          nickname: user.nickname
        },
        reply_reactions: [],
        opengraphs: [],
        saves: []
      }
    ])
    setChatList([
      ...chatList.slice(0, chatIndex),
      {
        ...chat,
        replies: [
          ...chat.replies,
          {
            id: data.id,
            created_at: data.created_at,
            user: { avatar_url: user.avatar_url }
          }
        ]
      },
      ...chatList.slice(chatIndex + 1)
    ])
  }

  const createCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({
        user_id: user?.id,
        chat_id: chat.id,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      captureException(error, user)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, data.chat_id, data.id)
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
        ...chat,
        replies: [
          ...chat.replies,
          {
            id: data.id,
            created_at: data.created_at,
            user: { avatar_url: user!.avatar_url }
          }
        ]
      },
      ...chatList.slice(chatIndex + 1)
    ])
    setState({ content: '', isCodeEditorOpen: false })
  }

  const onEnter = async (value: string) => {
    createReply(value)
    const channel = supabase
      .getChannels()
      .find((item) => item.topic === `realtime:is-typing:reply/${chat.id}`)
    if (channel) await channel.untrack()
  }

  const onKeyDown = async () => {
    if (!user) return
    const channel = supabase
      .getChannels()
      .find((item) => item.topic === `realtime:is-typing:reply/${chat.id}`)
    if (channel)
      await channel.track({
        userId: user.id,
        nickname: user.nickname,
        chatId: chat.id
      })
  }

  const onFocus = (e: globalThis.KeyboardEvent) => {
    if (!e.target) return
    const target = e.target as HTMLElement

    const isNotFocusingEditor = target?.className !== 'ql-editor'
    const isDrawerOpen =
      Array.from(document.body.childNodes).findIndex(
        (item: any) => item.id === 'drawer'
      ) === -1
    const isInputFocusing =
      ['input', 'textarea'].indexOf(target.tagName?.toLowerCase()) === -1
    if (isNotFocusingEditor && isInputFocusing && isDrawerOpen)
      EventListener.emit(`quill:focus:${id}`)
  }

  const chat = useMemo(() => chatList[chatIndex], [chatList, chatIndex])

  useEffect(() => {
    document.addEventListener('keydown', onFocus)
    return () => document.removeEventListener('keydown', onFocus)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    const channel = supabase
      .channel(`is-typing:reply/${chat.id}`)
      .on('presence', { event: 'join' }, ({ currentPresences }) => {
        setTypingReplyList(currentPresences)
        timer = setTimeout(async () => await channel.untrack(), 5000)
      })
      .on('presence', { event: 'leave' }, ({ currentPresences }) =>
        setTypingReplyList(currentPresences)
      )
      .subscribe()
  }, [chatIndex, isOpen])

  useEffect(() => {
    get()
  }, [chatIndex])

  useEffect(() => {
    const timer = setInterval(() => {
      if (spamCount > 0) setState({ spamCount: 0 })
    }, 3000)
    return () => clearInterval(timer)
  }, [spamCount])

  useEffect(() => {
    if (!chat) return

    const channel = supabase
      .channel('containers/drawer/thread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        async (payload: any) => {
          if (payload.new.user_id === user?.id) return
          const { data, error } = await supabase
            .from('users')
            .select('id, nickname, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            captureException(error, user)
            return
          }
          setReplyList([
            ...replyList,
            { ...payload.new, user: data, reactions: [], saves: [] }
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          if (payload.new.user_id === user?.id) return
          const index = replyList.findIndex(
            (item) => item.id === payload.new.id
          )
          if (index === -1) return
          setReplyList([
            ...replyList.slice(0, index),
            {
              ...replyList[index],
              content: payload.new.content,
              updated_at: payload.new.updated_at,
              code_block: payload.new.code_block,
              language: payload.new.language
            },
            ...replyList.slice(index + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'replies',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          if (payload.old.user_id === user?.id) return
          const index = replyList.findIndex(
            (item) => item.id === payload.old.id
          )
          setReplyList([
            ...replyList.slice(0, index),
            ...replyList.slice(index + 1)
          ])
          setChatList([
            ...chatList.slice(0, chatIndex),
            {
              ...chat,
              replies: [
                ...chat.replies.slice(0, index),
                ...chat.replies.slice(index + 1)
              ]
            },
            ...chatList.slice(chatIndex + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reply_reactions',
          filter: `chat_id=eq.${chat.id}`
        },
        async (payload: any) => {
          if (payload.new.user_id === user?.id) return
          const index = replyList.findIndex(
            (item) => item.id === payload.new.reply_id
          )
          if (index === -1) return
          const { data, error } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', payload.new.user_id)
            .single()
          if (error) {
            captureException(error, user)
            return
          }

          const reactionIndex = replyList[index].reply_reactions.findIndex(
            (item) => item.text === payload.new.text
          )
          setReplyList([
            ...replyList.slice(0, index),
            {
              ...replyList[index],
              reply_reactions:
                reactionIndex === -1
                  ? [
                      ...replyList[index].reply_reactions,
                      {
                        ...payload.new,
                        userList: [
                          {
                            id: payload.new.user_id,
                            reactionId: payload.new.id,
                            nickname: data.nickname
                          }
                        ]
                      }
                    ]
                  : [
                      ...replyList[index].reply_reactions.slice(
                        0,
                        reactionIndex
                      ),
                      {
                        ...replyList[index].reply_reactions[reactionIndex],
                        userList: [
                          ...replyList[index].reply_reactions[reactionIndex]
                            .userList,
                          {
                            id: payload.new.user_id,
                            reactionId: payload.new.id,
                            nickname: data.nickname
                          }
                        ]
                      },
                      ...replyList[index].reply_reactions.slice(
                        reactionIndex + 1
                      )
                    ]
            },
            ...replyList.slice(index + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reply_reactions',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          if (payload.old.user_id === user?.id) return
          const index = replyList.findIndex(
            (item) => item.id === payload.old.reply_id
          )
          if (index === -1) return

          const reply = replyList[index]
          const reactionIndex = reply.reply_reactions.findIndex(
            (item) => item.text === payload.old.text
          )
          if (reactionIndex === -1) return

          setReplyList([
            ...replyList.slice(0, index),
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
                        ].userList.filter(
                          (item) => item.id !== payload.old.user_id
                        )
                      },
                      ...reply.reply_reactions.slice(reactionIndex + 1)
                    ]
                  : reply.reply_reactions.filter(
                      (item) => item.text !== payload.old.text
                    )
            },
            ...replyList.slice(index + 1)
          ])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'opengraphs',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload: any) => {
          const index = replyList.findIndex(
            (item) => item.id === payload.new.reply_id
          )
          if (index === -1) return

          setReplyList([
            ...replyList.slice(0, index),
            {
              ...replyList[index],
              opengraphs: [...replyList[index].opengraphs, payload.new]
            },
            ...replyList.slice(index + 1)
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).then()
    }
  }, [replyList, chat])
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={async () => {
          onClose()
          setReplyList([])
          const channel = supabase
            .getChannels()
            .find(
              (item) => item.topic === `realtime:is-typing:reply/${chat.id}`
            )
          if (channel) await supabase.removeChannel(channel)
        }}
        position="right"
      >
        <div>
          <ThreadDrawerChat
            onClose={onClose}
            replyLength={replyList.length}
            chatIndex={chatIndex}
          />
          {!!replyList.length && (
            <div className="relative m-4 border-t dark:border-neutral-700">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-white pr-2 text-xs text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                {replyList.length}개의 댓글
              </span>
            </div>
          )}
          <div>
            {replyList.map((_, key) => (
              <Message.Reply chatIndex={chatIndex} replyIndex={key} key={key} />
            ))}
          </div>
          <div className="px-4 pt-4 pb-16">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700">
              <div className="max-w-[515px] flex-1 md:max-w-[308px]">
                <Textarea
                  value={content}
                  onChange={(content) => setState({ content })}
                  placeholder="메시지 보내기"
                  onKeyDown={onKeyDown}
                  onEnter={onEnter}
                  id={id}
                  readOnly={isSubmitting}
                />
              </div>
              <button
                onClick={() => setState({ isCodeEditorOpen: true })}
                className="rounded-full border border-transparent p-1.5 text-neutral-500 hover:border-neutral-500 hover:bg-neutral-50"
              >
                <CodeBracketIcon className="h-5 w-5" />
              </button>
              <button
                className={classnames(
                  'rounded-full border border-transparent p-1.5 duration-150 hover:text-neutral-50',
                  { 'bg-blue-500': !!user && !!content }
                )}
                disabled={isSubmitting || !content}
                onClick={() => createReply()}
              >
                {isSubmitting ? (
                  <Spinner className="h-5 w-5 text-neutral-500" />
                ) : (
                  <ArrowSmallUpIcon
                    className={classnames(
                      'h-5 w-5',
                      !!user && !!content
                        ? 'text-neutral-50'
                        : 'text-neutral-500'
                    )}
                  />
                )}
              </button>
            </div>
            <div className="mt-2">
              <Typing source={`reply:${chat.id}`} chatId={chat.id} />
            </div>
          </div>
        </div>
      </Drawer>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
        content={content}
        onSubmit={createCodeReply}
        typingSource="reply"
        chatId={chat.id}
      />
    </>
  )
}

export default ThreadDrawer
