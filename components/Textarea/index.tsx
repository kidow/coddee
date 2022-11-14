import { forwardRef, useEffect } from 'react'
import { MentionsInput, Mention } from 'react-mentions'
import type { MentionsInputProps } from 'react-mentions'
import { useRecoilState } from 'recoil'
import { userListState } from 'services'
import classnames from 'classnames'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props extends Omit<MentionsInputProps, 'children'> {}
interface State {}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ ...props }, ref) => {
  const [userList, setUserList] = useRecoilState(userListState)
  const supabase = useSupabaseClient()

  const get = async () => {
    if (!!userList.length) return
    const { data, error } = await supabase
      .from('users')
      .select('id, avatar_url, nickname')
      .order('nickname', { ascending: true })
    if (error) {
      console.error(error)
      return
    }
    setUserList(
      data
        ? data.map((item) => ({
            id: item.id,
            avatarUrl: item.avatar_url,
            display: item.nickname
          }))
        : []
    )
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <MentionsInput
      {...props}
      allowSuggestionsAboveCursor
      forceSuggestionsAboveCursor
      spellCheck={false}
      autoComplete="off"
      customSuggestionsContainer={(children) => (
        <ul
          className="max-h-48 w-80 overflow-auto overscroll-contain border py-2 shadow-md dark:border-neutral-700 dark:bg-neutral-800"
          role="listbox"
        >
          {children}
        </ul>
      )}
      inputRef={ref}
    >
      <Mention
        trigger="@"
        data={userList}
        appendSpaceOnAdd
        renderSuggestion={(
          suggestion,
          search,
          highlightedDisplay,
          index,
          focused
        ) => (
          <li
            tabIndex={-1}
            role="option"
            className={classnames('flex h-8 items-center gap-2 px-4', {
              'bg-blue-600 text-white dark:bg-blue-500': focused
            })}
          >
            <img
              src={userList[index].avatarUrl}
              alt=""
              className="h-5 w-5 rounded"
            />
            <span className="text-sm font-bold">{suggestion.display}</span>
          </li>
        )}
        className="rounded bg-blue-100 dark:bg-cyan-600"
      />
    </MentionsInput>
  )
})

export default Textarea
