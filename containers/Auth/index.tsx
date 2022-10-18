import { useEffect } from 'react'
import type { FC } from 'react'
import { supabase, useUser } from 'services'

export interface Props extends ReactProps {}
interface State {}

const Auth: FC<Props> = ({ children }) => {
  const [user, setUser] = useUser()

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
              avatar_url: session?.user.user_metadata.avatar_url,
              nickname: session?.user.user_metadata.user_name,
              github_url: `https://github.com/${session?.user.user_metadata.user_name}`
            })
            .single()
          if (error) console.error(error)
          else {
            await fetch('/api/register', {
              method: 'POST',
              headers: new Headers({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ email: session?.user.email })
            }).catch((err) => console.error(err))
          }
        } else if (
          user?.avatar_url !== session?.user.user_metadata.avatar_url ||
          user?.nickname !== session?.user.user_metadata.user_name
        ) {
          const { data, error } = await supabase
            .from('users')
            .update({
              avatar_url: session?.user.user_metadata.avatar_url,
              nickname: session?.user.user_metadata.user_name
            })
            .eq('id', session?.user.id)
            .select('*')
            .single()
          if (error) {
            console.error(error)
            return
          }
          setUser({
            ...data,
            avatar_url: session?.user.user_metadata.avatar_url,
            nickname: session?.user.user_metadata.user_name
          })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  return <>{children}</>
}

export default Auth
