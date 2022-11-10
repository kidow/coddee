import { XMarkIcon } from '@heroicons/react/24/outline'
import { TrashIcon } from '@heroicons/react/24/solid'
import { Tooltip, Button } from 'components'
import { Modal } from 'containers'
import type { FC } from 'react'
import { useObjectState } from 'services'

export interface Props {
  onClick: () => void
}
interface State {
  isOpen: boolean
}

const DeleteTooltipAction: FC<Props> = ({ onClick }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      <Tooltip
        content="삭제"
        size="sm"
        className="group/tooltip flex h-7 w-7 items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-600"
      >
        <button onClick={() => setState({ isOpen: true })}>
          <TrashIcon className="h-4 w-4 text-neutral-600 group-hover/tooltip:text-red-500 dark:text-neutral-400" />
        </button>
      </Tooltip>
      <Modal
        padding={false}
        maxWidth="max-w-sm"
        error
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
      >
        <div className="py-4 px-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-neutral-800">
              메시지 삭제
            </span>
            <button onClick={() => setState({ isOpen: false })}>
              <XMarkIcon className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>
        <p className="px-6 text-sm text-neutral-500">
          메시지를 삭제하시겠습니까? 이 행동은 되돌릴 수 없습니다.
        </p>
        <div className="flex items-center justify-end gap-3 py-5 px-6">
          <Button
            size="sm"
            shape="outlined"
            onClick={() => setState({ isOpen: false })}
          >
            취소
          </Button>
          <Button
            size="sm"
            theme="danger"
            onClick={() => {
              onClick()
              setState({ isOpen: false })
            }}
          >
            삭제
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default DeleteTooltipAction
