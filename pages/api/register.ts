import { captureException } from '@sentry/nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { WebClient } from '@slack/web-api'

const web = new WebClient(process.env.NEXT_PUBLIC_SLACK_TOKEN)

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (!req.body.email) {
    res.json({ success: false, message: 'No Email' })
    return
  }
  try {
    await web.chat.postMessage({
      text: `[가입] ${req.body.email}`,
      channel: 'coddee-bot'
    })
    res.json({ success: true })
  } catch (err: any) {
    console.log(err)
    captureException(err)
    res.json({ success: false, message: err?.message })
  }
}
