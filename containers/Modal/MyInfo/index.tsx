import { Fragment, useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import classnames from 'classnames'
import {
  backdrop,
  toast,
  TOAST_MESSAGE,
  useObjectState,
  useUser
} from 'services'
import { Button, Form, Input } from 'components'
import { MyInfo } from 'templates'
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  LinkIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends ModalProps {}
interface State {
  tab: string
  bio: string
  isUpdating: boolean
  avatarUrl: string
  jobCategory: string
  nickname: string
  message: string
  blogUrl: string
  email: string
  isResignOpen: boolean
  location: string
  followers: number
  following: number
  repository: number
  company: string
  isLoading: boolean
}

const MyInfoModal: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const [
    {
      tab,
      bio,
      isUpdating,
      avatarUrl,
      jobCategory,
      nickname,
      message,
      blogUrl,
      email,
      isResignOpen,
      location,
      followers,
      following,
      repository,
      company,
      isLoading
    },
    setState,
    onChange
  ] = useObjectState<State>({
    tab: '정보',
    bio: '',
    isUpdating: false,
    avatarUrl: '',
    jobCategory: '',
    nickname: '',
    message: '',
    blogUrl: '',
    email: '',
    isResignOpen: false,
    location: '',
    followers: 0,
    following: 0,
    repository: 0,
    company: '',
    isLoading: true
  })
  const supabase = useSupabaseClient()
  const [user] = useUser()

  const get = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single()
    if (error) {
      console.error(error)
      setState({ isLoading: false })
      return
    }
    try {
      const res = await fetch(`https://api.github.com/users/${data.nickname}`)
      const json = await res.json()
      setState({
        bio: json.bio || '',
        avatarUrl: json.avatar_url,
        nickname: data.nickname,
        jobCategory: data.job_category,
        blogUrl: json.blog || '',
        email: data.email,
        location: json.location || '',
        followers: json.followers || 0,
        following: json.following || 0,
        repository: json.public_repos || 0,
        company: json.company || '',
        isLoading: false
      })
    } catch (err) {
      console.error(err)
      setState({ isLoading: false })
    }
  }

  const update = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!!user && !auth.user) {
      await supabase.auth.signOut()
      toast.warn(TOAST_MESSAGE.SESSION_EXPIRED)
      onClose()
      return
    }
    const { error } = await supabase
      .from('users')
      .update({ job_category: jobCategory })
      .eq('id', user?.id)
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
    toast.success('로그아웃되었습니다.')
  }

  const PROFILE_TABS: string[] = useMemo(
    () => [
      '정보',
      '활동',
      '설정',
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
        <div className="relative sm:flex">
          <menu className="flex overflow-auto whitespace-nowrap bg-neutral-100 dark:bg-neutral-700 sm:w-48 sm:flex-col sm:overflow-visible sm:whitespace-normal">
            <ul className="flex sm:block sm:flex-1">
              {PROFILE_TABS.map((item, key) => (
                <li
                  key={key}
                  className={classnames('cursor-pointer py-3 px-5', {
                    'bg-neutral-200 font-semibold dark:bg-neutral-600':
                      tab === item
                  })}
                  onClick={() => setState({ tab: item })}
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
            {tab === '정보' && (
              <div className="divide-y dark:divide-neutral-700">
                <div className="relative h-16 bg-neutral-800 pb-8 dark:bg-black">
                  <div className="absolute left-4 top-4 rounded-full bg-white p-2 dark:bg-black">
                    {!!avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-20 w-20 rounded-full"
                      />
                    ) : (
                      <div className="skeleton h-20 w-20 rounded-full" />
                    )}
                  </div>
                  <div className="absolute top-[72px] left-32 space-y-1">
                    <span className="text-xl font-semibold">{nickname}</span>
                    <div className="flex items-center gap-1 text-xs">
                      {[
                        { tab: 'repositories', value: repository },
                        { tab: 'followers', value: followers },
                        { tab: 'following', value: following }
                      ].map((item, key) => (
                        <Fragment key={key}>
                          <a
                            href={`https://github.com/${nickname}?tab=${item.tab}`}
                            target="_blank"
                            className="group cursor-pointer text-neutral-400 hover:text-blue-500"
                          >
                            <span className="font-bold text-neutral-500 group-hover:text-blue-500 dark:text-neutral-200">
                              {item.value}
                            </span>
                            {` ${item.tab}`}
                          </a>
                          {key !== 2 && <span>·</span>}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <section className="space-y-1.5 p-6 pt-20">
                  <Form.Item icon={BuildingOffice2Icon}>
                    {isLoading ? (
                      <div
                        role="status"
                        className="skeleton h-4 w-20 rounded-full"
                      />
                    ) : (
                      <span>{company}</span>
                    )}
                  </Form.Item>
                  <Form.Item icon={MapPinIcon}>
                    {isLoading ? (
                      <div
                        role="status"
                        className="skeleton h-4 w-28 rounded-full"
                      />
                    ) : (
                      <span>{location}</span>
                    )}
                  </Form.Item>
                  <Form.Item icon={EnvelopeIcon}>
                    {isLoading ? (
                      <div
                        role="status"
                        className="skeleton h-4 w-36 rounded-full"
                      />
                    ) : (
                      <span>{email}</span>
                    )}
                  </Form.Item>
                  <Form.Item icon={LinkIcon}>
                    {isLoading ? (
                      <div
                        role="status"
                        className="skeleton h-4 w-48 rounded-full"
                      />
                    ) : (
                      <a
                        href={blogUrl}
                        target="_blank"
                        className="hover:underline"
                      >
                        {blogUrl}
                      </a>
                    )}
                  </Form.Item>
                  <div className="pt-2">
                    {isLoading ? (
                      <div
                        role="status"
                        className="skeleton space-y-2 [&>div]:h-2 [&>div]:rounded-full"
                      >
                        <div className="w-80" />
                        <div className="w-96" />
                        <div className="w-72" />
                        <div className="w-64" />
                        <div className="w-80" />
                      </div>
                    ) : (
                      bio.split('\n').map((v, i) => <div key={i}>{v}</div>)
                    )}
                  </div>
                </section>
                <section className="space-y-4 p-6">
                  <Form.Item label="직무 및 분야">
                    <Input
                      value={jobCategory}
                      name="jobCategory"
                      onChange={onChange}
                      placeholder="프론트엔드 개발자"
                      float={false}
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
            {tab === '채팅방' && <MyInfo.RoomList />}
            {tab === '언어' && <MyInfo.LanguageList />}
            {tab === '활동' && <MyInfo.History />}
            {tab === '설정' && <MyInfo.Setting />}
          </section>

          <button className="absolute top-3 right-4" onClick={onClose}>
            <XMarkIcon
              className={classnames(
                'h-5 w-5',
                tab === '정보' ? 'text-neutral-100' : 'text-neutral-900'
              )}
            />
          </button>
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
            className="dark:bg-white dark:text-neutral-900"
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
