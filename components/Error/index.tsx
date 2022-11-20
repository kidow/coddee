import type { FC } from 'react'

export interface Props {}
interface State {}

const Error: FC<Props> = () => {
  return (
    <div className="flex h-screen select-none items-center justify-center text-center">
      <div>
        <div className="text-7xl">500 Server Error</div>
        <div className="mt-4 text-xl text-neutral-600">
          죄송합니다. 에러가 발생했습니다.
        </div>
        <div className="mt-2 text-neutral-600">
          문제가 지속된다면 문의 부탁드립니다.
        </div>
      </div>
    </div>
  )
}

export default Error
