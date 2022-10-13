import { useEffect } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import { supabase } from 'services'

export interface Props extends ModalProps {
  userId: string
}
interface State {}

const ProfileModal: FC<Props> = ({ isOpen, onClose, userId }) => {
  if (!isOpen) return null

  const get = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    console.log('data', data)
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      ProfileModal
    </Modal>
  )
}

export default ProfileModal
