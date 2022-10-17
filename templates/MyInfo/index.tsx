import { useMemo } from 'react'
import type { FC } from 'react'
import { useObjectState, useUser } from 'services'
import classnames from 'classnames'

import MyInfoRoomList from './RoomList'
import MyInfoLanguageList from './LanguageList'

export interface Props {}
interface State {
  tab: number
}

const MyInfo: FC<Props> = () => {
  const [{ tab }, setState] = useObjectState<State>({ tab: 0 })

  const [user] = useUser()
  const PROFILE_TABS: string[] = useMemo(
    () => [
      '내 정보',
      '탈퇴',
      ...(user?.email === process.env.NEXT_PUBLIC_ADMIN_ID
        ? ['채팅방', '언어']
        : [])
    ],
    [user]
  )
  return (
    <div className="flex divide-x divide-neutral-200">
      <menu className="w-48 bg-neutral-100">
        <ul>
          {PROFILE_TABS.map((item, key) => (
            <li
              key={key}
              className={classnames('cursor-pointer py-3 px-5', {
                'bg-neutral-200 font-semibold': tab === key
              })}
              onClick={() => setState({ tab: key })}
            >
              {item}
            </li>
          ))}
        </ul>
      </menu>
      <section className="h-[40rem] flex-1 overflow-auto p-6"></section>
    </div>
  )
}

export default Object.assign(MyInfo, {
  RoomList: MyInfoRoomList,
  LanguageList: MyInfoLanguageList
})
