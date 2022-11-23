import type { FC } from 'react'
import { Tooltip, Icon } from 'components'
import { useObjectState } from 'services'
import { Modal } from 'containers'

export interface Props {
  onSelect: (text: string, emoji: string) => void
}
interface State {
  isOpen: boolean
}

const AddReactionTooltip: FC<Props> = ({ onSelect }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      <Tooltip content="반응 추가" className="h-6 rounded-xl">
        <button
          className="h-6 items-center justify-center rounded-xl border border-transparent bg-neutral-100 px-1.5 opacity-0 delay-75 duration-200 ease-in-out group-hover:inline-flex group-hover:border-neutral-500 group-hover:bg-white group-hover:opacity-100 dark:bg-neutral-900"
          onClick={() => setState({ isOpen: true })}
        >
          <Icon.AddReaction />
        </button>
      </Tooltip>
      <Modal.Emoji
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
        onSelect={(text, emoji) => {
          onSelect(text, emoji)
          setState({ isOpen: false })
        }}
      />
    </>
  )
}

export default AddReactionTooltip
