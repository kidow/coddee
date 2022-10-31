import { SEO } from 'components'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { useObjectState } from 'services'

interface State {
  list: NTable.Mentions[]
}

const MentionsPage: NextPage = () => {
  const [{}, setState] = useObjectState<State>({ list: [] })

  const get = async () => {}

  useEffect(() => {
    get()
  }, [])
  return (
    <>
      <SEO title="멘션" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">멘션</span>
        </header>
        <main className="flex-1">
          <button
            onClick={() => {
              new Notification('Kidow', {
                body: '이렇게 함녀 될것같ㅇ네요',
                icon: 'https://avatars.githubusercontent.com/u/39021158?v=4'
              })
            }}
          >
            button
          </button>
        </main>
      </div>
    </>
  )
}

export default MentionsPage
