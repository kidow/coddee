import { Tooltip } from 'components'
import {} from 'react'
import type { FC } from 'react'
import { FaceSmileIcon } from '@heroicons/react/24/solid'
import { useObjectState } from 'services'
import { Modal } from 'containers'

export interface Props {
  onSelect: (text: string, emoji: string) => void
  position?: 'top' | 'right' | 'bottom' | 'left'
}
interface State {
  isOpen: boolean
}

const AddReactionTooltipAction: FC<Props> = ({
  onSelect,
  position = 'top'
}) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      <Tooltip position={position} content="반응 추가">
        <button
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-600"
          onClick={() => setState({ isOpen: true })}
        >
          <FaceSmileIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
        </button>
      </Tooltip>
      <Modal.Emoji
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
        onSelect={onSelect}
      />
    </>
  )
}

export default AddReactionTooltipAction
