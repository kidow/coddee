import type { FC } from 'react'
import { Modal } from 'containers'

export interface Props extends ModalProps {}
interface State {}

const MentionModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="맨션할 대상 찾기">
      MentionModal
    </Modal>
  )
}

export default MentionModal
