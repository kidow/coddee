import { Children, cloneElement, useRef, useEffect, useMemo } from 'react'
import type { ReactElement, MouseEvent, ReactNode, FC } from 'react'
import classnames from 'classnames'
import type { Argument } from 'classnames'
import { useObjectState, useTheme } from 'services'
import { createPortal } from 'react-dom'

import AddReactionTooltip from './AddReaction'
import ReactionTooltip from './Reaction'
import TooltipActions from './Actions'

export interface Props extends ReactProps {
  content: ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  arrow?: boolean
  padding?: boolean
  className?: Argument
  size?: 'sm' | 'md' | 'lg'
}
interface State {
  isOpen: boolean
  triggerTop: number
  triggerLeft: number
  triggerWidth: number
  triggerHeight: number
  tooltipWidth: number
  tooltipHeight: number
}

const Tooltip: FC<Props> = ({
  content,
  children,
  arrow = true,
  position = 'top',
  padding = true,
  className,
  size = 'md',
  ...props
}) => {
  const [
    {
      isOpen,
      triggerLeft,
      triggerTop,
      triggerHeight,
      triggerWidth,
      tooltipHeight,
      tooltipWidth
    },
    setState,
    _,
    resetState
  ] = useObjectState<State>({
    isOpen: false,
    triggerTop: 0,
    triggerLeft: 0,
    triggerHeight: 0,
    triggerWidth: 0,
    tooltipHeight: 0,
    tooltipWidth: 0
  })
  const ref = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const child = Children.only(
    typeof children === 'string' ? (
      <div tabIndex={-1}>{children}</div>
    ) : (
      children
    )
  ) as ReactElement
  const trigger = cloneElement(child, {
    ...props,
    className: className || 'inline-block',
    onMouseEnter: (e: MouseEvent) => {
      const element = e.currentTarget as HTMLElement
      const { height, width, top, left } = element.getBoundingClientRect()
      setState({
        isOpen: true,
        triggerLeft: left,
        triggerTop: top,
        triggerHeight: height,
        triggerWidth: width
      })
    },
    onMouseLeave: () => resetState()
  })

  const left: number = useMemo(() => {
    if (position === 'top' || position === 'bottom')
      return triggerLeft + triggerWidth / 2 - tooltipWidth / 2
    else if (position === 'left') return triggerLeft - tooltipWidth - 16
    else if (position === 'right') return triggerLeft + triggerWidth + 16
    return 0
  }, [triggerLeft, triggerWidth, tooltipWidth])

  const top: number = useMemo(() => {
    if (position === 'left' || position === 'right')
      return triggerTop + triggerHeight / 2 - tooltipHeight / 2
    else if (position === 'top') return triggerTop - tooltipHeight - 16
    else if (position === 'bottom') return triggerTop + tooltipHeight + 20
    return 0
  }, [triggerTop, triggerHeight, tooltipHeight])

  const isPositioned: boolean = useMemo(
    () => !!tooltipHeight && !!tooltipWidth,
    [tooltipHeight, tooltipWidth]
  )

  const border: boolean = useMemo(() => theme !== 'dark', [theme])

  useEffect(() => {
    if (isOpen && ref.current) {
      const { height, width } = ref.current.getBoundingClientRect()
      setState({ tooltipHeight: height, tooltipWidth: width })
    }
  }, [isOpen, ref])
  return (
    <>
      {trigger}
      {isOpen &&
        createPortal(
          <div
            role="tooltip"
            ref={ref}
            className={classnames(
              'fixed z-[9999] rounded',
              isPositioned ? 'visible' : 'invisible',
              {
                'px-5 py-3': padding && size === 'lg',
                'px-3 py-2 text-sm': padding && size === 'md',
                'px-1.5 py-1 text-xs': padding && size === 'sm',
                'after:absolute after:z-10 after:border-8 after:content-[""]':
                  arrow,
                'border border-neutral-400': border,
                'before:absolute before:border-[9px] before:content-[""]':
                  arrow && border,

                'bg-white text-neutral-700': theme === 'light',
                'bg-black text-white': theme === 'dark',

                'after:border-t-white':
                  arrow && theme === 'light' && position === 'top',
                'after:border-b-white':
                  arrow && theme === 'light' && position === 'bottom',
                'after:border-l-white':
                  arrow && theme === 'light' && position === 'left',
                'after:border-r-white':
                  arrow && theme === 'light' && position === 'right',
                'after:border-t-black':
                  arrow && theme === 'dark' && position === 'top',
                'after:border-b-black':
                  arrow && theme === 'dark' && position === 'bottom',
                'after:border-l-black':
                  arrow && theme === 'dark' && position === 'left',
                'after:border-r-black':
                  arrow && theme === 'dark' && position === 'right',

                'after:bottom-full after:border-t-transparent':
                  arrow && position === 'bottom',
                'after:top-full after:border-b-transparent':
                  arrow && position === 'top',
                'after:left-1/2 after:-ml-2 after:border-x-transparent':
                  arrow && (position === 'top' || position === 'bottom'),

                'after:left-full after:border-r-transparent':
                  arrow && position === 'left',
                'after:right-full after:border-l-transparent':
                  arrow && position === 'right',
                'after:top-1/2 after:-mt-2 after:border-y-transparent':
                  arrow && (position === 'left' || position === 'right'),

                'before:bottom-full before:border-t-transparent':
                  arrow && border && position === 'bottom',
                'before:top-full before:border-b-transparent':
                  arrow && border && position === 'top',
                'before:left-full before:border-r-transparent':
                  arrow && border && position === 'left',
                'before:right-full before:border-l-transparent':
                  arrow && border && position === 'right',

                'before:left-[calc(50%-1px)] before:-ml-2 before:border-x-transparent':
                  arrow &&
                  border &&
                  (position === 'top' || position === 'bottom'),
                'before:top-[calc(50%-1px)] before:-mt-2 before:border-y-transparent':
                  arrow &&
                  border &&
                  (position === 'left' || position === 'right'),

                'before:border-b-neutral-400':
                  arrow && border && theme === 'light' && position === 'bottom',
                'before:border-b-black':
                  arrow && border && theme === 'dark' && position === 'bottom',
                'before:border-t-neutral-400':
                  arrow && border && theme === 'light' && position === 'top',
                'before:border-t-black':
                  arrow && border && theme === 'dark' && position === 'top',
                'before:border-l-neutral-400':
                  arrow && border && theme === 'light' && position === 'left',
                'before:border-l-black':
                  arrow && border && theme === 'dark' && position === 'left',
                'before:border-r-neutral-400':
                  arrow && border && theme === 'light' && position === 'right',
                'before:border-r-black':
                  arrow && border && theme === 'dark' && position === 'right'
              }
            )}
            style={{ left, top }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}

export default Object.assign(Tooltip, {
  AddReaction: AddReactionTooltip,
  Reaction: ReactionTooltip,
  Actions: TooltipActions
})
