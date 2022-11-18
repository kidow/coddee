import { memo } from 'react'
import type { FC } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface Props {
  title?: string
  description?: string
  image?: string
  ldJson?: any
  noSEO?: boolean
  keywords?: string
}

const SEO: FC<Props> = ({
  title,
  description = '개발자들끼리만 모여서 수다 떠는 곳',
  image = 'https://files.kidow.me/image/coddee.png',
  ldJson,
  noSEO = false,
  keywords
}) => {
  const { asPath } = useRouter()
  const TITLE = title ? `${title} - 커디` : '개발자 채팅방 - 커디'
  const URL = 'https://coddee.dev' + decodeURI(asPath)
  if (ldJson) ldJson['@context'] = 'https://schema.org'
  if (noSEO)
    return (
      <Head>
        <title>{TITLE}</title>
      </Head>
    )
  return (
    <Head>
      <title>{TITLE}</title>
      <meta name="description" content={description} />
      {!!keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={URL} />
      <meta property="og:image" content={image} />
      <meta property="twitter:title" content={TITLE} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:domain" content={URL} />
      {ldJson && (
        <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
      )}
    </Head>
  )
}

export default memo(SEO)
