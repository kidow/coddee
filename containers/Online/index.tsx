import { memo } from 'react'
import type { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { onlineState, useObjectState } from 'services'
import { Modal } from 'containers'

export interface Props {}
interface State {
  isOnlineOpen: boolean
  isProfileOpen: boolean
  userId: string
}

const Online: FC<Props> = () => {
  const [{ isOnlineOpen, isProfileOpen, userId }, setState] =
    useObjectState<State>({
      isOnlineOpen: false,
      isProfileOpen: false,
      userId: ''
    })
  const onlineList = useRecoilValue(onlineState)
  return (
    <>
      <div className="fixed top-3 right-6 hidden sm:block">
        <div className="relative flex flex-row-reverse">
          {onlineList.length > 3 && (
            <span className="-mr-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-neutral-400 text-sm text-neutral-50">
              {`+${onlineList.length - 3}`}
            </span>
          )}
          {onlineList.slice(0, 3).map((item, key) => (
            <img
              key={key}
              src={item.avatarUrl}
              alt=""
              draggable={false}
              className="-mr-2 h-8 w-8 cursor-pointer rounded-full border first:ml-0 only:mr-0 dark:border-neutral-600"
              onClick={() => setState({ isOnlineOpen: true })}
            />
          ))}
        </div>
      </div>
      <Modal
        isOpen={isOnlineOpen}
        onClose={() => setState({ isOnlineOpen: false })}
        title={`현재 온라인 유저: ${onlineList.length}`}
        padding={false}
        maxWidth="max-w-xl"
      >
        <div className="grid grid-cols-3 gap-2 p-2">
          {onlineList.map((item) => (
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

export default memo(Online)
