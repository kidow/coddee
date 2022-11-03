import type { FC } from 'react'

import ThreadChat from './Chat'
import ThreadReply from './Reply'

export interface Props {}
interface State {}

const Thread: FC<Props> = () => <></>

export default Object.assign(Thread, { Chat: ThreadChat, Reply: ThreadReply })
