import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { EventListener, userState } from 'services'
import { useRecoilState } from 'recoil'
import type { SetterOrUpdater } from 'recoil'

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

export const useBackdrop = () => (open: boolean) =>
  EventListener.emit('backdrop', { detail: { open } })

export const useUser = (): [
  NTable.Users | null,
  SetterOrUpdater<NTable.Users | null>
] => {
  const [user, setUser] = useRecoilState(userState)
  return [user, setUser]
}
