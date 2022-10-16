import { useEffect } from 'react'
import type { FC } from 'react'
import { roomState, supabase, useUser } from 'services'
import { useRecoilState } from 'recoil'
import { useRouter } from 'next/router'

export interface Props extends ReactProps {}
interface State {}

const Realtime: FC<Props> = ({ children }) => {
  const [roomList, setRoomList] = useRecoilState(roomState)
  const { query } = useRouter()
  const [user] = useUser()

  const getRoomList = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(
        `
        id,
        name,
        logo_url,
        chats (
            id,
            content,
            created_at,
            user_id,
            language,
            code_block,
            user:user_id (
                id,
                avatar_url,
                nickname
            )
        )
    `
      )
      .order('created_at', { ascending: false, foreignTable: 'chats' })
      .limit(100, { foreignTable: 'chats' })
    if (error) {
      console.error(error)
      return
    }
    setRoomList(
      (data as any[]).map((item) => ({
        ...item,
        newCount: 0,
        recentMessage: item.chats?.at(0)?.content || ''
      })) || []
    )
  }

  useEffect(() => {
    getRoomList()
  }, [])

  useEffect(() => {
    supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        async (payload: any) => {
          const { data } = await supabase
            .from('users')
            .select('id, avatar_url, nickname')
            .eq('id', payload.new.user_id)
            .single()
          if (!data) return
          const index = roomList.findIndex(
            (item) => item.id === payload.new.room_id
          )
          setRoomList([
            ...roomList.slice(0, index),
            {
              ...roomList[index],
              chats: [{ ...payload.new, user: data }, ...roomList[index].chats],
              ...(payload.new.room_id !== query.id
                ? { newCount: roomList[index].newCount + 1 }
                : {})
            },
            ...roomList.slice(index + 1)
          ])
          if (payload.new.user_id === user?.id)
            window.scrollTo(0, document.body.scrollHeight)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chats' },
        async (payload: any) => {
          console.log('payload', payload)
        }
      )
      .subscribe()
  }, [roomList, query.id])
  return <>{children}</>
}

export default Realtime
