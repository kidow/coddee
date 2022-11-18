import { memo } from 'react'
import type { FC } from 'react'

export interface Props extends ReactProps {}
interface State {}

const MessageReactions: FC<Props> = ({ children }) => {
  return <div className="mt-1 flex flex-wrap gap-1 pr-10">{children}</div>
}

export default memo(MessageReactions)
