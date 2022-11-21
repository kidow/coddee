import { Quill } from 'components'
import type { NextPage } from 'next'
import { useId } from 'react'
import { EventListener, useObjectState } from 'services'

interface State {
  value: string
}

const QuillPage: NextPage = () => {
  const [{ value }, setState] = useObjectState<State>({ value: '' })
  const id = useId()
  return (
    <>
      <div className="flex h-full flex-col-reverse p-4">
        <Quill
          id={id}
          value={value}
          onChange={(value) => setState({ value })}
        />
      </div>
      <button
        className="fixed bottom-2 left-2"
        onClick={() => {
          EventListener.emit(`quill:focus:${id}`)
          console.log(value)
        }}
      >
        Focus
      </button>
    </>
  )
}

export default QuillPage
