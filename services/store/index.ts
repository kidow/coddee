import { atom } from 'recoil'

export const userState = atom<NTable.Users | null>({
  key:
    process.env.NODE_ENV === 'development'
      ? `userState:${Math.random().toString(36).slice(2)}`
      : 'userState',
  default: null
})

export const userListState = atom<
  Array<{ id: string; display: string; avatarUrl: string }>
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `userListState:${Math.random().toString(36)}`
      : 'userListState',
  default: []
})

export const themeState = atom<'light' | 'dark'>({
  key:
    process.env.NODE_ENV === 'development'
      ? `themeState:${Math.random().toString(36)}`
      : 'themeState',
  default: 'light'
})

export const languageListState = atom<NTable.Languages[]>({
  key:
    process.env.NODE_ENV === 'development'
      ? `languageListState:${Math.random().toString(36)}`
      : 'languageListState',
  default: []
})

export const chatListState = atom<
  Array<
    NTable.Chats & {
      user: Pick<NTable.Users, 'nickname' | 'avatar_url'>
      reactions: Array<
        Pick<
          NTable.Reactions,
          'id' | 'text' | 'emoji' | 'user_id' | 'userList'
        > & { user: Pick<NTable.Users, 'nickname'> }
      >
      replies: Array<
        Pick<NTable.Replies, 'id' | 'created_at'> & {
          user: Pick<NTable.Users, 'avatar_url'>
        }
      >
      opengraphs: Array<
        Pick<
          NTable.Opengraphs,
          'id' | 'title' | 'description' | 'site_name' | 'url' | 'image'
        >
      >
      saves: Array<Pick<NTable.Saves, 'id'>>
    }
  >
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `chatListState:${Math.random().toString(36)}`
      : 'chatListState',
  default: []
})

export const replyListState = atom<
  Array<
    NTable.Replies & {
      user: Pick<NTable.Users, 'id' | 'nickname' | 'avatar_url'>
      reply_reactions: Array<
        Pick<
          NTable.ReplyReactions,
          'id' | 'text' | 'emoji' | 'user_id' | 'userList'
        > & {
          user: Pick<NTable.Users, 'nickname'>
        }
      >
      opengraphs: Array<
        Pick<
          NTable.Opengraphs,
          'id' | 'title' | 'description' | 'site_name' | 'url' | 'image'
        >
      >
      saves: Array<Pick<NTable.Saves, 'id'>>
    }
  >
>({
  key:
    process.env.NODE_ENV === `development`
      ? `replyListState:${Math.random().toString(36)}`
      : 'replyListState',
  default: []
})

export const threadListState = atom<
  Array<
    NTable.Chats & {
      user: Pick<NTable.Users, 'id' | 'nickname' | 'avatar_url'>
      replies: Array<
        NTable.Replies & {
          user: Pick<NTable.Users, 'id' | 'avatar_url' | 'nickname'>
          reply_reactions: Array<
            Pick<
              NTable.ReplyReactions,
              'id' | 'text' | 'emoji' | 'user_id' | 'userList'
            > & { user: Pick<NTable.Users, 'nickname'> }
          >
          opengraphs: Array<
            Pick<
              NTable.Opengraphs,
              'id' | 'title' | 'description' | 'site_name' | 'url' | 'image'
            >
          >
          saves: Array<Pick<NTable.Saves, 'id'>>
        }
      >
      reactions: Array<
        Pick<
          NTable.Reactions,
          'id' | 'text' | 'emoji' | 'user_id' | 'userList'
        > & { user: Pick<NTable.Users, 'nickname'> }
      >
      room: Pick<NTable.Rooms, 'id' | 'name'>
      opengraphs: Array<
        Pick<
          NTable.Opengraphs,
          'id' | 'title' | 'description' | 'site_name' | 'url' | 'image'
        >
      >
      saves: Array<Pick<NTable.Saves, 'id'>>
    }
  >
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `threadListState:${Math.random().toString(36)}`
      : 'threadListState',
  default: []
})

export const presenceListState = atom<
  Array<{
    presence_ref: string
    [key: string]: string
  }>
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `presenceListState:${Math.random().toString(36)}`
      : 'presenceListState',
  default: []
})

export const typingChatListState = atom<
  Array<{
    presence_ref: string
    [key: string]: string
  }>
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `typingChatListState:${Math.random().toString(36)}`
      : 'typingChatListState',
  default: []
})

export const typingReplyListState = atom<
  Array<{
    presence_ref: string
    [key: string]: string
  }>
>({
  key:
    process.env.NODE_ENV === 'development'
      ? `typingReplyListState:${Math.random().toString(36)}`
      : 'typingReplyListState',
  default: []
})
