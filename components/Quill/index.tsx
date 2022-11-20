import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { FC } from 'react'
import dynamic from 'next/dynamic'
import type { ReactQuillProps } from 'react-quill'
import ReactQuill from 'react-quill'
import { Linkify } from 'quill-linkify'
import { captureException, EventListener } from 'services'
import type { StringMap } from 'quill'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const Editor = dynamic<ReactQuillProps>(
  async () => {
    const { default: RQ } = await import('react-quill')
    // @ts-ignore
    await Promise.all([import('quill-mention'), import('quill-emoji')])
    RQ.Quill.register('modules/linkify', Linkify)
    // @ts-ignore
    return ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />
  },
  { ssr: false }
)

export interface Props extends ReactQuillProps {}
interface State {}

const Textarea: FC<Props> = ({ id, ...props }) => {
  const ref = useRef<ReactQuill>()
  const supabase = useSupabaseClient()

  const onFocus = useCallback(() => {
    if (!props.value) {
      ref.current?.focus()
      return
    }

    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(ref.current as unknown as Node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [ref])

  const modules: StringMap = useMemo(
    () => ({
      toolbar: false,
      'emoji-toolbar': false,
      'emoji-textarea': false,
      'emoji-shortname': true,
      linkify: true,
      mention: {
        mentionDenotationChars: ['@'],
        // @ts-ignore
        source: async function (searchTerm: string, renderList) {
          const { data, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar_url')
            .like('nickname', `%${searchTerm}%`)
            .limit(10)
          if (error) {
            captureException(error)
            renderList([], searchTerm)
            return
          }
          renderList(
            data.map((item) => ({ ...item, value: item.nickname })),
            searchTerm
          )
        },
        maxChars: 8,
        renderLoading: () =>
          `<div class="ql-mention-loader">불러오는 중...</div>`,
        renderItem: (data: NTable.Users) => `
          <div class="ql-mention-item">
            <img src="${data.avatar_url}" alt="" />
            <div class="ql-mention-block">
              <div class="ql-mention-nickname">${data.nickname}</div>
              <div class="ql-mention-email">${data.email}</div>
            </div>
          </div>
        `
      }
    }),
    []
  )

  useEffect(() => {
    const check = () => {
      if (ref.current) {
        ref.current.editor?.root.setAttribute('spellcheck', 'false')
        ref.current.editor?.root.setAttribute('role', 'textbox')
        ref.current.editor?.root.setAttribute('tabindex', '0')
        return
      }
      setTimeout(check, 200)
    }
    check()
  }, [ref])

  useEffect(() => {
    if (!id) return
    EventListener.add(`quill:focus:${id}`, onFocus)
    return () => EventListener.remove(`quill:focus:${id}`, onFocus)
  }, [ref, id])
  return (
    <Editor
      {...props}
      // @ts-ignore
      forwardedRef={ref}
      modules={modules}
    />
  )
}

Textarea.defaultProps = {
  placeholder: '서로 존중하는 매너를 보여주세요.'
}

export default Textarea
