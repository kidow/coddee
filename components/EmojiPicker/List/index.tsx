import type { FC } from 'react'

export interface Props {
  list: string[]
  onClick: (value: string) => void
}
interface State {}

const EmojiPickerList: FC<Props> = ({ list, onClick }) => {
  return (
    <div className="grid grid-cols-9 gap-px px-1 text-xl">
      {list.map((value, key) => (
        <button
          key={key}
          onClick={() => onClick(value)}
          className="rounded-lg duration-150 hover:bg-blue-50"
        >
          {value}
        </button>
      ))}
    </div>
  )
}

export default EmojiPickerList
