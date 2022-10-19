import type { FC } from 'react'
import classnames from 'classnames'

export interface Props extends ReactProps {
  label?: string
  required?: boolean
}
interface State {}

const FormItem: FC<Props> = ({ label, children, required }) => {
  return (
    <div>
      {!!label && (
        <span
          className={classnames(
            'cursor-pointer text-xs font-semibold text-slate-600 dark:text-neutral-400',
            { 'after:text-red-500 after:content-["*"]': required }
          )}
        >
          {label}
        </span>
      )}
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default FormItem
