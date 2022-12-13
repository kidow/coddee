import { memo, useMemo } from 'react'
import type { FC } from 'react'
import dayjs from 'dayjs'
import { useRecoilValue } from 'recoil'
import { chatListState } from 'services'

export interface Props {
  chatIndex: number
}
interface State {}

const MessageDivider: FC<Props> = ({ chatIndex }) => {
  const chatList = useRecoilValue(chatListState)

  const chat = useMemo(() => chatList[chatIndex], [chatIndex, chatList])
  return !!dayjs(dayjs(chat.created_at).format('YYYY-MM-DD')).diff(
    dayjs(chatList[chatIndex - 1]?.created_at).format('YYYY-MM-DD'),
    'day'
  ) || chatIndex === 0 ? (
    <div className="relative z-[9] mx-5 flex items-center justify-center py-5 text-xs before:absolute before:h-px before:w-full before:bg-neutral-200 dark:before:bg-neutral-700">
      <div className="absolute bottom-1/2 left-1/2 z-10 translate-y-[calc(50%-1px)] -translate-x-[46px] select-none bg-white px-5 text-neutral-400 dark:bg-neutral-800">
        {dayjs(chat.created_at).format('MM월 DD일')}
      </div>
    </div>
  ) : null
}

export default memo(MessageDivider)
