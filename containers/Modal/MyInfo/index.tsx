import { useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import classnames from 'classnames'
import {
  supabase,
  toast,
  TOAST_MESSAGE,
  useBackdrop,
  useObjectState,
  useUser
} from 'services'
import { Button, Form, Input } from 'components'
import { MyInfo } from 'templates'

export interface Props extends ModalProps {}
interface State {
  tab: number
  intro: string
  isUpdating: boolean
  avatarUrl: string
  jobCategory: string
  nickname: string
  message: string
  blogUrl: string
  email: string
  isResignOpen: boolean
}

const MyInfoModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const [
    {
      tab,
      intro,
      isUpdating,
      avatarUrl,
      jobCategory,
      nickname,
      message,
      blogUrl,
      email,
      isResignOpen
    },
    setState,
    onChange
  ] = useObjectState<State>({
    tab: 0,
    intro: '',
    isUpdating: false,
    avatarUrl: '',
    jobCategory: '',
    nickname: '',
    message: '',
    blogUrl: '',
    email: '',
    isResignOpen: false
  })
  const [user, setUser] = useUser()
  const backdrop = useBackdrop()

  const get = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    setState({
      intro: data.intro,
      avatarUrl: data.avatar_url,
      nickname: data.nickname,
      jobCategory: data.job_category,
      blogUrl: data.blog_url,
      email: data.email
    })
  }

  const update = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }
    const { error } = await supabase
      .from('users')
      .update({ intro, job_category: jobCategory, blog_url: blogUrl })
      .eq('id', user.id)
      .single()
    if (error) console.error(error)
    else toast.success('변경되었습니다.')
  }

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error(error)
      return
    }
    onClose()
    setUser(null)
    toast.success('로그아웃되었습니다.')
  }

  const PROFILE_TABS: string[] = useMemo(
    () => [
      '내 정보',
      ...(user?.email === process.env.NEXT_PUBLIC_ADMIN_ID
        ? ['채팅방', '언어']
        : [])
    ],
    [user]
  )

  const onResign = async () => {
    if (message !== '탈퇴합니다') return
    if (!window.confirm('정말 탈퇴하시겠습니까?')) return
    backdrop(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      await supabase.auth.signOut()
      setUser(null)
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }

    const { error } = await supabase.from('users').delete().eq('id', user.id)
    if (error) {
      console.error(error)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setState({ isResignOpen: false })
    onClose()
    toast.success('탈퇴되었습니다.')
    backdrop(false)
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <>
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

          <section className="h-[40rem] flex-1 overflow-auto">
            {PROFILE_TABS[tab] === '내 정보' && (
              <div className="divide-y">
                <p className="px-6 py-3 text-xs italic text-neutral-400">
                  Github 프로필을 업데이트하면 자동으로 이미지와 닉네임이
                  갱신됩니다.
                </p>
                <section className="space-y-4 p-6">
                  <Form.Item label="이메일">{email}</Form.Item>
                  <Form.Item label="아바타 이미지">
                    {!!avatarUrl && (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-16 w-16 rounded-full"
                      />
                    )}
                  </Form.Item>
                  <Form.Item label="닉네임">{nickname}</Form.Item>
                  <Form.Item label="직무 및 분야">
                    <Input
                      value={jobCategory}
                      name="jobCategory"
                      onChange={onChange}
                      placeholder="프론트엔드 개발자"
                      float={false}
                    />
                  </Form.Item>
                  <Form.Item label="블로그 URL">
                    <Input
                      value={blogUrl}
                      name="blogUrl"
                      onChange={onChange}
                      type="url"
                      className="w-64"
                    />
                  </Form.Item>
                  <Form.Item label="한 줄 소개">
                    <Input
                      fullWidth
                      value={intro}
                      name="intro"
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
                      변경
                    </Button>
                  </div>
                </section>
                <section className="p-6">
                  <Button
                    theme="danger"
                    size="sm"
                    onClick={() => setState({ isResignOpen: true })}
                  >
                    탈퇴하기
                  </Button>
                </section>
              </div>
            )}
            {PROFILE_TABS[tab] === '채팅방' && <MyInfo.RoomList />}
            {PROFILE_TABS[tab] === '언어' && <MyInfo.LanguageList />}
          </section>
        </div>
      </Modal>
      <Modal
        isOpen={isResignOpen}
        onClose={() => setState({ isResignOpen: false })}
        error
        padding={false}
      >
        <div className="space-y-2 bg-red-50 py-6 px-7 text-center">
          <p className="text-sm text-red-500">
            탈퇴하면 유저 정보와 활동 내역은 모두 사라집니다.
          </p>
          <Input
            placeholder="탈퇴합니다"
            float={false}
            value={message}
            name="message"
            onChange={onChange}
          />
          <div>
            <Button
              disabled={message !== '탈퇴합니다'}
              onClick={onResign}
              theme="danger"
            >
              탈퇴
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default MyInfoModal
