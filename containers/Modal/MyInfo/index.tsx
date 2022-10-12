import { useMemo } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import classnames from 'classnames'
import { useObjectState, useUser } from 'services'
import { Button, Form, Input } from 'components'

export interface Props extends ModalProps {}
interface State {
  tab: number
  introduction: string
}

const MyInfoModal: FC<Props> = ({ isOpen, onClose }) => {
  const [{ tab, introduction }, setState, onChange] = useObjectState<State>({
    tab: 0,
    introduction: ''
  })
  const [user] = useUser()

  const onUploadAvatar = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (!input.files) return
      const file = input.files[0]
    }
    input.click()
  }

  const PROFILE_TABS: string[] = useMemo(
    () => [
      '내 정보',
      '탈퇴',
      ...(user?.email === process.env.NEXT_PUBLIC_ADMIN_ID
        ? ['채팅방', '언어']
        : [])
    ],
    [user]
  )
  return (
    <Modal
      maxWidth="max-w-5xl"
      isOpen={isOpen}
      onClose={onClose}
      padding={false}
    >
      <div className="divide-x-neutral-400 flex divide-x">
        <menu className="w-48 bg-neutral-100">
          <ul>
            {PROFILE_TABS.map((item, key) => (
              <li
                key={key}
                className={classnames('cursor-pointer py-3 px-5', {
                  'bg-neutral-200 font-semibold': tab === key
                })}
                onClick={() => setState({ tab: key })}
              >
                {item}
              </li>
            ))}
          </ul>
        </menu>
        <section className="h-[40rem] flex-1 overflow-auto p-6">
          {PROFILE_TABS[tab] === '내 정보' && (
            <div className="space-y-8">
              <Form.Item label="이메일">{user?.email}</Form.Item>
              <Form.Item label="아바타 이미지">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar_url}
                    alt=""
                    className="h-10 w-10 cursor-pointer"
                  />
                  <Button size="xs" shape="outlined" onClick={onUploadAvatar}>
                    변경
                  </Button>
                </div>
              </Form.Item>
              <Form.Item label="한 줄 소개">
                <Input
                  fullWidth
                  value={introduction}
                  name="introduction"
                  onChange={onChange}
                />
              </Form.Item>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}

export default MyInfoModal
