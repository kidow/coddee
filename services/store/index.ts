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
