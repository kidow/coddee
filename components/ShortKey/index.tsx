import dynamic from 'next/dynamic'
import type { FC } from 'react'
import type { Argument } from 'classnames'

export interface Props {
  className?: Argument
}
interface State {}

const ShortKey: FC<Props> = () => {
  return (
    <kbd className="flex h-5 items-center justify-center rounded border border-slate-400 bg-slate-200 px-1 tracking-tighter text-slate-600 shadow-2xl">
      {window.navigator.platform.toUpperCase().indexOf('MAC') !== -1
        ? '⌘'
        : 'Ctrl'}
    </kbd>
  )
}

export default dynamic(() => Promise.resolve(() => <ShortKey />), {
  ssr: false
})
