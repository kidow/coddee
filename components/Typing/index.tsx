import { useMemo } from 'react'
import type { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { typingListState, useUser } from 'services'
import { useRouter } from 'next/router'

export interface Props {
  source: string
}
interface State {}

const Typing: FC<Props> = ({ source }) => {
  const typingList = useRecoilValue(typingListState)
  const { query } = useRouter()
  const [user] = useUser()

  const list = useMemo(() => {
    switch (source) {
      case `room/${query.id}`:
        return typingList.filter(
          ({ userId, roomId }) => userId !== user?.id && roomId === query.id
        )
      default:
        return typingList.filter(({ userId }) => userId !== user?.id)
    }
  }, [typingList, source, query.id, user])
  if (!list.length) return null
  return (
    <div className="text-xs text-neutral-600 dark:text-neutral-400">
      <span>
        {list.length > 1 ? (
          <span className="font-bold">
            {list[0].nickname} 님 외 {list.length - 1}명이
          </span>
        ) : (
          list.length === 1 && (
            <span>
              <span className="font-bold">{list[0].nickname}</span> 님이
            </span>
          )
        )}
      </span>
      <span className="ml-1">입력 중입니다...</span>
    </div>
  )
}

export default Typing
