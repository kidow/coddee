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
      user: {
        nickname: string
        avatar_url: string
      }
      reactions: Array<{
        id: number
        text: string
        emoji: string
        user_id: string
        user: { nickname: string }
        userList: Array<{ id: string; nickname: string }>
      }>
      replies: Array<{
        id: string
        created_at: string
        user: { avatar_url: string }
      }>
      opengraphs: Array<{
        id: number
        title: string
        description: string
        site_name: string
        url: string
        image: string
      }>
      saves: Array<{ id: number }>
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
      user: NTable.Users
      reply_reactions: NTable.ReplyReactions[]
      opengraphs: NTable.Opengraphs[]
      saves: NTable.Saves[]
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
      user: NTable.Users
      replies: Array<
        NTable.Replies & {
          user: NTable.Users
          reply_reactions: NTable.ReplyReactions[]
          opengraphs: NTable.Opengraphs[]
          saves: NTable.Saves[]
        }
      >
      reactions: Array<NTable.Reactions & { user: NTable.Users }>
      room: NTable.Rooms
      opengraphs: NTable.Opengraphs[]
      saves: NTable.Saves[]
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
