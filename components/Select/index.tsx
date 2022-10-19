import { ChevronDownIcon } from '@heroicons/react/24/solid'
import classnames from 'classnames'
import type {
  FC,
  DetailedHTMLProps,
  SelectHTMLAttributes,
  ReactNode
} from 'react'

export interface Props
  extends Omit<
    DetailedHTMLProps<
      SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >,
    'size'
  > {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  error?: ReactNode
}

const Select: FC<Props> = ({
  size = 'md',
  className,
  children,
  error,
  ...props
}) => {
  return (
    <>
      <div className={classnames('relative', className)}>
        <select
          {...props}
          className={classnames(
            'w-full cursor-pointer select-none appearance-none rounded border bg-white pr-8 disabled:cursor-not-allowed disabled:bg-neutral-200 dark:border-neutral-700 dark:bg-black',
            !!error ? 'border-red-500' : 'border-neutral-300',
            !!props.value ? 'text-neutral-800' : 'text-neutral-400',
            {
              'py-1 pl-2 text-xs': size === 'xs',
              'py-2 pl-3 text-sm': size === 'sm',
              'py-2 pl-3 text-base': size === 'md',
              'py-2 pl-3 text-lg': size === 'lg'
            }
          )}
        >
          {children}
        </select>
        <ChevronDownIcon
          className={classnames(
            'absolute right-2 z-[5] h-5 w-5 text-neutral-400',
            {
              'top-1': size === 'xs',
              'top-2': size === 'sm',
              'top-3': size === 'md' || size === 'lg'
            }
          )}
        />
      </div>
      {!!error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </>
  )
}

export default Select
