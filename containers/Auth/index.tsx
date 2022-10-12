import { useEffect } from 'react'
import type { FC } from 'react'
import { supabase, useBackdrop, useUser } from 'services'
import { Backdrop } from 'containers'

export interface Props extends ReactProps {}
interface State {}

const Auth: FC<Props> = ({ children }) => {
  const backdrop = useBackdrop()
  const [_, setUser] = useUser()

  const get = async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    if (error) {
      console.error(error)
      return
    }
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

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        backdrop(true)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session?.user.id)
          .single()
        if (error) console.error(error)
        if (!data) {
          const { error } = await supabase
            .from('users')
            .insert({
              id: session?.user.id,
              email: session?.user.email,
              avatar_url: session?.user.user_metadata.avatar_url
            })
            .single()
          if (error) console.error(error)
        }
        backdrop(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  return (
    <>
      <Backdrop />
      {children}
    </>
  )
}

export default Auth
