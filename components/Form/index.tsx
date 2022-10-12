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
    <div className="flex gap-10">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span>{title}</span>
          <button
            className="rounded-full p-1 hover:bg-neutral-100"
            onClick={() => setState({ isOpen: !isOpen })}
          >
            <ChevronDownIcon
              className={classnames('h-5 w-5 text-neutral-700 duration-150', {
                'rotate-180': !isOpen
              })}
            />
          </button>
        </div>
        {!!description && (
          <div ref={ref} className="mt-1">
            {description}
          </div>
        )}
      </div>
      <div
        className={classnames('flex-1 space-y-4', {
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
