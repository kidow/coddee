import { Fragment, useMemo } from 'react'
import type { FC } from 'react'
import { REGEXP, useObjectState } from 'services'
import dynamic from 'next/dynamic'
import { Modal } from 'containers'

export interface Props {
  value: string
}
interface State {
  isProfileOpen: boolean
  userId: string
}

const TextParser: FC<Props> = ({ value }) => {
  const [{ isProfileOpen, userId }, setState] = useObjectState<State>({
    isProfileOpen: false,
    userId: ''
  })

  const isMatched: boolean = useMemo(
    () => REGEXP.MENTION.test(value) || REGEXP.URL.test(value),
    [value]
  )
  if (!isMatched) return <>{value}</>
  return (
    <>
      {value.split(' ').map((item, key, arr) => {
        const space = key !== arr.length - 1 && <>&nbsp;</>
        if (REGEXP.URL.test(item)) {
          return (
            <Fragment key={key}>
              <a
                target="_blank"
                rel="nofollow noreferrer noopener"
                href={item}
                className="text-blue-500 hover:underline dark:text-blue-400"
              >
                {item}
              </a>
              {space}
            </Fragment>
          )
        }
        if (REGEXP.MENTION.test(item)) {
          return (
            <Fragment key={key}>
              <span
                onClick={() =>
                  setState({ isProfileOpen: true, userId: item.slice(-37, -1) })
                }
                className="cursor-pointer rounded bg-blue-100 px-0.5 py-px text-indigo-500 hover:underline dark:bg-cyan-600 dark:text-cyan-50"
              >
                @{item.replace(REGEXP.MENTION, (v) => v.slice(2, -39))}
              </span>
              {space}
            </Fragment>
          )
        }
        return (
          <Fragment key={key}>
            {item}
            {space}
          </Fragment>
        )
      })}
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
    </>
  )
}

export default dynamic(
  () => Promise.resolve((props: Props) => <TextParser {...props} />),
  { ssr: false }
)
