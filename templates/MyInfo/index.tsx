import type { FC } from 'react'

import MyInfoRoomList from './RoomList'
import MyInfoLanguageList from './LanguageList'

export interface Props {}
interface State {}

const MyInfo: FC<Props> = () => {
  return <></>
}

export default Object.assign(MyInfo, {
  RoomList: MyInfoRoomList,
  LanguageList: MyInfoLanguageList
})
