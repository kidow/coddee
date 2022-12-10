import { TrashIcon } from '@heroicons/react/24/outline'
import { Modal } from 'containers'
import { memo } from 'react'
import type { FC } from 'react'
import { useObjectState } from 'services'

export interface Props {
  url: string
  userId: string
  deletedAt?: string
}
interface State {
  isOpen: boolean
}

const MessageAvatar: FC<Props> = ({ url, userId, deletedAt }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      {!!deletedAt ? (
        <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 dark:group-hover:bg-neutral-600">
          <TrashIcon className="h-5 w-5 text-neutral-400" />
        </span>
      ) : (
        <img
          src={url}
          alt=""
          draggable={false}
          className="mt-1 h-8 w-8 cursor-pointer rounded-full"
          onClick={() => setState({ isOpen: true })}
        />
      )}
      <Modal.Profile
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
        userId={userId}
      />
    </>
  )
}

export default memo(MessageAvatar)
