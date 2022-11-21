import { Textarea } from 'components'
import { useEffect, useId } from 'react'
import type { FC } from 'react'
import { EventListener, useObjectState } from 'services'

export interface Props {
  content: string
  onCancel: () => void
  onSave: (content: string) => void
  className?: string
}
interface State {
  content: string
}

const MessageUpdate: FC<Props> = ({
  onCancel,
  onSave,
  className,
  ...props
}) => {
  const [{ content }, setState] = useObjectState<State>({
    content: props.content || ''
  })
  const id = useId()

  useEffect(() => {
    EventListener.emit(`quill:focus:${id}`)
  }, [])
  return (
    <div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-100 p-2 dark:bg-neutral-600 dark:text-neutral-200">
        <Textarea
          value={content}
          id={id}
          onChange={(content) => setState({ content })}
          className={className}
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
