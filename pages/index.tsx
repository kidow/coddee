import { SEO } from 'components'
import type { NextPage } from 'next'

interface State {}

const HomePage: NextPage = () => {
  return (
    <>
      <SEO />
      <div className="container mx-auto"></div>
    </>
  )
}

export default HomePage
