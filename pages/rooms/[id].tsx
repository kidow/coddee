import { SEO } from 'components'
import type { NextPage } from 'next'
import { ArrowSmallUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { useObjectState } from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

interface State {
  content: string
  isLoading: boolean
}

const RoomIdPage: NextPage = () => {
  const [{ content, isLoading }, setState, onChange] = useObjectState<State>({
    content: '',
    isLoading: false
  })
  const { query } = useRouter()

  const get = async () => {
    if (!query.id || typeof query.id !== 'string') return
  }

  const create = async () => {}

  useEffect(() => {
    get()
  }, [query.id])
  return (
    <>
      <SEO title="Javascript" />
      <div className="flex h-full flex-col divide-y">
        <header className="flex h-12 items-center px-5">
          <span className="font-semibold">Javascript</span>
        </header>
        <main className="flex-1 overflow-auto">asd</main>
        <footer className="flex items-center gap-3 py-3 px-5">
          <TextareaAutosize
            value={content}
            name="content"
            onChange={onChange}
            className="flex-1 resize-none rounded-lg border border-neutral-200 px-2 py-1"
            spellCheck={false}
          />
          <button className="rounded-full border bg-white p-1.5">
            <CodeBracketIcon className="h-5 w-5 text-neutral-400" />
          </button>
          <button className="rounded-full bg-orange-500 p-1.5">
            <ArrowSmallUpIcon className="h-5 w-5 text-neutral-50" />
          </button>
        </footer>
      </div>
    </>
  )
}

export default RoomIdPage
