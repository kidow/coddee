import { useEffect } from 'react'
import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import { Button, Input } from 'components'
import { backdrop, toast, useObjectState } from 'services'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export interface Props {}
interface State {
  label: string
  language: string
  id: number
  template: string
  langaugeList: NTable.Languages[]
}

const MyInfoLanguageList: FC<Props> = () => {
  const [{ label, language, id, template, langaugeList }, setState, onChange] =
    useObjectState<State>({
      label: '',
      language: '',
      id: 0,
      template: '',
      langaugeList: []
    })
  const supabase = useSupabaseClient()

  const get = async () => {
    const { data } = await supabase.from('languages').select('*').order('value')
    setState({ langaugeList: data || [] })
  }

  const create = async () => {
    if (!label || !language) return
    backdrop(true)
    const { error } = await supabase
      .from('languages')
      .insert({ label, value: language, template })
    backdrop(false)
    if (error) console.error(error)
    else {
      toast.success('생성되었습니다.')
      setState({ label: '', language: '', template: '' })
      get()
    }
  }

  const update = async () => {
    if (!label || !language) return
    backdrop(true)
    const { error } = await supabase
      .from('languages')
      .update({ label, value: language, template })
      .eq('id', id)
    backdrop(false)
    if (error) console.error(error)
    else {
      toast.success('수정되었습니다.')
      setState({ id: 0, label: '', language: '', template: '' })
      get()
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    backdrop(true)
    const { error } = await supabase.from('languages').delete().eq('id', id)
    backdrop(false)
    if (error) console.log(error)
    else {
      toast.error('삭제되었습니다.')
      setState({ id: 0 })
      get()
    }
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <div className="space-y-4 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          <Input
            value={label}
            name="label"
            placeholder="Javascript:name"
            float={false}
            spellCheck={false}
            autoComplete="off"
            onChange={onChange}
          />
          <Input
            value={language}
            name="language"
            onChange={onChange}
            placeholder="javascript:value"
            spellCheck={false}
            autoComplete="off"
            float={false}
          />
          <button
            className="group"
            onClick={() => setState({ id: 0, language: '', label: '' })}
          >
            <XMarkIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700" />
          </button>
        </div>
        {!!id ? (
          <Button
            disabled={!label || !language}
            onClick={update}
            theme="primary"
          >
            수정
          </Button>
        ) : (
          <Button
            disabled={!label || !language}
            onClick={create}
            theme="primary"
          >
            등록
          </Button>
        )}
      </div>
      <div className="border dark:border-transparent">
        <Editor
          height="300px"
          value={template}
          theme={
            window.localStorage.getItem('theme') === 'dark'
              ? 'vs-dark'
              : 'light'
          }
          language={language}
          className="text-lg"
          onChange={(template) => setState({ template })}
          options={{ minimap: { enabled: false }, fontSize: 14 }}
        />
      </div>
      <ul className="space-y-4">
        {langaugeList.map((item) => (
          <li key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() =>
                  setState({
                    label: item.label || '',
                    id: item.id,
                    language: item.value,
                    template: item.template
                  })
                }
              >
                {item.label}
              </button>
              <button
                className="text-xs text-neutral-400"
                onClick={() =>
                  setState({
                    label: item.label || '',
                    id: item.id,
                    language: item.value,
                    template: item.template
                  })
                }
              >
                {item.value}
              </button>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="text-sm text-red-500"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MyInfoLanguageList
