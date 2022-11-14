import type { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { presenceListState, useObjectState } from 'services'
import { Modal } from 'containers'

export interface Props {}
interface State {
  isPresenceOpen: boolean
  isProfileOpen: boolean
  userId: string
}

const Presence: FC<Props> = () => {
  const [{ isPresenceOpen, isProfileOpen, userId }, setState] =
    useObjectState<State>({
      isPresenceOpen: false,
      isProfileOpen: false,
      userId: ''
    })
  const presenceList = useRecoilValue(presenceListState)
  return (
    <>
      <div className="fixed top-3 right-6 hidden sm:block">
        <div className="relative flex flex-row-reverse">
          {presenceList.length > 3 && (
            <span className="-mr-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-neutral-400 text-sm text-neutral-50">
              {`+${presenceList.length - 3}`}
            </span>
          )}
          {presenceList.slice(0, 3).map((item, key) => (
            <img
              key={key}
              src={item.avatarUrl}
              alt=""
              draggable={false}
              className="-mr-2 h-8 w-8 cursor-pointer rounded-full border first:ml-0 only:mr-0 dark:border-neutral-600"
              onClick={() => setState({ isPresenceOpen: true })}
            />
          ))}
        </div>
      </div>
      <Modal
        isOpen={isPresenceOpen}
        onClose={() => setState({ isPresenceOpen: false })}
        title={`현재 온라인 유저: ${presenceList.length}`}
        padding={false}
        maxWidth="max-w-xs"
      >
        <div className="space-y-1 p-2">
          {presenceList.map((item) => (
            <div
              key={item.presence_ref}
              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              onClick={() => setState({ isProfileOpen: true, userId: item.id })}
            >
              <img
                src={item.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full"
              />
              <span>{item.nickname}</span>
            </div>
          ))}
        </div>
      </Modal>
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
    </>
  )
}

export default Presence
