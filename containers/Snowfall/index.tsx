import { memo } from 'react'
import type { FC } from 'react'

export interface Props {}
interface State {}

const Snowfall: FC<Props> = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {Array.from({ length: 200 }).map((_, key) => (
        <div className="snow" key={key} />
      ))}
    </div>
  )
}

export default memo(Snowfall)
