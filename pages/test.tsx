import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { NextPage } from 'next'
import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { captureException, useObjectState, useUser } from 'services'

interface State {
  isMentionOpen: boolean
  userList: NTable.Users[]
  content: string
}

const TestPage: NextPage = () => {
  const [{ isMentionOpen, userList, content }, setState] =
    useObjectState<State>({
      isMentionOpen: false,
      userList: [],
      content: ''
    })
  const supabase = useSupabaseClient()
  const [user] = useUser()
  const ref = useRef<HTMLDivElement>(null)

  const getUsers = async () => {
    if (!!userList.length) return
    const { data, error } = await supabase.from('users').select()
    if (error) {
      captureException(error)
      return
    }
    setState({ userList: data })
  }

  const onFocus = () => {
    if (!content.length) {
      ref.current?.focus()
      return
    }

    const selection = window.getSelection()
    if (!selection) return
    const newRange = document.createRange()
    newRange.selectNodeContents(ref.current as Node)
    newRange.collapse(false)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }

  useEffect(() => {
    getUsers()
  }, [])

  useEffect(() => {
    if (!content) return
    const selection = window.getSelection()
    if (!selection) return
    const range = selection.getRangeAt(0)
  }, [content])
  return (
    <div className="flex h-full flex-col-reverse p-4">
      <div className="relative">
        <div
          contentEditable
          onInput={(e: ChangeEvent<HTMLDivElement>) => {
            setState({ content: e.target.innerText })
          }}
          ref={ref}
          placeholder="서로를 존중하는 매너를 보여주세요."
          className="empty:before:text-neutral-400 empty:before:content-[attr(placeholder)] focus:outline-none"
          spellCheck={false}
        />
        <div className="absolute bottom-7 top-auto left-0 z-20 w-80">
          <ul className="max-h-96 overflow-y-auto rounded-xl border py-2">
            {userList.map((item) => (
              <li
                key={item.id}
                tabIndex={0}
                className="flex h-8 cursor-pointer items-center px-4 text-sm hover:bg-sky-700 hover:text-neutral-50"
              >
                <img src={item.avatar_url} alt="" className="h-5 w-5 rounded" />
                <span className="ml-3 font-semibold">{item.nickname}</span>
                {user?.id === item.id && (
                  <span className="ml-1 text-neutral-400">(나)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className="fixed bottom-4 left-4" onClick={onFocus}>
        focus
      </button>
    </div>
  )
}

export default TestPage
