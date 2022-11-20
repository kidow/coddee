import { ContentEditable } from 'components'
import type { NextPage } from 'next'
import { useObjectState } from 'services'

interface State {
  content: string
}

const TestPage: NextPage = () => {
  const [{ content }, setState] = useObjectState<State>({
    content: ''
  })
  return (
    <div className="flex h-full flex-col-reverse p-4">
      <ContentEditable
        value={content}
        onInput={(e) => setState({ content: e.target.innerText })}
        autoFocus
      />

      <button
        onClick={() => console.log(content)}
        className="fixed bottom-2 left-2"
      >
        test
      </button>
    </div>
  )
}

export default TestPage
