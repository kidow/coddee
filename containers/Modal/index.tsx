import { useEffect } from 'react'
import type { FC } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import classnames from 'classnames'
import { createPortal } from 'react-dom'

import CodeEditorModal from './CodeEditor'
import MyInfoModal from './MyInfo'
import ProfileModal from './Profile'
import LoginModal from './Login'
import SearchModal from './Search'
import EmojiModal from './Emoji'
import MentionModal from './Mention'
import ImageModal from './Image'

interface Props extends ReactProps, ModalProps {}
interface State {}

const Modal: FC<Props> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  title,
  description,
  padding = true,
  footer,
  error = false
}) => {
  if (!isOpen) return null

  const onEscape = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      onClose()
      window.removeEventListener('keydown', onEscape)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
    }
  }, [])
  return createPortal(
    <div
      className="fixed inset-0 z-30 overflow-y-auto"
      aria-labelledby="modal-title"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex min-h-screen items-center justify-center p-0 text-center md:block">
        <div
          className="fixed inset-0 bg-black opacity-30 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>
        <span
          className="hidden h-screen align-middle md:inline-block"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div
          className={classnames(
            'my-8 inline-block w-full transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all',
            error ? 'dark:bg-red-50' : 'dark:bg-neutral-800',
            maxWidth
          )}
        >
          <header
            className={classnames(
              'border-t-4',
              error ? 'border-red-600' : 'border-neutral-800 dark:border-black'
            )}
          >
            {!!title && (
              <div
                className={classnames(
                  'flex border-b border-neutral-200 p-4 dark:border-neutral-700',
                  !!description ? 'items-start' : 'items-center'
                )}
              >
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">{title}</h1>
                  {!!description && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <XMarkIcon className="h-5 w-5 text-neutral-800 dark:text-neutral-400" />
                </button>
              </div>
            )}
          </header>
          <div className={classnames({ 'py-6 px-7': padding })}>{children}</div>
          {footer && (
            <footer className="border-t py-4 px-7 dark:border-neutral-700">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Object.assign(Modal, {
  MyInfo: MyInfoModal,
  CodeEditor: CodeEditorModal,
  Profile: ProfileModal,
  Login: LoginModal,
  Search: SearchModal,
  Emoji: EmojiModal,
  Mention: MentionModal,
  Image: ImageModal
})
