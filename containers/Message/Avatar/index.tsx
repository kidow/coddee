import { Modal } from 'containers'
import type { FC } from 'react'
import { useObjectState } from 'services'

export interface Props {
  url: string
  userId: string
}
interface State {
  isOpen: boolean
}

const MessageAvatar: FC<Props> = ({ url, userId }) => {
  const [{ isOpen }, setState] = useObjectState<State>({ isOpen: false })
  return (
    <>
      <img
        src={url}
        alt=""
        className="mt-1 h-8 w-8 cursor-pointer rounded-full"
        onClick={() => setState({ isOpen: true })}
      />
      <Modal.Profile
        isOpen={isOpen}
        onClose={() => setState({ isOpen: false })}
        userId={userId}
      />
    </>
  )
}

export default MessageAvatar
