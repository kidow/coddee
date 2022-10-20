import classNames from 'classnames'
import type { FC, ReactNode } from 'react'

interface Props {
  list: Array<{
    tag?: string
    title?: string
    content: ReactNode
  }>
}

const Timeline: FC<Props> = ({ list }) => {
  return (
    <div className="relative">
      {list.map((item, key) => (
        <div
          key={key}
          className={classNames(
            "relative -top-2 flex gap-5 pl-5 pb-10 after:absolute after:-left-[5px] after:top-1.5 after:z-10 after:h-3 after:w-3 after:rounded-full after:border-2 after:border-blue-600 after:bg-white after:content-[''] last:pb-0",
            {
              "before:absolute before:top-2 before:-bottom-2 before:left-0 before:border-r before:border-dashed before:border-neutral-300 before:content-['']":
                key !== list.length - 1
            }
          )}
        >
          {!!item.tag && (
            <div className="mt-1 whitespace-nowrap text-xs text-neutral-400">
              {item.tag}
            </div>
          )}
          <div>
            <h2
              className={classNames('font-medium', {
                'mb-4': !!item.content
              })}
            >
              {item.title}
            </h2>
            {item.content}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Timeline
