import { memo, useMemo } from 'react'
import type { FC } from 'react'
import * as cheerio from 'cheerio'

import MessageActions from './Actions'
import MessageAvatar from './Avatar'
import MessageButton from './Button'
import MessageChat from './Chat'
import MessageCodeBlock from './CodeBlock'
import MessageReply from './Reply'
import MessageUpdate from './Update'
import MessageOpengraph from './Opengraph'
import MessageDivider from './Divider'

export interface Props {
  content: string
  updatedAt: string
}
interface State {}

const Message: FC<Props> = ({ content, updatedAt }) => {
  const html: string = useMemo(() => {
    const $ = cheerio.load(content, null, false)
    if (!!updatedAt) {
      $('p:last').append(`<span class="updated">(편집됨)</span>`)
    }
    return !!updatedAt ? $.html() : content
  }, [content, updatedAt])
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="ql-editor overflow-y-hidden"
    />
  )
}

export default Object.assign(memo(Message), {
  Update: MessageUpdate,
  Reply: MessageReply,
  CodeBlock: MessageCodeBlock,
  Chat: MessageChat,
  Avatar: MessageAvatar,
  Actions: MessageActions,
  Button: MessageButton,
  Opengraph: MessageOpengraph,
  Divider: MessageDivider
})
