import { Fragment, useEffect } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import { captureException, toast, useObjectState } from 'services'
import { Divider, Form } from 'components'
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  LinkIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export interface Props extends ModalProps {
  userId: string
}
interface State {
  avatarUrl: string
  nickname: string
  email: string
  bio: string
  jobCategory: string
  blogUrl: string
  followers: number
  following: number
  location: string
  githubUrl: string
  company: string
  repository: number
  isLoading: boolean
}

const ProfileModal: FC<Props> = ({ isOpen, onClose, userId }) => {
  const [
    {
      avatarUrl,
      nickname,
      email,
      jobCategory,
      bio,
      blogUrl,
      followers,
      following,
      location,
      githubUrl,
      company,
      repository,
      isLoading
    },
    setState
  ] = useObjectState<State>({
    avatarUrl: '',
    nickname: '',
    email: '',
    bio: '',
    jobCategory: '',
    blogUrl: '',
    followers: 0,
    following: 0,
    location: '',
    githubUrl: '',
    company: '',
    repository: 0,
    isLoading: true
  })
  const supabase = useSupabaseClient<Database>()

  const get = async () => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      captureException(error, user)
      setState({ isLoading: false })
      return
    }
    const res = await fetch(`https://api.github.com/users/${user.nickname}`)
    const data = await res.json()
    setState({
      avatarUrl: data.avatar_url || '',
      nickname: user.nickname || '',
      email: user.email,
      jobCategory: user.job_category || '',
      bio: data.bio || '',
      blogUrl: data.blog || '',
      location: data.location || '',
      followers: data.followers || 0,
      following: data.following || 0,
      githubUrl: data.html_url || '',
      company: data.company || '',
      repository: data.public_repos || 0,
      isLoading: false
    })
  }

  useEffect(() => {
    if (!isOpen) return
    get()
  }, [isOpen])
  if (!isOpen) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} padding={false}>
      <div className="relative h-16 bg-neutral-800 dark:bg-black">
        <div className="absolute left-4 top-4 rounded-full bg-white p-2 dark:bg-black">
          {isLoading ? (
            <div role="status" className="skeleton h-20 w-20 rounded-full" />
          ) : !!avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full" />
          ) : (
            <div className="skeleton h-20 w-20 rounded-full" />
          )}
        </div>
        <button className="absolute top-3 right-4" onClick={onClose}>
          <XMarkIcon className="h-5 w-5 text-neutral-100" />
        </button>
      </div>
      <div className="px-5 pt-16 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xl">
            {isLoading ? (
              <span role="status" className="skeleton h-7 w-16 rounded-full" />
            ) : (
              <span className="font-bold">{nickname}</span>
            )}
            <a target="_blank" href={githubUrl}>
              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-700" />
            </a>
          </div>
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
        <Divider />
        <div className="space-y-1.5">
          <Form.Item Icon={BuildingOffice2Icon}>
            {isLoading ? (
              <div role="status" className="skeleton h-4 w-20 rounded-full" />
            ) : (
              <span>{company}</span>
            )}
          </Form.Item>
          <Form.Item Icon={MapPinIcon}>
            {isLoading ? (
              <div role="status" className="skeleton h-4 w-28 rounded-full" />
            ) : (
              <span>{location}</span>
            )}
          </Form.Item>
          <Form.Item Icon={EnvelopeIcon}>
            {isLoading ? (
              <div role="status" className="skeleton h-4 w-36 rounded-full" />
            ) : (
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            )}
          </Form.Item>
          <Form.Item Icon={LinkIcon}>
            {isLoading ? (
              <div role="status" className="skeleton h-4 w-48 rounded-full" />
            ) : (
              <CopyToClipboard
                text={blogUrl}
                onCopy={() => toast.success('복사되었습니다.')}
              >
                <span className="cursor-pointer">{blogUrl}</span>
              </CopyToClipboard>
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
          <Divider />
          <Form.Item label="직무 및 분야">{jobCategory}</Form.Item>
        </div>
      </div>
    </Modal>
  )
}

export default ProfileModal
