import { captureException } from '@sentry/nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import urlMetadata from 'url-metadata'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (!req.body.url) {
    res.json({ success: false, message: 'req.body.url is missing.' })
    return
  }
  try {
    const result = await urlMetadata(req.body.url)
    res.json({ success: true, data: result })
  } catch (err: any) {
    console.log(err)
    captureException(err)
    res.json({ success: false, message: err?.message })
  }
}
