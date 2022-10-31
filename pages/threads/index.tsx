import { SEO } from 'components'
import type { NextPage } from 'next'

interface State {}

const ThreadsPage: NextPage = () => {
  return (
    <>
      <SEO title="스레드" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">스레드</span>
        </header>
        <main className="flex-1">ㅁㄴㅇ</main>
      </div>
    </>
  )
}

export default ThreadsPage
