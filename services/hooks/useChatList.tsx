import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useRecoilState } from 'recoil'
import {
  useUser,
  chatListState,
  REGEXP,
  toast,
  TOAST_MESSAGE,
  EventListener
} from 'services'

export default () => {
  const { query } = useRouter()
  const supabase = useSupabaseClient()
  const [user, setUser] = useUser()
  const [list, setList] = useRecoilState(chatListState)

  const onRegex = async (content: string, chatId: number, replyId?: number) => {
    if (REGEXP.MENTION.test(content)) {
      const mentions = content
        .match(REGEXP.MENTION)
        ?.filter((id) => id !== user?.id)
      if (!mentions) return

      await Promise.all(
        mentions.map((id) =>
          supabase.from('mentions').insert({
            mention_to: id.slice(-37, -1),
            mention_from: user?.id,
            chat_id: chatId,
            ...(!!replyId ? { reply_id: replyId } : {})
          })
        )
      )
    }

    if (REGEXP.URL.test(content)) {
      const urls = content.match(REGEXP.URL)
      if (!urls) return

      const res = await Promise.all(
        urls.map((url) =>
          fetch('/api/opengraph', {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ url })
          })
        )
      )
      const json = await Promise.all(res.map((result) => result.json()))
      json
        .filter((item) => item.success)
        .forEach(({ data }) =>
          supabase.from('opengraphs').insert({
            title: data.title || data['og:title'] || data['twitter:title'],
            description:
              data.description ||
              data['og:description'] ||
              data['twitter:description'],
            image: data.image || data['og:image'] || data['twitter:image'],
            url: data.url || data['og:url'] || data['twitter:domain'],
            site_name: data['og:site_name'] || '',
            room_id: query.id,
            ...(!!replyId ? { reply_id: replyId } : { chat_id: chatId })
          })
        )
    }
  }

  const onEmojiSelect = async (text: string, chatIndex: number) => {
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

    const chat = list[chatIndex]
    const reactionIndex = chat.reactions.findIndex(
      (item: any) => item.text === text
    )
    const reaction = chat.reactions[reactionIndex]
    if (reactionIndex === -1) {
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          user_id: user.id,
          chat_id: chat.id,
          text,
          room_id: query.id
        })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }

      setList([
        ...list.slice(0, chatIndex),
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
        ...list.slice(chatIndex + 1)
      ])
      EventListener.emit('modal:emoji')
    } else {
      const userIndex = chat.reactions[reactionIndex].userList.findIndex(
        (item: any) => item.id === user.id
      )
      if (userIndex === -1) {
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            chat_id: chat.id,
            text,
            room_id: query.id
          })
          .select()
          .single()
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }

        setList([
          ...list.slice(0, chatIndex),
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
          ...list.slice(chatIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      } else {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', chat.reactions[reactionIndex].id)
        if (error) {
          console.error(error)
          toast.error(TOAST_MESSAGE.API_ERROR)
          return
        }
        setList([
          ...list.slice(0, chatIndex),
          {
            ...chat,
            reactions:
              reaction.userList.length > 1
                ? [
                    ...chat.reactions.slice(0, reactionIndex),
                    {
                      ...reaction,
                      userList: reaction.userList.filter(
                        (item: any) => item.id !== user?.id
                      )
                    },
                    ...chat.reactions.slice(reactionIndex + 1)
                  ]
                : chat.reactions.filter((item: any) => item.text !== text)
          },
          ...list.slice(chatIndex + 1)
        ])
        EventListener.emit('modal:emoji')
      }
    }
  }

  const onReactionClick = async (chat: any, reactionIndex: number) => {
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

    const chatIndex = list.findIndex((item) => item.id === chat.id)
    if (chatIndex === -1) return
    const reaction = chat.reactions[reactionIndex]
    const userIndex = reaction?.userList?.findIndex(
      (item: any) => item.id === user.id
    )
    if (userIndex === undefined) return

    if (userIndex === -1) {
      const { error } = await supabase.from('reactions').insert({
        chat_id: chat.id,
        user_id: user.id,
        text: reaction.text,
        room_id: chat.room_id
      })
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setList([
        ...list.slice(0, chatIndex),
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
        ...list.slice(chatIndex + 1)
      ])
    } else {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', reaction.id)
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }

      setList([
        ...list.slice(0, chatIndex),
        {
          ...chat,
          reactions: [
            ...chat.reactions.slice(0, reactionIndex),
            ...chat.reactions.slice(reactionIndex + 1)
          ]
        },
        ...list.slice(chatIndex + 1)
      ])
    }
  }

  return { onRegex, onEmojiSelect, onReactionClick }
}
