export const add = (
  type: string,
  listener: EventListenerOrEventListenerObject
) => window.addEventListener(type, listener)

export const remove = (
  type: string,
  listener: EventListenerOrEventListenerObject
) => window.removeEventListener(type, listener)

export const once = (type: string, listener: any) => {
  const emitOnce = (event: any) => {
    listener(event)
    remove(type, emitOnce)
  }

  add(type, emitOnce)
}

export function emit<T>(type: string, detail?: T) {
  const event = new CustomEvent<T>(type, { detail })
  window.dispatchEvent(event)
}
