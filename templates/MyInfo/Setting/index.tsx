import { Button, Form, Radio } from 'components'
import type { FC } from 'react'
import { useSetRecoilState } from 'recoil'
import { themeState, useObjectState } from 'services'

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
  const setTheme = useSetRecoilState(themeState)

  const onAlarmChange = async () => {
    if (permission !== 'granted') {
      const result = await window.Notification.requestPermission()
      setState({ permission: result })
    }
  }

  const onThemeChange = (theme: string) => {
    window.localStorage.setItem('theme', theme)
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    setState({ theme })
    setTheme(theme as 'dark' | 'light')

    const currentScript = document.querySelector(
      'script[plugin-key="fa46598f-aa5e-46fc-be63-2d3e339383c5"]'
    )
    if (currentScript) {
      currentScript.remove()
      document.querySelector('.fb-plugin')?.remove()
    }
    let script = document.createElement('script')
    script.src = 'https://cdn.feedbank.app/plugin.js'
    script.defer = true
    script.setAttribute('plugin-key', 'fa46598f-aa5e-46fc-be63-2d3e339383c5')
    script.setAttribute('data-fb-position', 'middle-left')
    script.setAttribute(
      'data-fb-button-color',
      theme === 'dark' ? '#262626' : '#fafafa'
    )
    document.head.insertAdjacentElement('beforeend', script)
  }
  return (
    <section className="space-y-4 p-6">
      <Form.Item label="테마">
        <Radio
          value={theme}
          onChange={onThemeChange}
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
