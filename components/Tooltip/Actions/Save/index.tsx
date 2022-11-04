import { BookmarkIcon } from '@heroicons/react/24/solid'
import { Tooltip } from 'components'
import type { FC } from 'react'
import classnames from 'classnames'

export interface Props {
  onClick: () => void
  isSaved: boolean
}
interface State {}

const SaveTooltipAction: FC<Props> = ({ onClick, isSaved }) => {
  return (
    <Tooltip
      content={isSaved ? '저장 취소' : '저장'}
      size="sm"
      theme={window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
      border={window.localStorage.getItem('theme') !== 'dark'}
      className="flex h-7 w-7 items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-600"
    >
      <button onClick={onClick}>
        <BookmarkIcon
          className={classnames(
            'h-4 w-4 dark:text-neutral-400',
            isSaved ? 'text-red-500' : 'text-neutral-600'
          )}
        />
      </button>
    </Tooltip>
  )
}

export default SaveTooltipAction
