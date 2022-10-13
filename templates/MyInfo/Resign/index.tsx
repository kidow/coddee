import { Button, Input } from 'components'
import type { FC } from 'react'
import { supabase, useObjectState, useUser } from 'services'

export interface Props {}
interface State {
  message: string
}

const MyInfoResign: FC<Props> = () => {
  const [{ message }, setState, onChange] = useObjectState<State>({
    message: ''
  })
  const [user] = useUser()

  const onResign = async () => {
    if (!window.confirm('정말 탈퇴하시겠습니까?')) return

    const { error } = await supabase.from('users').delete().eq('id', user?.id)
    if (error) {
      console.error(error)
      return
    }
    await supabase.auth.signOut()
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-red-500">
        탈퇴하면 유저 정보와 활동 내역은 모두 사라집니다.
      </p>
      <div>
        <Input
          value={message}
          name="message"
          onChange={onChange}
          placeholder="탈퇴합니다"
          float={false}
          info='"탈퇴합니다"를 입력해주세요.'
        />
      </div>
      <Button disabled={message !== '탈퇴합니다'} theme="danger" size="sm">
        탈퇴
      </Button>
    </div>
  )
}

export default MyInfoResign
