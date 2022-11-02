import type { FC } from 'react'

export interface Props extends ReactProps {}
interface State {}

const MessageActions: FC<Props> = ({ children }) => {
  return (
    <div className="absolute right-8 -top-4 z-10 hidden rounded-lg border bg-white group-hover:block dark:border-neutral-800 dark:bg-neutral-700">
      <div className="flex p-0.5">{children}</div>
    </div>
  )
}

export default MessageActions
