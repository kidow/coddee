import { memo } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'

export interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
}

const Switch: FC<Props> = ({ checked, onChange, size = 'md' }) => {
  return (
    <label
      className={classnames('relative inline-block', {
        'h-4 w-7': size === 'sm',
        'h-6 w-10': size === 'md',
        'h-8 w-14': size === 'lg'
      })}
    >
      <input type="checkbox" checked={checked} className="h-0 w-0 opacity-0" />
      <span
        onClick={() => onChange(!checked)}
        className={classnames(
          'absolute inset-0 cursor-pointer transition duration-300 before:absolute before:rounded-full before:bg-white before:transition before:duration-300 before:content-[""]',
          checked ? 'bg-blue-600' : 'bg-neutral-200',
          {
            'rounded-lg before:left-1 before:bottom-1 before:h-2 before:w-2':
              size === 'sm',
            'before:translate-x-3': size === 'sm' && checked,
            'rounded-xl before:left-1 before:bottom-1 before:h-4 before:w-4':
              size === 'md',
            'before:translate-x-4': size === 'md' && checked,
            'rounded-2xl before:left-1.5 before:bottom-1 before:h-6 before:w-6':
              size === 'lg',
            'before:translate-x-5': size === 'lg' && checked
          }
        )}
      />
    </label>
  )
}

export default memo(Switch)
