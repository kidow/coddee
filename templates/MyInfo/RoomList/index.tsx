import { Button, Input } from 'components'
import { useEffect } from 'react'
import type { FC } from 'react'
import {
  base64ToFile,
  fileToBase64,
  supabase,
  useBackdrop,
  useObjectState
} from 'services'
import { PlusIcon } from '@heroicons/react/24/outline'

export interface Props {}
interface State {
  logoUrl: string
  name: string
  list: NTable.Rooms[]
}

const MyInfoRoomList: FC<Props> = () => {
  const [{ logoUrl, name, list }, setState, onChange] = useObjectState<State>({
    logoUrl: '',
    name: '',
    list: []
  })
  const backdrop = useBackdrop()

  const onUploadLogo = (index?: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (!input.files) return
      const file = input.files[0]
      const base64 = await fileToBase64(file)
      if (index !== undefined)
        setState({
          list: [
            ...list.slice(0, index),
            { ...list[index], logo_url: base64 },
            ...list.slice(index + 1)
          ]
        })
      else setState({ logoUrl: base64 })
    }
    input.click()
  }

  const get = async () => {
    const { data, error } = await supabase.from('rooms').select('*')
    if (error) console.error(error)
    setState({ list: data || [] })
  }

  const create = async () => {
    backdrop(true)
    const file = base64ToFile(logoUrl)
    const { error: uploadError, data } = await supabase.storage
      .from('rooms')
      .upload(`${new Date().getTime()}.png`, file)
    if (uploadError) {
      console.error(uploadError)
      return
    }
    const { error: insertError } = await supabase.from('rooms').insert({
      logo_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rooms/${data.path}`,
      name
    })
    backdrop(false)
    if (insertError) {
      console.error(insertError)
      return
    }
    setState({ logoUrl: '', name: '' })
    get()
  }

  const update = async (index: number) => {
    backdrop(true)
    const item = list[index]
    const { error } = await supabase
      .from('rooms')
      .update({ logo_url: item.logo_url, name: item.name })
      .eq('id', item.id)
    backdrop(false)
    if (error) console.error(error)
  }

  const remove = async (index: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    const prompt = window.prompt("'삭제합니다'를 입력하세요.")
    if (prompt !== '삭제합니다') return
    backdrop(true)
    const item = list[index]
    const { error } = await supabase.from('rooms').delete().eq('id', item.id)
    backdrop(false)
    if (error) console.error(error)
    else get()
  }

  useEffect(() => {
    get()
  }, [])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-4">
        <span
          onClick={() => onUploadLogo()}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-neutral-200"
        >
          {logoUrl ? (
            <img src={logoUrl} className="h-full w-full" alt="" />
          ) : (
            <PlusIcon className="h-5 w-5 text-neutral-200" />
          )}
        </span>
        <Input
          autoComplete="off"
          spellCheck={false}
          value={name}
          name="name"
          onChange={onChange}
          className="rounded border py-1 px-2"
        />
        <Button onClick={create} disabled={!logoUrl || !name}>
          추가
        </Button>
      </div>
      <ul className="space-y-4">
        {list.map((item, key) => (
          <li key={key} className="flex items-center gap-4">
            <img
              src={item.logo_url}
              onClick={() => onUploadLogo(key)}
              alt=""
              className="h-10 w-10 cursor-pointer rounded"
            />
            <div className="flex-1">
              <input
                value={item.name}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) =>
                  setState({
                    list: [
                      ...list.slice(0, key),
                      { ...item, name: e.target.value },
                      ...list.slice(key + 1)
                    ]
                  })
                }
                className="rounded border py-1 px-2"
              />
            </div>
            <button className="text-sm" onClick={() => update(key)}>
              수정
            </button>
            <button
              className="text-sm text-red-500"
              onClick={() => remove(key)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MyInfoRoomList
