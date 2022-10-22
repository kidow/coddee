import type { FC } from 'react'

export interface Props extends ReactProps {
  id: string
}
interface State {}

const EmojiPickerHeading: FC<Props> = ({ id, children }) => {
  return (
    <h3
      id={id}
      className="flex h-8 items-center gap-px px-2 text-xs font-semibold text-neutral-700"
    >
      {children}
    </h3>
  )
}

export default EmojiPickerHeading
