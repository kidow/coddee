import type { FC } from 'react'
import { Tooltip, Icon } from 'components'

export interface Props {
  onClick: () => void
}
interface State {}

const AddReactionTooltip: FC<Props> = ({ onClick }) => {
  return (
    <Tooltip
      content="반응 추가"
      size="sm"
      theme={window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
      border={window.localStorage.getItem('theme') !== 'dark'}
      className="hidden h-6 items-center justify-center rounded-xl border border-transparent bg-neutral-100 px-1.5 hover:border-neutral-500 hover:bg-white group-hover:inline-flex dark:bg-neutral-900"
    >
      <button onClick={onClick}>
        <Icon.AddReaction />
      </button>
    </Tooltip>
  )
}

export default AddReactionTooltip
