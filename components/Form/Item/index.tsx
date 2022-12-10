import type { FC } from 'react'
import classnames from 'classnames'

export interface Props extends ReactProps {
  label?: string
  required?: boolean
  Icon?: any
}
interface State {}

const FormItem: FC<Props> = ({ label, children, required, Icon }) => {
  return (
    <div className={classnames({ 'flex items-center gap-2': !!Icon })}>
      {!!Icon && <Icon className="h-5 w-5 text-neutral-500" />}
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
      <div className={classnames({ 'mt-1': !Icon })}>{children}</div>
    </div>
  )
}

export default FormItem
