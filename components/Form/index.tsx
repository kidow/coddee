import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useRef } from 'react'
import type { FC, ReactNode } from 'react'
import { useObjectState } from 'services'
import classnames from 'classnames'

import FormItem from './Item'

export interface Props extends ReactProps {
  title: string
  description?: ReactNode
}
interface State {
  isOpen: boolean
}

const Form: FC<Props> = ({ title, description, children }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: true })
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div className="gap-10 sm:flex">
      <div className="mb-4 sm:flex-1">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span>{title}</span>
          <button
            className="hidden rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 sm:inline-block"
            onClick={() => setState({ isOpen: !isOpen })}
          >
            <ChevronDownIcon
              className={classnames(
                'h-5 w-5 text-neutral-700 duration-150 dark:text-neutral-500',
                { 'rotate-180': !isOpen }
              )}
            />
          </button>
        </div>
        {!!description && (
          <div
            ref={ref}
            className="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500"
          >
            {description}
          </div>
        )}
      </div>
      <div
        className={classnames('space-y-4 sm:flex-1', {
          'overflow-hidden': !isOpen
        })}
        style={{
          height: isOpen ? undefined : (ref.current?.clientHeight || 0) + 28
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Object.assign(Form, { Item: FormItem })
