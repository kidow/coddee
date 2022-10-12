import type { FC } from 'react'
import { Modal } from 'containers'

export interface Props extends ModalProps {}
interface State {}

const CodeEditorModal: FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="코드 첨부">
      CodeEditorModal
    </Modal>
  )
}

export default CodeEditorModal
