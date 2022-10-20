import { Fragment, useEffect } from 'react'
import type { FC } from 'react'
import { Modal } from 'containers'
import { supabase, useObjectState } from 'services'
import { Form } from 'components'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

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
}

const ProfileModal: FC<Props> = ({ isOpen, onClose, userId }) => {
  if (!isOpen) return null
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
      repository
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
    repository: 0
  })

  const get = async () => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error(error)
      return
    }
    const res = await fetch(`https://api.github.com/users/${user.nickname}`)
    const data = await res.json()
    setState({
      avatarUrl: data.avatar_url || '',
      nickname: user.nickname || '',
      email: user.email,
      jobCategory: user.job_category,
      bio: data.bio || '',
      blogUrl: data.blog || '',
      location: data.location || '',
      followers: data.followers || 0,
      following: data.following || 0,
      githubUrl: data.html_url || '',
      company: data.company || '',
      repository: data.public_repos || 0
    })
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <Modal isOpen={isOpen} onClose={onClose} padding={false}>
      <div className="relative h-16 bg-neutral-800 dark:bg-black">
        <div className="absolute left-4 top-4 rounded-full bg-white p-2 dark:bg-black">
          {!!avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full" />
          ) : (
            <div className="h-20 w-20 rounded-full" />
          )}
        </div>
      </div>
      <div className="px-5 pt-16 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xl">
            <span className="font-bold">{nickname}</span>
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
        <hr className="my-2 dark:border-neutral-600" />
        <div className="space-y-4">
          <Form.Item label="이메일">
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          </Form.Item>
          <Form.Item label="직무 및 분야">{jobCategory}</Form.Item>
          <Form.Item label="회사">{company}</Form.Item>
          <Form.Item label="위치">{location}</Form.Item>
          <Form.Item label="블로그 URL">{blogUrl}</Form.Item>
          <Form.Item label="소개">
            {bio.split('\n').map((v, i) => (
              <div key={i}>{v}</div>
            ))}
          </Form.Item>
        </div>
      </div>
    </Modal>
  )
}

export default ProfileModal
