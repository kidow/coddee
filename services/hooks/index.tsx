import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { EventListener, themeState, userState } from 'services'
import { useRecoilState } from 'recoil'
import type { SetterOrUpdater } from 'recoil'

export { default as useChatList } from './useChatList'

export function useObjectState<T>(
  initialObject: T
): [
  T,
  (obj: Partial<T>, callback?: (state: T) => void) => void,
  (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void,
  (keys?: Array<keyof T>) => void
] {
  const [state, setState] = useState<T>(initialObject)
  const callbackRef = useRef<(state: T) => void>()
  const isFirstCallbackCall = useRef<boolean>(true)

  const onChange = useCallback(
    (obj: Partial<T>, callback?: (state: T) => void) => {
      callbackRef.current = callback
      setState((prevState) => ({ ...prevState, ...obj }))
    },
    [state]
  )

  const onEventChange = useCallback(
    ({
      target: { name, value }
    }: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >): void => setState((prevState) => ({ ...prevState, [name]: value })),
    [state]
  )

  const arrayToObject = (keys: Array<keyof T>): T => {
    if (!keys.length) return initialObject
    const initial: any = {}
    keys.reduce((acc, cur) => (initial[cur] = initialObject[cur]), initial)
    return initial
  }
  const resetState = (keys?: Array<keyof T>) =>
    keys
      ? setState((prevState) => ({ ...prevState, ...arrayToObject(keys) }))
      : setState(initialObject)

  useEffect(() => {
    if (isFirstCallbackCall.current) {
      isFirstCallbackCall.current = false
      return
    }
    callbackRef.current?.(state)
  }, [state])

  return [state, onChange, onEventChange, resetState]
}

export const useUser = (): [
  NTable.Users | null,
  SetterOrUpdater<NTable.Users | null>
] => {
  const [user, setUser] = useRecoilState(userState)
  return [user, setUser]
}

export function useIntersectionObserver<T extends HTMLElement>(): [
  RefObject<T>,
  boolean
] {
  const ref = useRef<T>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry>()

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setEntry(entry))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref.current])

  return [ref, entry?.isIntersecting || false]
}

export const useTheme = () => {
  const [theme, setTheme] = useRecoilState(themeState)

  const onTheme = ({ detail }: any) => {
    window.localStorage.setItem('theme', detail)
    setTheme(detail)
  }

  useEffect(() => {
    setTheme(window.localStorage.getItem('theme') as 'light' | 'dark')

    EventListener.add('theme', onTheme)
    return () => EventListener.remove('theme', onTheme)
  }, [])

  return theme
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  id?: string
): void {
  const listener = (event: MouseEvent | TouchEvent) => {
    const el = ref?.current
    if (
      !el ||
      el.contains(event.target as Node) ||
      id === (event.target as HTMLElement).id
    )
      return
    handler(event)
  }
  useEffect(() => {
    document.addEventListener('mouseup', listener)
    return () => {
      document.removeEventListener('mouseup', listener)
    }
  }, [ref, handler])
}
