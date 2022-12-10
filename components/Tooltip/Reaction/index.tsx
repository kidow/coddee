import { memo, useMemo } from 'react'
import type { FC } from 'react'
import { Tooltip } from 'components'
import classnames from 'classnames'
import { useUser } from 'services'

export interface Props {
  userList: Array<{ id: string; reactionId: number; nickname: string }>
  onClick: () => void
  text: string
  emoji: string
  position?: 'left' | 'top' | 'right' | 'bottom'
}
interface State {}

const ReactionTooltip: FC<Props> = ({
  userList,
  onClick,
  text,
  emoji,
  position
}) => {
  const [user] = useUser()

  const isMine: boolean = useMemo(
    () => userList.findIndex((item) => item.id === user?.id) !== -1,
    [user, userList]
  )
  return (
    <Tooltip
      content={
        userList.length > 1
          ? `${userList?.at(0)?.nickname} 님 외 ${
              userList.length - 1
            }명이 반응하였습니다.`
          : `${userList?.at(0)?.nickname} 님이 반응하였습니다.`
      }
      position={position}
    >
      <button
        className={classnames(
          'inline-flex items-center gap-1 rounded-xl border px-1.5 pt-1 pb-0.5 active:scale-95 dark:border-transparent dark:bg-neutral-900',
          isMine
            ? 'border-blue-700 bg-blue-100 dark:border-blue-400'
            : 'border-neutral-400'
        )}
        onClick={onClick}
      >
        <span className={`bem bem-${text} ap ap-${text}`}>{emoji}</span>
        <span className="text-xs font-semibold text-blue-700 dark:text-neutral-400">
          {userList.length}
        </span>
      </button>
    </Tooltip>
  )
}

export default memo(ReactionTooltip)
