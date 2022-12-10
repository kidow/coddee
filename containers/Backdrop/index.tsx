import { useEffect, useState, useCallback, memo } from 'react'
import type { FC } from 'react'
import { Spinner } from 'components'
import { createPortal } from 'react-dom'
import { EventListener } from 'services'

const Backdrop: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const onBackdrop = useCallback(
    ({ detail }: any) => setIsOpen(!!detail),
    [isOpen]
  )

  useEffect(() => {
    EventListener.add('backdrop', onBackdrop)
    return () => EventListener.remove('backdrop', onBackdrop)
  }, [])
  if (!isOpen) return null
  return createPortal(
    <div role="progressbar">
      <div className="fixed inset-0 z-[99999] cursor-progress bg-black/30" />
      <span className="fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2 cursor-progress">
        <Spinner className="h-16 w-16 stroke-neutral-400" />
      </span>
    </div>,
    document.body
  )
}

export default memo(Backdrop)
