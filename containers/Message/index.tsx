import MessageActions from './Actions'
import MessageAvatar from './Avatar'
import MessageButton from './Button'
import MessageChat from './Chat'
import MessageCodeBlock from './CodeBlock'
import MessageParser from './Parser'
import MessageReactions from './Reactions'
import MessageReply from './Reply'
import MessageUpdate from './Update'
import MessageOpengraph from './Opengraph'
import MessageDivider from './Divider'

export default {
  Parser: MessageParser,
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
}
