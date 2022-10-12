import { useEffect, useState, useCallback } from 'react'
import type { FC } from 'react'
import { Spinner } from 'components'
import { createPortal } from 'react-dom'
import { EventListener } from 'services'

const Backdrop: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const onBackdrop = useCallback(
    ({ detail }: any) => {
      setIsOpen(detail.open)
      if (detail.open) document.body.style.overflow = 'hidden'
      else document.body.removeAttribute('style')
    },
    [isOpen]
  )

  useEffect(() => {
    EventListener.add('backdrop', onBackdrop)
    return () => EventListener.remove('backdrop', onBackdrop)
  }, [])
  if (!isOpen) return null
  return createPortal(
    <div role="progressbar">
      <div className="fixed inset-0 cursor-progress bg-black opacity-30" />
      <span className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-progress">
        <Spinner className="h-10 w-10" />
      </span>
    </div>,
    document.body
  )
}

export default Backdrop
