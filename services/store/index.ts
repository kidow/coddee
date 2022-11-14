import { atom } from 'recoil'

export const userState = atom<NTable.Users | null>({
  key: 'userState',
  default: null
})

export const userListState = atom<
  Array<{ id: string; display: string; avatarUrl: string }>
>({
  key: 'userListState',
  default: []
})

export const themeState = atom<'light' | 'dark'>({
  key: 'themeState',
  default: 'light'
})

export const languageListState = atom<NTable.Languages[]>({
  key: 'languageListState',
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
  key: 'chatListState',
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
  key: 'replyListState',
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
  key: 'threadListState',
  default: []
})

export const presenceListState = atom<
  Array<{
    presence_ref: string
    [key: string]: string
  }>
>({
  key: 'presenceListState',
  default: []
})
