import { useEffect } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import type { Argument } from 'classnames'

import ThreadDrawer from './Thread'
import { useObjectState } from 'services'
import { createPortal } from 'react-dom'

export interface Props extends DrawerProps, ReactProps {
  className?: Argument
}
interface State {
  isClosed: boolean
}

const Drawer: FC<Props> = ({
  isOpen,
  onClose,
  position = 'left',
  children,
  className
}) => {
  const [{ isClosed }, setState] = useObjectState<State>({ isClosed: false })

  const onEscape = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      setState({ isClosed: true })
      window.removeEventListener('keydown', onEscape)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (isClosed) setTimeout(() => onClose(), 190)
  }, [isClosed])
  return createPortal(
    <div
      role="dialog"
      tabIndex={-1}
      aria-labelledby="drawer-title"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 z-20 bg-black opacity-50 duration-200"
        onClick={() => setState({ isClosed: true })}
      />
      <div
        className={classnames(
          'fixed z-30 w-5/6 overflow-auto overscroll-contain bg-white duration-200 dark:bg-neutral-800',
          {
            'left-0 top-0 h-screen': position === 'left',
            'right-0 top-0 h-screen': position === 'right',
            'top-0 left-0 w-screen': position === 'top',
            'bottom-0 left-0 w-screen': position === 'bottom',
            'animate-fade-in-left': position === 'right' && isOpen,
            'animate-fade-in-right': position === 'left' && isOpen,
            'animate-fade-in-bottom': position === 'top' && isOpen,
            'animate-fade-in-top': position === 'bottom' && isOpen,
            'animate-fade-out-right': position === 'right' && isClosed,
            'md:w-96':
              !className && (position === 'left' || position === 'right'),
            'md:h-96':
              !className && (position === 'top' || position === 'bottom')
          },
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Object.assign(Drawer, { Thread: ThreadDrawer })
