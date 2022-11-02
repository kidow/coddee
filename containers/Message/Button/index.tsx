import type { FC } from 'react'

import MessageCodeButton from './Code'
import MessageSubmitButton from './Submit'

export interface Props {}
interface State {}

const MessageButton: FC<Props> = () => <></>

export default Object.assign(MessageButton, {
  Submit: MessageSubmitButton,
  Code: MessageCodeButton
})
