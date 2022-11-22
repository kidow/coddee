import { memo, useMemo } from 'react'
import type { FC } from 'react'
import { useObjectState } from 'services'
import { Modal } from 'containers'
import * as cheerio from 'cheerio'

import MessageActions from './Actions'
import MessageAvatar from './Avatar'
import MessageButton from './Button'
import MessageChat from './Chat'
import MessageCodeBlock from './CodeBlock'
import MessageReactions from './Reactions'
import MessageReply from './Reply'
import MessageUpdate from './Update'
import MessageOpengraph from './Opengraph'
import MessageDivider from './Divider'

export interface Props {
  content: string
  updatedAt: string
}
interface State {
  isProfileOpen: boolean
  userId: string
}

const Message: FC<Props> = ({ content, updatedAt }) => {
  const [{ isProfileOpen, userId }, setState] = useObjectState<State>({
    isProfileOpen: false,
    userId: ''
  })

  const value: string = useMemo(() => {
    const $ = cheerio.load(content, null, false)
    if (!!updatedAt) {
      $('p:last').append(`<span class="updated">(편집됨)</span>`)
    }
    return !!updatedAt ? $.html() : content
  }, [content, updatedAt])
  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: value }}
        className="ql-editor overflow-y-hidden"
      />
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
    </>
  )
}

export default Object.assign(memo(Message), {
  Update: MessageUpdate,
  Reply: MessageReply,
  CodeBlock: MessageCodeBlock,
  Chat: MessageChat,
  Reactions: MessageReactions,
  Avatar: MessageAvatar,
  Actions: MessageActions,
  Button: MessageButton,
  Opengraph: MessageOpengraph,
  Divider: MessageDivider
})
