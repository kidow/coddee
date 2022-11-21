import {
  Square3Stack3DIcon,
  Squares2X2Icon,
  StopIcon
} from '@heroicons/react/24/outline'
import { SEO } from 'components'
import type { NextPage } from 'next'
import { useObjectState } from 'services'
import Link from 'next/link'

interface State {
  column: number
}

const PostsPage: NextPage = () => {
  const [{ column }, setState] = useObjectState<State>({ column: 2 })
  return (
    <>
      <SEO title="포스트" />
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-5 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="font-semibold">포스트</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setState({ column: column === 3 ? 1 : column + 1 })
              }
            >
              {column === 1 && <StopIcon className="h-5 w-5" />}
              {column === 2 && <Squares2X2Icon className="h-5 w-5" />}
              {column === 3 && <Square3Stack3DIcon className="h-5 w-5" />}
            </button>
          </div>
        </header>
        <main className="flex-1">
          {Array.from({ length: 24 }).map((_, key) => (
            <Link href="/" key={key}>
              <a></a>
            </Link>
          ))}
        </main>
      </div>
    </>
  )
}

export default PostsPage
