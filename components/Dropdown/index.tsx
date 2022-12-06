import { useRef } from 'react'
import type { FC, ReactNode } from 'react'
import classnames from 'classnames'
import type { Argument } from 'classnames'

export interface Props {
  label: ReactNode
  children: ReactNode
  className?: Argument
}
interface State {}

const Dropdown: FC<Props> = ({ label, children, className }) => {
  const ref = useRef<HTMLUListElement>(null)
  return (
    <button
      className={classnames(
        'relative bottom-0 top-auto right-0 origin-top duration-200 ease-in-out [&>ul]:focus-within:visible [&>ul]:focus-within:opacity-100',
        className
      )}
      onClick={(e) => {
        const target = e.target as HTMLLIElement
        if (target?.parentElement?.tagName?.toUpperCase() === 'UL') {
          ref.current?.blur()
        }
      }}
    >
      <label tabIndex={0} className="cursor-pointer select-none">
        {label}
      </label>
      <ul
        tabIndex={0}
        ref={ref}
        className="invisible absolute bottom-auto top-6 right-0 z-50 w-40 origin-top rounded-lg border bg-white p-1 text-sm opacity-0 dark:border-black dark:bg-black"
      >
        {children}
      </ul>
    </button>
  )
}

export default Dropdown
