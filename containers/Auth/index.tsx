import { useEffect } from 'react'
import type { FC } from 'react'
import { useUser } from 'services'
import { useUser as useAuth } from '@supabase/auth-helpers-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends ReactProps {}
interface State {}

const Auth: FC<Props> = ({ children }) => {
  const [_, setUser] = useUser()
  const user = useAuth()
  const supabase = useSupabaseClient()

  const get = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setUser(data)
  }

  useEffect(() => {
    get()
  }, [user])
  return <>{children}</>
}

export default Auth
