import { useCallback, useEffect, useRef } from 'react'
import type { ChangeEvent, FC, DetailedHTMLProps, HTMLAttributes } from 'react'
import classnames from 'classnames'
import { captureException, EventListener, useUser } from 'services'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Tribute } from 'components'

export interface Props
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  value: string
  onInput: (e: ChangeEvent<HTMLDivElement>) => void
  autoFocus?: boolean
}
interface State {}

const ContentEditable: FC<Props> = ({ value, autoFocus, ...props }) => {
  const supabase = useSupabaseClient()
  const [user] = useUser()
  const ref = useRef<HTMLDivElement>(null)

  const onFocus = useCallback(() => {
    if (!value.length) {
      ref.current?.focus()
      return
    }

    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(ref.current as Node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [value])

  useEffect(() => {
    const tribute = new Tribute({
      // @ts-ignore
      values: async function (text: string, cb: any) {
        const { data, error } = await supabase
          .from('users')
          .select()
          .like('nickname', `%${text}%`)
          .order('nickname', { ascending: true })
          .limit(10)
        if (error) {
          captureException(error)
          cb([])
          return
        }
        cb(data)
      },
      requireLeadingSpace: true,
      fillAttr: 'nickname',
      lookup: 'nickname',
      menuItemTemplate: function (item) {
        return `
        <img src="${item.original.avatar_url}" />
        <div>
          <div class="nickname">${item.original.nickname} ${
          item.original.id === user?.id ? '(나)' : ''
        }</div>
          <div class="email">${item.original.email}</div>
        </div>
      `
      }
    })
    tribute.attach(ref.current)
  }, [])

  useEffect(() => {
    EventListener.add('contenteditable:focus', onFocus)
    return () => EventListener.remove('contenteditable:focus', onFocus)
  }, [value])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  return (
    <div
      {...props}
      className={classnames(
        'empty:before:text-neutral-400 empty:before:content-[attr(placeholder)] focus:outline-none',
        props.className
      )}
      ref={ref}
      contentEditable
      spellCheck={false}
    />
  )
}

ContentEditable.defaultProps = {
  placeholder: '서로를 존중하는 매너를 보여주세요.'
}

export default ContentEditable
