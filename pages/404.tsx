import { SEO } from 'components'
import type { NextPage } from 'next'

interface State {}

const NotFoundPage: NextPage = () => {
  return (
    <>
      <SEO title="Not Found" />
      <div className="flex h-full items-center justify-center">
        <div className="select-none text-center">
          <div className="mt-1 mb-2 text-8xl text-neutral-700">404</div>
          <div className="text-sm text-neutral-400">잘못 찾아오셨어요.</div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
