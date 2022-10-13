import type { FC } from 'react'
import { Modal } from 'containers'
import { supabase } from 'services'

export interface Props extends ModalProps {}
interface State {}

const LoginModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const onLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_REDIRECT_TO,
        scopes: 'user'
      }
    })
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="환영합니다 🎉"
      footer={
        <div className="flex items-center justify-center gap-2">
          <button className="flex items-center gap-2 rounded bg-black py-1 px-2 text-sm text-neutral-200">
            깃허브로 시작
          </button>
        </div>
      }
    >
      <div>Coddee(커디)는 </div>
    </Modal>
  )
}

export default LoginModal
