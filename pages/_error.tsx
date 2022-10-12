import type { NextPageContext } from 'next'
import type { FC } from 'react'

interface Props {
  statusCode: number
}
interface State {}

const ErrorPage: FC<Props> = ({ statusCode }) => {
  return <>Not Found</>
}

// @ts-ignore
ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
