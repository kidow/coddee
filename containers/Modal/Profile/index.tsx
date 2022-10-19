import { useEffect } from 'react'
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
  intro: string
  jobCategory: string
  blogUrl: string
}

const ProfileModal: FC<Props> = ({ isOpen, onClose, userId }) => {
  if (!isOpen) return null
  const [
    { avatarUrl, nickname, email, jobCategory, intro, blogUrl },
    setState
  ] = useObjectState<State>({
    avatarUrl: '',
    nickname: '',
    email: '',
    intro: '',
    jobCategory: '',
    blogUrl: ''
  })

  const get = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error(error)
      return
    }
    setState({
      avatarUrl: data.avatar_url,
      nickname: data.nickname,
      email: data.email,
      jobCategory: data.job_category,
      intro: data.intro,
      blogUrl: data.blog_url
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
        <div className="flex items-center gap-1 text-xl font-bold">
          <span>{nickname}</span>
          <a target="_blank" href={`https://github.com/${nickname}`}>
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-700" />
          </a>
        </div>
        <hr className="my-2 dark:border-neutral-600" />
        <div className="space-y-4">
          <Form.Item label="이메일">
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          </Form.Item>
          <Form.Item label="직무 및 분야">{jobCategory}</Form.Item>
          <Form.Item label="블로그 URL">
            {!!blogUrl && (
              <a href={blogUrl} target="_blank" className="hover:underline">
                {blogUrl}
              </a>
            )}
          </Form.Item>
          <Form.Item label="한 줄 소개">{intro}</Form.Item>
        </div>
      </div>
    </Modal>
  )
}

export default ProfileModal
