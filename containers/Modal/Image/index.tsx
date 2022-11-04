import { useCallback, useEffect } from 'react'
import type { FC } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { EventListener, useObjectState } from 'services'
import classnames from 'classnames'

export interface Props {}
interface State {
  isOpen: boolean
  url: string
}

const ImageModal: FC<Props> = () => {
  const [{ isOpen, url }, setState] = useObjectState<State>({
    isOpen: false,
    url: ''
  })

  const onImage = useCallback(
    ({ detail }: any) =>
      setState({ isOpen: !!detail.url, url: detail.url || '' }),
    [isOpen]
  )

  useEffect(() => {
    EventListener.add('image', onImage)
    return () => EventListener.remove('image', onImage)
  }, [])
  return createPortal(
    <div
      className={classnames(
        'fixed inset-0 z-30 overflow-y-auto transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-labelledby="image-modal"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="flex min-h-screen items-end justify-center p-0 text-center md:block"
        onClick={() => setState({ isOpen: false })}
      >
        <div
          className={classnames(
            'fixed inset-0 bg-black transition-opacity duration-300',
            isOpen ? 'opacity-30' : 'opacity-0'
          )}
          aria-hidden="true"
        ></div>
        <div className="my-8 inline-block w-full overflow-hidden align-middle transition-all sm:px-8">
          <img
            src={url}
            alt=""
            className={classnames(
              'mx-auto select-none shadow-xl transition-all duration-300',
              isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default dynamic(() => Promise.resolve(() => <ImageModal />), {
  ssr: false
})
