import { useEffect } from 'react'
import type { FC } from 'react'
import { createPortal } from 'react-dom'
import { useObjectState } from 'services'
import classnames from 'classnames'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface Props {
  isOpen: boolean
  onClose: () => void
}
interface State {
  isDisplay: boolean
  isClosed: boolean
}

const Drawer: FC<Props> = ({ isOpen, onClose }) => {
  const [{ isDisplay, isClosed }, setState] = useObjectState<State>({
    isDisplay: isOpen,
    isClosed: false
  })

  useEffect(() => {
    setState({ isDisplay: isOpen })
  }, [isOpen])

  useEffect(() => {
    if (isClosed)
      setTimeout(() => {
        onClose()
        setState({ isClosed: false })
      }, 100)
  }, [isClosed])
  if (!isDisplay) return null
  return createPortal(
    <div
      role="dialog"
      tabIndex={-1}
      aria-labelledby="drawer-title"
      aria-modal="true"
    >
      <div
        className={classnames(
          'fixed inset-0 z-30 bg-black',
          isClosed ? 'opacity-0 transition-opacity' : 'opacity-50'
        )}
        onClick={() => setState({ isClosed: true })}
      />
      <div
        className={classnames(
          'fixed left-0 top-0 z-40 h-screen w-screen animate-fade-in-right divide-y overflow-auto bg-white md:w-80',
          { '-translate-x-full duration-100': isClosed }
        )}
      >
        <header className="flex h-12 items-center justify-between px-5">
          <Link href="/">
            <a onClick={() => setState({ isClosed: true })}>
              <img src="/coddee-black.svg" alt="" className="h-5" />
            </a>
          </Link>
          <button onClick={() => setState({ isClosed: true })}>
            <XMarkIcon className="h-6 w-6 text-neutral-700" />
          </button>
        </header>
        <menu>asd</menu>
      </div>
    </div>,
    document.body
  )
}

export default Drawer
