import type { FC } from 'react'
import { Tooltip, Icon } from 'components'
import { useObjectState } from 'services'
import { Modal } from 'containers'

export interface Props {
  onSelect: (text: string) => void
}
interface State {
  isOpen: boolean
}

const AddReactionTooltip: FC<Props> = ({ onSelect }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      <Tooltip content="반응 추가" className="h-6">
        <button
          className="hidden h-6 items-center justify-center rounded-xl border border-transparent bg-neutral-100 px-1.5 hover:border-neutral-500 hover:bg-white group-hover:inline-flex dark:bg-neutral-900"
          onClick={() => setState({ isOpen: true })}
        >
          <Icon.AddReaction />
        </button>
      </Tooltip>
      <Modal.Emoji
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
        onSelect={(text) => {
          onSelect(text)
          setState({ isOpen: false })
        }}
      />
    </>
  )
}

export default AddReactionTooltip
