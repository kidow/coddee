import { useEffect } from 'react'
import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import { Button, Input } from 'components'
import { supabase, useBackdrop, useObjectState } from 'services'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface Props {}
interface State {
  label: string
  value: string
  id: number
  template: string
  langaugeList: NTable.Languages[]
}

const MyInfoLanguageList: FC<Props> = () => {
  const [{ label, value, id, template, langaugeList }, setState, onChange] =
    useObjectState<State>({
      label: '',
      value: '',
      id: 0,
      template: '',
      langaugeList: []
    })
  const backdrop = useBackdrop()

  const get = async () => {
    const { data } = await supabase.from('languages').select('*').order('value')
    setState({ langaugeList: data || [] })
  }

  const create = async () => {
    if (!label || !value) return
    backdrop(true)
    const { error } = await supabase
      .from('languages')
      .insert({ label, value, template })
    backdrop(false)
    if (error) console.error(error)
    else {
      setState({ label: '', value: '', template: '' })
      get()
    }
  }

  const update = async () => {
    if (!label || !value) return
    backdrop(true)
    const { error } = await supabase
      .from('languages')
      .update({ label, value, template })
      .eq('id', id)
    backdrop(false)
    if (error) console.error(error)
    else {
      setState({ id: 0, label: '', value: '', template: '' })
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
            placeholder="Javascript"
            float={false}
            spellCheck={false}
            autoComplete="off"
            onChange={onChange}
          />
          <Input
            value={value}
            name="value"
            onChange={onChange}
            placeholder="javascript"
            spellCheck={false}
            autoComplete="off"
            float={false}
          />
          <button
            className="group"
            onClick={() => setState({ id: 0, value: '', label: '' })}
          >
            <XMarkIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700" />
          </button>
        </div>
        {!!id ? (
          <Button disabled={!label || !value} onClick={update} theme="primary">
            수정
          </Button>
        ) : (
          <Button disabled={!label || !value} onClick={create} theme="primary">
            등록
          </Button>
        )}
      </div>
      <div>
        <Editor
          height="300px"
          value={template}
          theme="vs-dark"
          language={value}
          className="text-lg"
          onChange={(template) => setState({ template })}
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
                    value: item.value,
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
                    value: item.value,
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
