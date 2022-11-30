import type { FC } from 'react'

export interface Props {
  text: string
  emoji: string
  onClick: (text: string, emoji: string) => void
  onMouseEnter: () => void
}
interface State {}

const EmojiButton: FC<Props> = ({ text, emoji, onClick, onMouseEnter }) => {
  return (
    <button
      onClick={() => onClick(text, emoji)}
      className="rounded p-1 hover:bg-blue-50 active:scale-95 dark:hover:bg-neutral-700"
      title={`:${text}:`}
      onMouseEnter={onMouseEnter}
    >
      <span className={`bem bem-${text} ap ap-${text}`}>{emoji}</span>
    </button>
  )
}

export default EmojiButton
