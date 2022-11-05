import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tooltip } from 'components'
import { Message, Modal } from 'containers'
import dayjs from 'dayjs'
import type { FC } from 'react'
import {
  backdrop,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import classnames from 'classnames'

export interface Props {
  reply: NTable.Replies & {
    user: NTable.Users
    reply_reactions: NTable.ReplyReactions[]
    opengraphs: NTable.Opengraphs[]
    saves: NTable.Saves[]
  }
  onSave: (data?: NTable.Saves) => void
}
interface State {
  isUpdateMode: boolean
  isSubmitting: boolean
  isCodeEditorOpen: boolean
}

const MessageReply: FC<Props> = ({ reply, onSave }) => {
  const [{ isUpdateMode, isSubmitting, isCodeEditorOpen }, setState] =
    useObjectState<State>({
      isUpdateMode: false,
      isSubmitting: false,
      isCodeEditorOpen: false
    })
  const [user, setUser] = useUser()
  const supabase = useSupabaseClient()

  const updateReply = async (content?: string) => {
    if (isSubmitting) return

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
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
    const { error } = await supabase
      .from('replies')
      .update({ content })
      .eq('id', reply.id)
    setState({ isSubmitting: false, isUpdateMode: false })
    if (error) {
      toast.error(TOAST_MESSAGE.API_ERROR)
      return
    }
  }

  const deleteReply = async () => {
    const { error } = await supabase.from('replies').delete().eq('id', reply.id)
    if (error) {
      console.error(error)
      toast.error(TOAST_MESSAGE.API_ERROR)
    }
  }

  const updateReaction = async (index: number) => {
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

    const userIndex = reply.reply_reactions[index].userList?.findIndex(
      (item) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reply_reactions').insert({
        user_id: user.id,
        reply_id: reply.id,
        text: reply.reply_reactions[index].text,
        chat_id: reply.chat_id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const { error } = await supabase.from('reply_reactions').delete().match({
        user_id: user.id,
        reply_id: reply.id,
        text: reply.reply_reactions[index].text,
        chat_id: reply.chat_id
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

    const { data } = await supabase.auth.getUser()
    if (!!user && !data.user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      return
    }

    const index = reply.reply_reactions.findIndex((item) => item.text === text)
    if (index === -1) {
      const { error } = await supabase.from('reply_reactions').insert({
        user_id: user.id,
        reply_id: reply.id,
        text,
        chat_id: reply.chat_id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
    } else {
      const userIndex = reply.reply_reactions[index].userList.findIndex(
        (item) => item.id === user.id
      )
      if (userIndex === -1) {
        const { error } = await supabase.from('reply_reactions').insert({
          user_id: user.id,
          reply_id: reply.id,
          text,
          chat_id: reply.chat_id
        })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      } else {
        const { error } = await supabase
          .from('reply_reactions')
          .delete()
          .match({
            user_id: user.id,
            reply_id: reply.id,
            text,
            chat_id: reply.chat_id
          })
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
        }
      }
    }
  }

  const onSaveReply = async () => {
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

    if (!!reply.saves?.length) {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', reply.saves[0].id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
      }
      onSave()
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
      onSave(data)
    }
  }

  const updateCodeReply = async (payload: {
    content: string
    codeBlock: string
    language: string
  }) => {
    const { error } = await supabase
      .from('replies')
      .update({
        content: payload.content,
        code_block: payload.codeBlock,
        language: payload.language
      })
      .eq('id', reply.id)
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
      <div
        className={classnames(
          'group relative flex items-start gap-3 py-2 pl-4 pr-6 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          { 'bg-red-50': !!reply.saves?.length }
        )}
      >
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
                  onClick={() => updateReaction(key)}
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
      />
    </>
  )
}

export default MessageReply
