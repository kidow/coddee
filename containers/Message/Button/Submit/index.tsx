import { ArrowSmallUpIcon } from '@heroicons/react/24/outline'
import { Spinner } from 'components'
import { memo } from 'react'
import type { FC } from 'react'

export interface Props {
  onClick: () => void
  disabled: boolean
  loading?: boolean
}
interface State {}

const MessageSubmitButton: FC<Props> = ({ onClick, disabled, loading }) => {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 p-1.5 duration-150 hover:bg-blue-400 active:bg-blue-600 disabled:bg-neutral-400 dark:disabled:bg-neutral-600"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <Spinner className="h-5 w-5 stroke-neutral-50" />
      ) : (
        <ArrowSmallUpIcon className="h-5 w-5 text-neutral-50" />
      )}
    </button>
  )
}

export default memo(MessageSubmitButton)
