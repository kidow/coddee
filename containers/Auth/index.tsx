import { useEffect } from 'react'
import type { FC } from 'react'
import { toast, TOAST_MESSAGE, useUser } from 'services'
import { useUser as useAuth } from '@supabase/auth-helpers-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends ReactProps {}
interface State {}

const Auth: FC<Props> = ({ children }) => {
  const [user, setUser] = useUser()
  const auth = useAuth()
  const supabase = useSupabaseClient()

  const get = async () => {
    if (!auth || !!user) return
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.id)
      .single()
    if (error) {
      console.error(error)
      return
    }
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
          console.error(error)
          return
        }
        setUser(result)
      } else setUser(data)
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
          avatar_url: auth.user_metadata.avatar_url,
          nickname: auth.user_metadata.user_name,
          email: auth.email
        })
        .select()
        .single()
      if (error) {
        console.error(error)
        toast.error(TOAST_MESSAGE.API_ERROR)
        return
      }
      setUser(data)
    }
  }

  useEffect(() => {
    get()
  }, [auth])
  return <>{children}</>
}

export default Auth
