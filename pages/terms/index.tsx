import { SEO } from 'components'
import type { NextPage } from 'next'
import { Content } from 'templates'

interface State {}

const TermsPage: NextPage = () => {
  return (
    <>
      <SEO title="이용약관" />
      <Content.Terms />
    </>
  )
}

export default TermsPage
