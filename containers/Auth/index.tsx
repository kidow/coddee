import { useEffect } from 'react'
import type { FC } from 'react'
import {
  captureException,
  presenceListState,
  toast,
  TOAST_MESSAGE,
  useUser
} from 'services'
import {
  useUser as useAuth,
  useSupabaseClient
} from '@supabase/auth-helpers-react'
import { useSetRecoilState } from 'recoil'

export interface Props extends ReactProps {}
interface State {}

const Auth: FC<Props> = ({ children }) => {
  const [user, setUser] = useUser()
  const auth = useAuth()
  const supabase = useSupabaseClient()
  const setPresenceList = useSetRecoilState(presenceListState)

  const get = async () => {
    if (!auth || !!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.id)
      .single()
    if (data) {
      if (
        data.avatar_url !== auth.user_metadata.avatar_url ||
        data.nickname !== auth.user_metadata.user_name
      ) {
        const { data: result, error } = await supabase
          .from('users')
          .update({
            avatar_url: auth.user_metadata.avatar_url,
            nickname: auth.user_metadata.user_name
          })
          .eq('id', auth.id)
          .select()
          .single()
        if (error) {
          captureException(error, auth)
          console.error(error)
          return
        }
        setUser(result)
      } else {
        setUser(data)
      }
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: auth.id,
          avatar_url: auth.user_metadata.avatar_url,
          nickname: auth.user_metadata.user_name,
          email: auth.email
        })
        .select()
        .single()
      if (error) {
        captureException(error, auth)
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setUser(data)
    }
  }

  const onVisibilityChange = async (e: Event) => {
    const online = supabase
      .getChannels()
      .find((item) => item.topic === 'realtime:online-users')
    if (!online) return
    if (document.hidden) {
      await online.untrack()
    } else {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      await online.track({
        id: auth.user.id,
        nickname: auth.user.user_metadata?.user_name,
        avatarUrl: auth.user.user_metadata?.avatar_url
      })
    }
  }

  useEffect(() => {
    get()
  }, [auth])

  useEffect(() => {
    const online = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        setPresenceList(Object.values(online.presenceState()).map(([v]) => v))
      })
      .on('presence', { event: 'join' }, ({ currentPresences }) => {
        setPresenceList(currentPresences)
      })
      .on('presence', { event: 'leave' }, ({ currentPresences }) => {
        setPresenceList(currentPresences)
      })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        await online.untrack()
      }
    })

    online.subscribe(async (status, error) => {
      switch (status) {
        case 'SUBSCRIBED':
          const { data: auth } = await supabase.auth.getUser()
          if (auth.user) {
            await online.track({
              id: auth.user.id,
              nickname: auth.user.user_metadata?.user_name,
              avatarUrl: auth.user.user_metadata?.avatar_url
            })
            document.addEventListener('visibilitychange', onVisibilityChange)
          }
          break
        case 'CHANNEL_ERROR':
          captureException(error, auth.user)
          console.error(error)
          break
        case 'CLOSED':
          break
        case 'TIMED_OUT':
          break
      }
    })

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      online.unsubscribe().then().catch()
    }
  }, [])

  return <>{children}</>
}

export default Auth
