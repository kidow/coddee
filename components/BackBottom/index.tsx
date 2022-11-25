import { memo } from 'react'
import type { FC } from 'react'
import classnames from 'classnames'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export interface Props {
  isIntersecting: boolean
}
interface State {}

const BackBottom: FC<Props> = ({ isIntersecting }) => {
  return (
    <button
      role="scrollbar"
      className={classnames(
        'fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 duration-150',
        isIntersecting ? 'scale-0' : 'scale-100'
      )}
      tabIndex={-1}
      onClick={() => window.scrollTo(0, document.body.scrollHeight)}
    >
      <ChevronDownIcon className="h-6 w-6 text-neutral-50" />
    </button>
  )
}

export default memo(BackBottom)
