import classnames from 'classnames'
import { Spinner } from 'components'
import type { FC, DetailedHTMLProps, ButtonHTMLAttributes } from 'react'

export interface Props
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  loading?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  theme?: 'danger' | 'primary' | 'success'
  shape?: 'text' | 'contained' | 'outlined'
  icon?: any
}

const Button: FC<Props> = ({
  loading = false,
  size = 'md',
  theme,
  children,
  disabled,
  className,
  shape = 'contained',
  icon,
  ...props
}) => {
  const Icon = loading ? Spinner : icon ? icon : null
  return (
    <button
      {...props}
      className={classnames(
        'border font-medium leading-6 transition duration-150 ease-in-out disabled:cursor-not-allowed',
        size === 'xs' ? 'gap-1.5 rounded py-px px-2 text-xs' : 'rounded-md',
        shape === 'outlined' ? 'group bg-white' : 'border-transparent',
        {
          'inline-flex items-center justify-center': loading || icon,
          'hover:brightness-105 active:brightness-90': !loading && !disabled,
          'gap-2 py-1 px-3 text-sm': size === 'sm',
          'gap-3 py-2 px-4 text-base': size === 'md',
          'gap-3 py-3 px-5 text-lg': size === 'lg',
          'bg-neutral-900 text-white': !theme && shape === 'contained',
          'bg-red-600 text-white': theme === 'danger' && shape === 'contained',
          'bg-blue-500 text-white':
            theme === 'primary' && shape === 'contained',
          'bg-emerald-500 text-white':
            theme === 'success' && shape === 'contained',
          'disabled:bg-neutral-300 disabled:text-white':
            shape === 'contained' && (loading || disabled),
          'bg-transparent disabled:hover:bg-neutral-200 disabled:hover:text-white':
            shape === 'text',
          'hover:bg-neutral-200': !theme && shape === 'text',
          'text-red-600 hover:bg-red-100':
            theme === 'danger' && shape === 'text',
          'text-blue-500 hover:bg-blue-100':
            theme === 'primary' && shape === 'text',
          'text-emerald-500 hover:bg-emerald-100':
            theme === 'success' && shape === 'text',
          'hover:text-white': shape === 'outlined',
          'border-neutral-500 text-neutral-500 hover:bg-neutral-900':
            !theme && shape === 'outlined',
          'border-blue-500 text-blue-500 hover:bg-blue-500':
            theme === 'primary' && shape === 'outlined',
          'border-red-500 text-red-500 hover:bg-red-500':
            theme === 'danger' && shape === 'outlined',
          'border-emerald-500 text-emerald-500 hover:bg-emerald-500':
            theme === 'success' && shape === 'outlined',
          'cursor-progress': loading
        },
        className
      )}
      disabled={loading || disabled}
    >
      {Icon && (
        <Icon
          className={classnames({
            'h-3 w-3': size === 'xs',
            'h-4 w-4': size === 'sm',
            'h-5 w-5': size === 'md',
            'h-6 w-6': size === 'lg',
            'text-white': shape === 'contained',
            'group-hover:text-white': shape === 'outlined',
            'text-neutral-900':
              (shape !== 'contained' && !theme) || shape === 'text',
            'text-blue-500': shape !== 'contained' && theme === 'primary',
            'text-red-500': shape !== 'contained' && theme === 'danger',
            'text-emerald-500': shape !== 'contained' && theme === 'success'
          })}
        />
      )}
      {children}
    </button>
  )
}

export default Button
