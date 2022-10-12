import type { FC } from 'react'
import { Modal } from 'containers'

export interface Props extends ModalProps {}
interface State {}

const ProfileModal: FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal
      maxWidth="max-w-5xl"
      isOpen={isOpen}
      onClose={onClose}
      padding={false}
    >
      ProfileModal
    </Modal>
  )
}

export default ProfileModal
