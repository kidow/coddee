import { Modal } from 'containers'
import { Fragment } from 'react'
import type { FC } from 'react'
import { REGEXP, useObjectState } from 'services'

export interface Props {
  content: string
  updatedAt: string
}
interface State {
  isProfileOpen: boolean
  userId: string
}

const MessageParser: FC<Props> = ({ content, updatedAt }) => {
  const [{ isProfileOpen, userId }, setState] = useObjectState<State>({
    isProfileOpen: false,
    userId: ''
  })
  return (
    <>
      {content.split('\n').map((value, key, arr) => (
        <Fragment key={key}>
          {value.split(' ').map((text, i, { length }) => {
            const space = i !== length - 1 ? ' ' : ''
            if (REGEXP.EMAIL.test(text)) {
              return (
                <Fragment key={i}>
                  <a
                    href={`mailto:${text}`}
                    className="text-blue-500 hover:underline dark:text-blue-400"
                  >
                    {text}
                  </a>
                  {space}
                </Fragment>
              )
            }
            if (REGEXP.URL.test(text)) {
              return (
                <Fragment key={i}>
                  <a
                    target="_blank"
                    rel="nofollow noreferrer noopener"
                    href={text}
                    className="text-blue-500 hover:underline dark:text-blue-400"
                  >
                    {text}
                  </a>
                  {space}
                </Fragment>
              )
            }
            if (REGEXP.MENTION.test(text)) {
              return (
                <Fragment key={i}>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setState({
                        isProfileOpen: true,
                        userId: text.slice(-37, -1)
                      })
                    }}
                    className="cursor-pointer rounded bg-blue-100 px-0.5 py-px text-indigo-500 hover:underline dark:bg-cyan-600 dark:text-cyan-50"
                  >
                    @{text.replace(REGEXP.MENTION, (t) => t.slice(2, -39))}
                  </span>
                  {space}
                </Fragment>
              )
            }
            return (
              <Fragment key={i}>
                {text}
                {space}
              </Fragment>
            )
          })}
          {!!updatedAt && key === arr.length - 1 && (
            <span className="ml-1 text-2xs text-neutral-400">(수정됨)</span>
          )}
          {key !== arr.length - 1 && <br />}
        </Fragment>
      ))}
      <Modal.Profile
        isOpen={isProfileOpen}
        onClose={() => setState({ isProfileOpen: false, userId: '' })}
        userId={userId}
      />
    </>
  )
}

export default MessageParser
