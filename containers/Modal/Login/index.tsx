import type { FC } from 'react'
import { Modal } from 'containers'
import { supabase } from 'services'
import { useRouter } from 'next/router'

export interface Props extends ModalProps {}
interface State {}

const LoginModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const { asPath } = useRouter()

  const onLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_TO}${asPath}`,
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
          <button
            onClick={onLogin}
            className="flex items-center gap-2 rounded-full bg-black p-1.5"
          >
            <svg
              width="16px"
              height="16px"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              className="bi bi-github h-5 w-5"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </button>
        </div>
      }
    >
      <div>Coddee(커디)는 </div>
    </Modal>
  )
}

export default LoginModal
