import type { FC } from 'react'

export interface Props extends ModalProps {}
interface State {}

const SearchModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return <>SearchModal</>
}

export default SearchModal
