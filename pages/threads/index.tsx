import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import { SEO } from 'components'
import type { NextPage } from 'next'
import { useUser } from 'services'

interface State {}

const ThreadsPage: NextPage = () => {
  const [user] = useUser()
  return (
    <>
      <SEO title="스레드" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">스레드</span>
        </header>
        <main className="flex-1">
          <div className="flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center">
                <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-lg font-bold">
                회원님이 속한 스레드를 확인할 수 있습니다.
              </div>
              <div className="text-sm text-neutral-600">
                {!user
                  ? '로그인이 필요합니다.'
                  : '아직은 스레드가 하나도 없네요.'}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default ThreadsPage
