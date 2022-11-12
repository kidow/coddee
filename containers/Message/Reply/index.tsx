import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import type { FC } from 'react'
import {
  backdrop,
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
  index: number
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const MessageReply: FC<Props> = ({ index }) => {
  const [{ isUpdateMode, isSubmitting, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isSubmitting: false,
      isCodeEditorOpen: false
    })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()
  const [list, setList] = useRecoilState(replyListState)
  const { onRegex } = useChatList()

  const updateReply = async (content?: string) => {
    if (isSubmitting) return

    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      setUser(null)
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
      .eq('id', list[index].id)
      .select('updated_at')
      .single()
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setList([
      ...list.slice(0, index),
      { ...list[index], content, updated_at: data.updated_at },
      ...list.slice(index + 1)
    ])
  }

  const deleteReply = async () => {
    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', list[index].id)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      EventListener.emit('tooltip:delete:error')
      return
    }
    EventListener.emit('tooltip:delete')
    setList([...list.slice(0, index), ...list.slice(index + 1)])
  }

  const updateReplyReaction = async (reactionIndex: number) => {
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

    const userIndex = list[index].reply_reactions[
      reactionIndex
    ].userList?.findIndex((item) => item.id === user.id)
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reply_reactions').insert({
        user_id: user.id,
        reply_id: list[index].id,
        text: list[index].reply_reactions[reactionIndex].text,
        chat_id: list[index].chat_id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
    } else {
      const { error } = await supabase
        .from('reply_reactions')
        .delete()
        .eq('id', list[index].reply_reactions[reactionIndex].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
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
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const reply = list[index]
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
      setList([
        ...list.slice(0, index),
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
                    ...reply.reply_reactions,
                    userList: [
                      ...reply.reply_reactions[reactionIndex].userList,
                      { id: user.id, nickname: user.nickname }
                    ]
                  },
                  ...reply.reply_reactions.slice(reactionIndex + 1)
                ]
        },
        ...list.slice(index + 1)
      ])
      EventListener.emit('modal:emoji')
    } else {
      const userIndex = reply.reply_reactions[index].userList.findIndex(
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

        setList([
          ...list.slice(0, index),
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
          ...list.slice(index + 1)
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
        setList([
          ...list.slice(0, index),
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
                    ...reply.reply_reactions.slice(index + 1)
                  ]
                : reply.reply_reactions.filter((item) => item.text !== text)
          },
          ...list.slice(index + 1)
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
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    if (!!list[index].saves?.length) {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', list[index].saves[0].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
      setList([
        ...list.slice(0, index),
        { ...list[index], saves: [] },
        ...list.slice(index + 1)
      ])
    } else {
      const { data, error } = await supabase
        .from('saves')
        .insert({ user_id: user.id, reply_id: list[index].id })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, index),
        { ...list[index], saves: [data] },
        ...list.slice(index + 1)
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
      .eq('id', list[index].id)
      .select('updated_at')
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    setState({ isCodeEditorOpen: false })
    setList([
      ...list.slice(0, index),
      {
        ...list[index],
        updated_at: data.updated_at,
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      },
      ...list.slice(index + 1)
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
        code_block: list[index].modified_code || list[index].code_block,
        language: list[index].modified_language || list[index].language,
        modified_code: payload.codeBlock,
        modified_language: payload.language
      })
      .select()
      .single()
    backdrop(false)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
    onRegex(payload.content, list[index].chat_id, list[index].id)
    EventListener.emit('message:codeblock')
    setList([
      ...list,
      {
        ...data,
        reply_reactions: [],
        saves: [],
        opengraphs: [],
        user: { nickname: user?.nickname, avatar_url: user?.avatar_url }
      }
    ])
  }
  return (
    <>
      <div
        className={classnames(
          'group relative flex items-start gap-3 py-2 pl-4 pr-6 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          { 'bg-red-50': !!list[index].saves?.length }
        )}
      >
        {!!list[index].saves?.length && (
          <span className="absolute top-2 right-3">
            <BookmarkIcon className="h-4 w-4 text-red-500" />
          </span>
        )}
        <Message.Avatar
          url={list[index].user.avatar_url}
          userId={list[index].user_id}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex cursor-pointer items-center text-sm font-medium">
              <span>{list[index].user?.nickname}</span>
              {list[index].user_id === user?.id && (
                <span className="ml-1 text-xs text-neutral-400">(나)</span>
              )}
            </span>
            <span className="text-xs text-neutral-400">
              {dayjs(list[index].created_at).locale('ko').fromNow()}
            </span>
          </div>
          <div>
            {isUpdateMode ? (
              <Message.Update
                content={list[index].content}
                onCancel={() => setState({ isUpdateMode: false })}
                onSave={updateReply}
              />
            ) : (
              <Message.Parser
                content={list[index].content}
                updatedAt={list[index].updated_at}
              />
            )}
          </div>
          <Message.CodeBlock
            originalCode={list[index].code_block}
            language={list[index].language}
            onSubmit={createModifiedCodeReply}
            mention={`@[${list[index].user.nickname}](${list[index].user_id})`}
            modifiedCode={list[index].modified_code}
            modifiedLanguage={list[index].modified_language}
          />
          {list[index].opengraphs?.map((item) => (
            <Message.Opengraph {...item} key={item.id} />
          ))}
          {!!list[index].reply_reactions?.length && (
            <Message.Reactions>
              {list[index].reply_reactions.map((item, key) => (
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
            isSaved={!!list[index].saves?.length}
          />
          {list[index].user_id === user?.id && (
            <>
              <Tooltip.Actions.Update
                onClick={() =>
                  setState({
                    isUpdateMode: !list[index].code_block,
                    isCodeEditorOpen: !!list[index].code_block
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
        content={list[index].content}
        codeBlock={list[index].code_block}
        language={list[index].language}
      />
    </>
  )
}

export default MessageReply
