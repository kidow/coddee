import { SEO, Spinner } from 'components'
import type { NextPage } from 'next'
import { ArrowSmallUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { useObjectState, useUser } from 'services'
import TextareaAutosize from 'react-textarea-autosize'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Modal } from 'containers'
import classnames from 'classnames'

interface State {
  content: string
  isLoading: boolean
  isCodeEditorOpen: boolean
}

const RoomIdPage: NextPage = () => {
  const [{ content, isLoading, isCodeEditorOpen }, setState, onChange] =
    useObjectState<State>({
      content: '',
      isLoading: false,
      isCodeEditorOpen: false
    })
  const { query } = useRouter()
  const [user] = useUser()

  const get = async () => {
    if (!query.id || typeof query.id !== 'string') return
  }

  const create = async () => {
    setState({ isLoading: true })
    setTimeout(() => {
      setState({ isLoading: false })
    }, 3000)
  }

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
            onKeyDown={(e) => {
              if (!e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                create()
              }
            }}
          />
          <button
            onClick={() => setState({ isCodeEditorOpen: true })}
            className="rounded-full border bg-white p-1.5"
          >
            <CodeBracketIcon className="h-5 w-5 text-neutral-400" />
          </button>
          <button
            className="rounded-full bg-blue-500 p-1.5 duration-150 hover:bg-blue-400 active:bg-blue-600 disabled:bg-neutral-400"
            disabled={isLoading}
            onClick={create}
          >
            {isLoading ? (
              <Spinner className="h-5 w-5 text-neutral-50" />
            ) : (
              <ArrowSmallUpIcon className="h-5 w-5 text-neutral-50" />
            )}
          </button>
        </footer>
      </div>
      <Modal.CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setState({ isCodeEditorOpen: false })}
      />
    </>
  )
}

export default RoomIdPage
