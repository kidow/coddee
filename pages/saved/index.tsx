import { SEO } from 'components'
import type { NextPage } from 'next'

interface State {}

const SavedPage: NextPage = () => {
  return (
    <>
      <SEO title="저장된 항목" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">저장된 항목</span>
        </header>
        <main className="flex-1 overflow-auto">준비 중입니다.</main>
      </div>
    </>
  )
}

export default SavedPage
