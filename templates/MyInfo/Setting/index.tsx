import { Form, Radio, Select } from 'components'
import type { FC } from 'react'
import { useObjectState } from 'services'

export interface Props {}
interface State {
  theme: string
}

const MyInfoSetting: FC<Props> = () => {
  const [{ theme }, setState] = useObjectState<State>({
    theme: window.localStorage.getItem('theme') || 'light'
  })
  return (
    <section className="space-y-4 p-6">
      <Form.Item label="테마">
        <Radio
          value={theme}
          onChange={(value) => {
            window.localStorage.setItem('theme', value)
            if (value === 'dark') document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
            setState({ theme: value })
          }}
          options={[
            { name: 'Light', value: 'light' },
            { name: 'Dark', value: 'dark' }
          ]}
        />
      </Form.Item>
    </section>
  )
}

export default MyInfoSetting
