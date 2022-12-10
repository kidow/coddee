import { memo } from 'react'
import type { FC } from 'react'
import { toast, TOAST_MESSAGE, useUser } from 'services'

export interface Props {
  text: string
  emoji: string
  onClick: () => void
  onMouseEnter: () => void
}
interface State {}

const EmojiButton: FC<Props> = ({ text, emoji, onClick, onMouseEnter }) => {
  const [user] = useUser()
  return (
    <button
      onClick={() => {
        if (!user) toast.info(TOAST_MESSAGE.LOGIN_REQUIRED)
        else onClick()
      }}
      className="rounded p-1 hover:bg-blue-50 active:scale-95 dark:hover:bg-neutral-700"
      title={`:${text}:`}
      onMouseEnter={onMouseEnter}
    >
      <span className={`bem bem-${text} ap ap-${text}`}>{emoji}</span>
    </button>
  )
}

export default memo(EmojiButton)
