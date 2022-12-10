import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { memo, useEffect } from 'react'
import type { FC } from 'react'
import { EventListener, toast, useObjectState } from 'services'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import classnames from 'classnames'

export interface Props
  extends Pick<NTable.Opengraphs, 'title' | 'description' | 'url' | 'image'> {}
interface State {
  isLoaded: boolean
  isStretched: boolean
}

const ChatOpengraph: FC<Props> = ({ title, description, url, image }) => {
  const [{ isLoaded, isStretched }, setState] = useObjectState<State>({
    isLoaded: false,
    isStretched: false
  })

  useEffect(() => {
    const img = new Image()
    img.addEventListener('load', function () {
      setState({
        isStretched: this.naturalHeight === this.naturalWidth,
        isLoaded: true
      })
    })
    img.src = image || ''
  }, [])

  if (!isLoaded) return null
  return (
    <div
      className={classnames(
        'mt-1 space-y-1 rounded border-l-4 border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-900 dark:bg-neutral-800',
        { 'flex gap-3': isStretched }
      )}
    >
      <div className={classnames({ 'flex-1': isStretched })}>
        <div className="font-semibold text-blue-500">
          <a
            href={url || ''}
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
      </div>
      <div className="group/opengraph relative inline-block">
        <img
          src={image || ''}
          alt=""
          draggable={false}
          className={classnames('max-w-xs cursor-zoom-in rounded-lg', {
            'h-20 w-20': isStretched
          })}
          tabIndex={-1}
          onClick={() => EventListener.emit('image', { url: image })}
        />
        {!isStretched && (
          <ul className="absolute right-2 top-2 hidden rounded border bg-white p-0.5 group-hover/opengraph:flex dark:border-neutral-800 dark:bg-neutral-900">
            <li>
              <button
                onClick={() => window.open(url || '')}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
            </li>
            <li>
              <CopyToClipboard
                onCopy={() => toast.success('복사되었습니다.')}
                text={url || ''}
              >
                <button className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300">
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </CopyToClipboard>
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

export default memo(ChatOpengraph)
