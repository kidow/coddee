import { Textarea } from 'components'
import type { FC } from 'react'
import { useObjectState } from 'services'

export interface Props {
  content: string
  onCancel: () => void
  onSave: (content: string) => void
}
interface State {
  content: string
}

const MessageUpdate: FC<Props> = ({ onCancel, onSave, ...props }) => {
  const [{ content }, setState] = useObjectState<State>({
    content: props.content || ''
  })
  return (
    <div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-100 p-2 dark:bg-neutral-600 dark:text-neutral-200">
        <Textarea
          value={content}
          autoFocus
          onChange={(e) => setState({ content: e.target.value })}
        />
      </div>
      <div className="mt-1 flex gap-2 text-xs text-blue-500">
        <button onClick={onCancel}>취소</button>
        <button onClick={() => onSave(content)}>저장</button>
      </div>
    </div>
  )
}

export default MessageUpdate
