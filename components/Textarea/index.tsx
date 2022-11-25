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

export interface Props extends ReactQuillProps {
  onEnter?: (value: string) => void
  onKeyDown?: () => void
}
interface State {}

const Textarea: FC<Props> = ({ id, onEnter, ...props }) => {
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
    if (!ref.current) return
    range.selectNodeContents(ref.current.editor!.root)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [ref])

  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.shiftKey && e.keyCode === 13) {
      if (typeof props.value === 'string' && onEnter) onEnter(props.value)
    } else if (props.onKeyDown) props.onKeyDown()
  }

  const onInsertItem = ({ detail }: any) => {
    if (!ref.current) return
    ref.current.editor
      ?.getModule('mention')
      .insertItem(
        { denotationChar: '@', id: detail?.userId, value: detail?.username },
        true
      )
  }

  const modules: StringMap = useMemo(
    () => ({
      keyboard: {
        bindings: {
          enter: {
            key: 13,
            shiftKey: false,
            handler: () => {}
          }
        }
      },
      toolbar: false,
      'emoji-toolbar': false,
      'emoji-textarea': false,
      'emoji-shortname': {
        onOpen: () => {
          if (
            !ref.current ||
            !ref.current.editor ||
            !ref.current.editor.root.parentElement
          )
            return
          const container =
            ref.current.editor.root.parentElement.getElementsByTagName('ul')[0]
          if (!container) return
          const selection = window.getSelection()
          if (!selection || selection.rangeCount === 0) return
          const range = selection.getRangeAt(0).cloneRange()
          range.collapse(true)
          const { y } = range.getClientRects()[0]
          if (window.innerHeight < y + 150) {
            container.style.bottom = '20px'
          }
        }
      },
      linkify: true,
      mention: {
        mentionDenotationChars: ['@'],
        source: async function (
          searchTerm: string,
          renderList: (data: any[], searchTerm: string) => void
        ) {
          const { data, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar_url')
            .like('nickname', `%${searchTerm}%`)
            .order('nickname', { ascending: true })
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
        maxChars: 5,
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
        `,
        defaultMenuOrientation: 'top'
      }
    }),
    []
  )

  const formats: string[] = useMemo(
    () => ['bold', 'italic', 'link', 'mention', 'emoji'],
    []
  )

  useEffect(() => {
    const init = () => {
      if (ref.current) {
        ref.current.editor?.root.setAttribute('spellcheck', 'false')
        ref.current.editor?.root.setAttribute('role', 'textbox')
        ref.current.editor?.root.setAttribute('tabindex', '0')
        return
      }
      setTimeout(init, 200)
    }
    init()
  }, [ref])

  useEffect(() => {
    if (!ref.current) return
    ref.current.editor?.root.addEventListener('keydown', onKeyDown)
    return () => {
      ref.current?.editor?.root.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, props.value])

  useEffect(() => {
    if (!id) return
    EventListener.add(`quill:focus:${id}`, onFocus)
    EventListener.add(`quill:insert:${id}`, onInsertItem)
    return () => {
      EventListener.remove(`quill:focus:${id}`, onFocus)
      EventListener.remove(`quill:insert:${id}`, onInsertItem)
    }
  }, [ref, id])
  return (
    <Editor
      {...props}
      // @ts-ignore
      forwardedRef={ref}
      modules={modules}
      formats={formats}
    />
  )
}

Textarea.defaultProps = {
  placeholder: '서로 존중하는 매너를 보여주세요.'
}

export default Textarea
