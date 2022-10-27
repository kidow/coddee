import type { FC } from 'react'
import ContentPrivacy from './Privacy'
import ContentTerms from './Terms'

export interface Props {}
interface State {}

const Content: FC<Props> = () => <></>

export default Object.assign(Content, {
  Terms: ContentTerms,
  Privacy: ContentPrivacy
})
