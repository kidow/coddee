import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useRecoilState } from 'recoil'
import {
  useUser,
  chatListState,
  toast,
  TOAST_MESSAGE,
  EventListener,
  captureException
} from 'services'
import * as cheerio from 'cheerio'

export default () => {
  const { query } = useRouter()
  const supabase = useSupabaseClient<Database>()
  const [user] = useUser()
  const [list, setList] = useRecoilState(chatListState)

  const onRegex = async (content: string, chatId: number, replyId?: number) => {
    if (typeof query.id !== 'string') return

    const $ = cheerio.load(content)
    const mentions = $('.mention')
    if (mentions.length > 0) {
      await Promise.all(
        Array.from({ length: mentions.length }, (v, i) =>
          supabase.from('mentions').insert({
            mention_to: mentions[i].attribs['data-id'],
            mention_from: user?.id || '',
            chat_id: chatId,
            ...(!!replyId ? { reply_id: replyId } : {})
          })
        )
      )
    }
    const anchors = $('a')
    if (anchors.length > 0) {
      const urls = Array.from(
        { length: anchors.length },
        (v, i) => anchors[i].attribs.href
      ).filter((link) => link.startsWith('http'))
      if (!!urls.length) {
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
          .forEach(
            async ({ data }) =>
              await supabase.from('opengraphs').insert({
                title: data.title || data['og:title'] || data['twitter:title'],
                description:
                  data.description ||
                  data['og:description'] ||
                  data['twitter:description'],
                image: data.image || data['og:image'] || data['twitter:image'],
                url: data.url || data['og:url'] || data['twitter:domain'],
                site_name: data['og:site_name'] || '',
                room_id: query.id as string,
                ...(!!replyId ? { reply_id: replyId } : { chat_id: chatId })
              })
          )
      }
    }
  }

  const onEmojiSelect = async (
    text: string,
    emoji: string,
    chatIndex: number
  ) => {
    if (typeof query.id !== 'string') return

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
          room_id: query.id,
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
          reactions:
            reactionIndex === -1
              ? [
                  ...chat.reactions,
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
                  ...chat.reactions.slice(0, reactionIndex),
                  {
                    ...reaction,
                    userList: [
                      ...reaction.userList,
                      {
                        id: user.id,
                        reactionId: data.id,
                        nickname: user.nickname
                      }
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
            room_id: query.id,
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
            reactions:
              reactionIndex === -1
                ? [
                    ...chat.reactions,
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
                    ...chat.reactions.slice(0, reactionIndex),
                    {
                      ...reaction,
                      userList: [
                        ...reaction.userList,
                        {
                          id: user.id,
                          reactionId: data.id,
                          nickname: user.nickname
                        }
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
          captureException(error, user)
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
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          text: reaction.text,
          room_id: chat.room_id,
          emoji: reaction.emoji
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
          reactions: [
            ...chat.reactions.slice(0, reactionIndex),
            {
              ...reaction,
              userList: [
                ...reaction.userList,
                { id: user.id, reactionId: data.id, nickname: user.nickname }
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
        .eq('id', reaction.userList[userIndex].reactionId)
      if (error) {
        captureException(error, user)
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
                    userList: [
                      ...reaction.userList.slice(0, userIndex),
                      ...reaction.userList.slice(userIndex + 1)
                    ]
                  },
                  ...chat.reactions.slice(reactionIndex + 1)
                ]
              : [
                  ...chat.reactions.slice(0, reactionIndex),
                  ...chat.reactions.slice(reactionIndex + 1)
                ]
        },
        ...list.slice(chatIndex + 1)
      ])
    }
  }

  return { onEmojiSelect, onReactionClick, onRegex }
}
