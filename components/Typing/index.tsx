import { memo, useMemo } from 'react'
import type { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { typingChatListState, typingReplyListState, useUser } from 'services'
import { useRouter } from 'next/router'

export interface Props {
  source: string
  chatId?: number
}
interface State {}

const Typing: FC<Props> = ({ source, chatId }) => {
  const typingChatList = useRecoilValue(typingChatListState)
  const typingReplyList = useRecoilValue(typingReplyListState)
  const { query } = useRouter()
  const [user] = useUser()

  const list = useMemo(() => {
    if (source === `chat:${query.id}`)
      return typingChatList.filter(
        ({ userId, roomId }) => userId !== user?.id && roomId === query.id
      )
    else if (source === `reply:${chatId}`) {
      return typingReplyList.filter(
        (item) => item.userId !== user?.id && Number(item.chatId) === chatId
      )
    } else return typingChatList.filter(({ userId }) => userId !== user?.id)
  }, [typingChatList, typingReplyList, source, query.id, user])
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

export default memo(Typing)
