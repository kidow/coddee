import { memo } from 'react'
import dynamic from 'next/dynamic'
import type { FC } from 'react'
import type { Argument } from 'classnames'

export interface Props {
  className?: Argument
}
interface State {}

const ShortKey: FC<Props> = memo(() => {
  return (
    <kbd>
      {window.navigator.platform.toUpperCase().indexOf('MAC') !== -1
        ? '⌘'
        : 'Ctrl'}
    </kbd>
  )
})

export default dynamic(() => Promise.resolve(() => <ShortKey />), {
  ssr: false
})
