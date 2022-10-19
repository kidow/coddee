import { useCallback, useEffect } from 'react'
import type { FC } from 'react'
import { EventListener, useObjectState } from 'services'
import { createPortal } from 'react-dom'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export interface Props {}
interface State {
  list: Array<{
    id: string
    message: string
    type: NToast.Type
  }>
}

const Toast: FC<Props> = () => {
  const [{ list }, setState] = useObjectState<State>({ list: [] })

  const onMessage = useCallback(
    ({ detail }: any) =>
      setState({
        list: !!detail.id
          ? list.filter((item) => item.id !== detail.id)
          : [
              ...list,
              {
                id: Math.random().toString(36).slice(2),
                message: detail.message,
                type: detail.type
              }
            ]
      }),
    [list.length]
  )

  useEffect(() => {
    EventListener.once('toast', onMessage)
  }, [list.length])

  if (!list.length) return null
  return createPortal(
    <div role="alertdialog">
      <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 space-y-4">
        {list.map((item) => (
          <div
            className="w-72 animate-fade-up cursor-pointer rounded bg-white py-2 px-4 dark:bg-black"
            id={item.id}
            key={item.id}
            onClick={() => EventListener.emit('toast', { id: item.id })}
            role="alert"
            style={{
              boxShadow:
                'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px'
            }}
          >
            <div className="flex items-center gap-2">
              <span>
                {item.type === 'success' && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                {item.type === 'info' && (
                  <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                )}
                {item.type === 'warn' && (
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                )}
                {item.type === 'error' && (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </span>
              <span className="text-sm">{item.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}

export default Toast
