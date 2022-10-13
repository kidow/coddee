import { useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import classnames from 'classnames'
import { fileToBase64, supabase, useObjectState, useUser } from 'services'
import { Button, Form, Input } from 'components'
import { MyInfo } from 'templates'

export interface Props extends ModalProps {}
interface State {
  tab: number
  introduction: string
  isUpdating: boolean
  avatarUrl: string
}

const MyInfoModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const [{ tab, introduction, isUpdating, avatarUrl }, setState, onChange] =
    useObjectState<State>({
      tab: 0,
      introduction: '',
      isUpdating: false,
      avatarUrl: ''
    })
  const [user, setUser] = useUser()

  const update = async () => {
    const { data } = await supabase
      .from('users')
      .update({ introduction, avatar_url: avatarUrl })
      .single()
  }

  const onUploadAvatar = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (!input.files) return
      const file = input.files[0]
      const base64 = await fileToBase64(file)
      setState({ avatarUrl: base64 })
    }
    input.click()
  }

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error(error)
      return
    }
    onClose()
    setUser(null)
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

  useEffect(() => {
    if (!avatarUrl) setState({ avatarUrl: user?.avatar_url || '' })
  }, [user])
  return (
    <Modal
      maxWidth="max-w-5xl"
      isOpen={isOpen}
      onClose={onClose}
      padding={false}
    >
      <div className="flex divide-x divide-neutral-200">
        <menu className="flex w-48 flex-col bg-neutral-100">
          <ul className="flex-1">
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
          <div className="py-3 px-5">
            <button className="text-sm" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </menu>

        <section className="h-[40rem] flex-1 overflow-auto p-6">
          {PROFILE_TABS[tab] === '내 정보' && (
            <div className="space-y-8">
              <Form.Item label="이메일">{user?.email}</Form.Item>
              <Form.Item label="아바타 이미지">
                <div className="inline-block">
                  <div className="inline-flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-10 w-10 cursor-pointer"
                    />
                    <Button
                      type="button"
                      size="xs"
                      shape="outlined"
                      onClick={onUploadAvatar}
                    >
                      변경
                    </Button>
                  </div>
                  <p className="mt-1 text-xs italic text-neutral-400">
                    5MB 이하의 이미지만 가능합니다.
                  </p>
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
              <div>
                <Button
                  onClick={update}
                  loading={isUpdating}
                  shape="outlined"
                  theme="primary"
                >
                  수정
                </Button>
              </div>
            </div>
          )}
          {PROFILE_TABS[tab] === '탈퇴' && <MyInfo.Resign />}
          {PROFILE_TABS[tab] === '채팅방' && <MyInfo.RoomList />}
          {PROFILE_TABS[tab] === '언어' && <MyInfo.LanguageList />}
        </section>
      </div>
    </Modal>
  )
}

export default MyInfoModal
