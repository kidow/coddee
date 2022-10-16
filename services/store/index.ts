import { atom } from 'recoil'

export const userState = atom<NTable.Users | null>({
  key: 'userState',
  default: null
})

export const roomState = atom<
  Array<
    NTable.Rooms & {
      chats: Array<NTable.Chats & { user: NTable.Users }>
      chatTotal: number
      newCount: number
      recentMessage: string
    }
  >
>({
  key: 'roomState',
  default: []
})
