import { AtSymbolIcon } from '@heroicons/react/24/outline'
import { SEO } from 'components'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { useObjectState, useUser } from 'services'

interface State {
  list: NTable.Mentions[]
}

const MentionsPage: NextPage = () => {
  const [{ list }, setState] = useObjectState<State>({ list: [] })
  const [user] = useUser()

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
          {!!list.length ? (
            <div></div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <AtSymbolIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-lg font-bold">
                  회원님을 언급한 메시지들을 확인하실 수 있습니다.
                </div>
                <div className="text-sm text-neutral-600">
                  {!user
                    ? '로그인이 필요합니다.'
                    : '아직은 멘션이 하나도 없네요.'}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default MentionsPage
