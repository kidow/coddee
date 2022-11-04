import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import type { FC } from 'react'
import { copyText, EventListener, toast } from 'services'

export interface Props extends NTable.Opengraphs {}
interface State {}

const ChatOpengraph: FC<Props> = ({
  title,
  description,
  url,
  site_name,
  image
}) => {
  return (
    <div className="mt-1 space-y-1 rounded border-l-4 border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-900 dark:bg-neutral-800">
      <div className="font-semibold text-blue-500">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          {title}
        </a>
      </div>
      <div className="text-sm text-neutral-700 dark:text-neutral-400">
        {description}
      </div>
      <div className="group/opengraph relative inline-block">
        <img
          src={image}
          alt=""
          className="max-w-xs cursor-pointer rounded-lg"
          tabIndex={-1}
          onClick={() => EventListener.emit('image', { url: image })}
        />
        <ul className="absolute right-2 top-2 hidden rounded border bg-white p-0.5 group-hover/opengraph:flex dark:border-neutral-800 dark:bg-neutral-900">
          <li>
            <button
              onClick={() => window.open(url)}
              className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                copyText(url)?.then(() => toast.success('복사되었습니다.'))
              }
              className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ChatOpengraph
