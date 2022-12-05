import { Button, Form, Radio } from 'components'
import type { FC } from 'react'
import { EventListener, useObjectState } from 'services'

export interface Props {}
interface State {
  theme: string
  permission: NotificationPermission
}

const MyInfoSetting: FC<Props> = () => {
  const [{ theme, permission }, setState] = useObjectState<State>({
    theme: window.localStorage.getItem('theme') || 'light',
    permission: window.Notification.permission || 'default'
  })

  const onAlarmChange = async () => {
    if (permission !== 'granted') {
      const result = await window.Notification.requestPermission()
      setState({ permission: result })
    }
  }
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
      <Form.Item label="알림 여부">
        <Button
          size="sm"
          onClick={onAlarmChange}
          theme="primary"
          disabled={permission === 'granted'}
        >
          {permission === 'granted' ? '활성 중' : '활성화'}
        </Button>
      </Form.Item>
    </section>
  )
}

export default MyInfoSetting
