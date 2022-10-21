import type { FC } from 'react'
import { Modal } from 'containers'

export interface Props extends ModalProps {}
interface State {}

const ThreadModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      ThreadModal
    </Modal>
  )
}

export default ThreadModal
