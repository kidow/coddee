import type { FC } from 'react'
import { Tooltip } from 'components'

export interface Props {
  content: string
  onClick: () => void
  text: string
  length: number
}
interface State {}

const ReactionTooltip: FC<Props> = ({ content, onClick, text, length }) => {
  return (
    <Tooltip
      content={content}
      size="sm"
      theme={window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
      border={window.localStorage.getItem('theme') !== 'dark'}
      className="inline-flex h-6 items-center gap-1 rounded-xl border border-blue-700 bg-blue-100 px-1.5 dark:border-transparent dark:bg-neutral-900"
    >
      <button onClick={onClick}>
        <span>{text}</span>
        <span className="text-xs font-semibold text-blue-700 dark:text-neutral-400">
          {length}
        </span>
      </button>
    </Tooltip>
  )
}

export default ReactionTooltip
