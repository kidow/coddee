import type { FC } from 'react'

export interface Props {}
interface State {}

const Divider: FC<Props> = () => {
  return <hr className="my-2 dark:border-neutral-600" />
}

export default Divider
