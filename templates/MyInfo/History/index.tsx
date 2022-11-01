import { useEffect } from 'react'
import { Timeline } from 'components'
import type { FC } from 'react'
import { useObjectState, useUser } from 'services'
import dayjs from 'dayjs'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props {}
interface State {
  list: Array<NTable.Chats & { room: { name: string } }>
}

const MyInfoHistory: FC<Props> = () => {
  const [{ list }, setState] = useObjectState<State>({ list: [] })
  const [user] = useUser()
  const supabase = useSupabaseClient()

  const get = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        *,
        room:room_id (
          name
        )
      `
      )
      .eq('user_id', user?.id)
    if (error) {
      console.error(error)
      return
    }
    setState({ list: data || [] })
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <div className="p-6">
      <Timeline
        list={[
          {
            tag: dayjs(user?.created_at).format('YY.MM.DD HH:mm'),
            title: '회원가입',
            content: '커디에 처음 오신 날입니다.'
          },
          ...list.map((item) => ({
            tag: dayjs(item.created_at).format('YY.MM.DD HH:mm'),
            title: item.room.name,
            content: item.content
          }))
        ]}
      />
    </div>
  )
}

export default MyInfoHistory
