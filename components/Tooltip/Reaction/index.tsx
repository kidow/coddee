import { useMemo } from 'react'
import type { FC } from 'react'
import { Tooltip } from 'components'
import classnames from 'classnames'
import { useUser } from 'services'

export interface Props {
  userList: Array<{ id: string; nickname: string }>
  onClick: () => void
  text: string
  length: number
}
interface State {}

const ReactionTooltip: FC<Props> = ({ userList, onClick, text, length }) => {
  const [user] = useUser()

  const isMine: boolean = useMemo(
    () => userList.findIndex((item) => item.id === user?.id) !== -1,
    [user, userList]
  )
  return (
    <Tooltip
      content={
        userList.length > 1
          ? `${userList[0].nickname} 님 외 ${
              userList.length - 1
            }명이 반응하였습니다.`
          : `${userList[0].nickname} 님이 반응하였습니다.`
      }
    >
      <button
        className={classnames(
          'inline-flex h-6 items-center gap-1 rounded-xl border px-1.5 active:scale-95 dark:border-transparent dark:bg-neutral-900',
          isMine
            ? 'border-blue-700 bg-blue-100 dark:border-blue-400'
            : 'border-neutral-400'
        )}
        onClick={onClick}
      >
        <span>{text}</span>
        <span className="text-xs font-semibold text-blue-700 dark:text-neutral-400">
          {length}
        </span>
      </button>
    </Tooltip>
  )
}

export default ReactionTooltip
