import { SEO } from 'components'
import type { NextPage } from 'next'
import { Content } from 'templates'

interface State {}

const PrivacyPage: NextPage = () => {
  return (
    <>
      <SEO title="개인정보처리방침" />
      <Content.Privacy />
    </>
  )
}

export default PrivacyPage
