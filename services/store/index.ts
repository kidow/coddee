import { atom } from 'recoil'

export const userState = atom<NTable.Users | null>({
  key: 'userState',
  default: null
})
