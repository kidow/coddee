import { CodeBracketIcon } from '@heroicons/react/24/outline'
import { memo } from 'react'
import type { FC } from 'react'

export interface Props {
  onClick: () => void
}
interface State {}

const MessageCodeButton: FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1.5 hover:border-neutral-600 dark:border-neutral-600 dark:bg-transparent dark:hover:border-neutral-500"
    >
      <CodeBracketIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
    </button>
  )
}

export default memo(MessageCodeButton, () => true)
