import { useId, useRef } from 'react'
import type { FC, ReactNode } from 'react'
import { useObjectState, useOnClickOutside } from 'services'
import classnames from 'classnames'
import type { Argument } from 'classnames'
import { createPortal } from 'react-dom'

export interface Props extends ReactProps {
  label: ReactNode
  className?: Argument
}
interface State {
  isOpen: boolean
}

const Dropdown: FC<Props> = ({ label, children, className }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  const id = useId()
  const ref = useRef<HTMLButtonElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setState({ isOpen: false }), id)
  return (
    <>
      <button
        id={id}
        ref={ref}
        className={classnames(className)}
        onClick={() => setState({ isOpen: !isOpen })}
      >
        {label}
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={targetRef}
            className="fixed z-[9999] rounded border bg-white p-2"
            style={{
              left:
                ref.current!.getBoundingClientRect().left -
                ref.current!.getBoundingClientRect().width,
              top:
                ref.current!.getBoundingClientRect().top +
                ref.current!.clientHeight
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

export default Dropdown
