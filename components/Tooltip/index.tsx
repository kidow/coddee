import { memo } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import type { Argument } from 'classnames'

import AddReactionTooltip from './AddReaction'
import ReactionTooltip from './Reaction'
import TooltipActions from './Actions'

export interface Props extends ReactProps, TooltipProps {
  content: string
  arrow?: boolean
  className?: Argument
}

const Tooltip: FC<Props> = ({
  children,
  content,
  position = 'top',
  arrow = true,
  className
}) => {
  return (
    <div
      className={classnames(
        'relative inline-block text-center before:pointer-events-none before:absolute before:z-[9999] before:w-max before:max-w-xs before:rounded before:bg-neutral-800 before:px-2 before:py-1 before:text-xs before:text-neutral-50 before:opacity-0 before:delay-100 before:duration-200 before:ease-in-out before:content-[attr(data-tip)] hover:before:opacity-100 hover:before:delay-75 dark:before:bg-black',
        {
          "after:absolute after:z-[9999] after:block after:h-0 after:w-0 after:border-[3px] after:border-transparent after:opacity-0 after:delay-100 after:duration-200 after:ease-in-out after:content-[''] hover:after:opacity-100 hover:after:delay-75":
            arrow,

          'before:top-auto before:bottom-[calc(100%+4px)]': position === 'top',
          'before:left-[calc(100%+5px)]': position === 'right',
          'before:top-[calc(100%+4px)]': position === 'bottom',
          'before:left-auto before:right-[calc(100%+5px)]': position === 'left',

          'before:left-1/2 before:-translate-x-1/2':
            position === 'top' || position === 'bottom',
          'before:right-auto': position !== 'left',
          'before:top-1/2 before:-translate-y-1/2':
            position === 'right' || position === 'left',
          'before:bottom-auto': position !== 'top',

          'after:top-auto after:bottom-[calc(100%-2px)] after:border-t-neutral-800 dark:after:border-t-black':
            position === 'top' && arrow,
          'after:left-[calc(100%-1px)] after:border-r-neutral-800 dark:after:border-r-black':
            position === 'right' && arrow,
          'after:top-[calc(100%-2px)] after:border-b-neutral-800 dark:after:border-b-black':
            position === 'bottom' && arrow,
          'after:left-auto after:right-[calc(100%-1px)] after:border-l-neutral-800 dark:after:border-l-black':
            position === 'left' && arrow,

          'after:left-1/2 after:-translate-x-1/2':
            (position === 'top' || position === 'bottom') && arrow,
          'after:right-auto': position !== 'left' && arrow,
          'after:top-1/2 after:-translate-y-1/2':
            (position === 'right' || position === 'left') && arrow,
          'after:bottom-auto': position !== 'top' && arrow
        },
        className
      )}
      data-tip={content}
      role="tooltip"
    >
      {children}
    </div>
  )
}

export default Object.assign(memo(Tooltip), {
  AddReaction: AddReactionTooltip,
  Reaction: ReactionTooltip,
  Actions: TooltipActions
})
