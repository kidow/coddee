import type { FC } from 'react'

import MyInfoRoomList from './RoomList'
import MyInfoLanguageList from './LanguageList'
import MyInfoSetting from './Setting'

export interface Props {}
interface State {}

const MyInfo: FC<Props> = () => <></>

export default Object.assign(MyInfo, {
  RoomList: MyInfoRoomList,
  LanguageList: MyInfoLanguageList,
  Setting: MyInfoSetting
})
