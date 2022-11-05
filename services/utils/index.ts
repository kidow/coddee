import { EventListener } from 'services'

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
  })
}

export const base64ToFile = (base64: string) => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  let u8arr = new Uint8Array(n)

  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], new Date().getTime().toString(), { type: mime })
}

export const toast = {
  success: (message: string) =>
    EventListener.emit<NToast.Emit>('toast', { message, type: 'success' }),
  info: (message: string) =>
    EventListener.emit<NToast.Emit>('toast', { message, type: 'info' }),
  warn: (message: string) =>
    EventListener.emit<NToast.Emit>('toast', { message, type: 'warn' }),
  error: (message: string) =>
    EventListener.emit<NToast.Emit>('toast', { message, type: 'error' })
}

export function throttle(func: Function, wait: number) {
  let waiting = false
  return function () {
    if (!waiting) {
      func.apply(this, arguments)
      waiting = true
      setTimeout(() => {
        waiting = false
      }, wait)
    }
  }
}

export const copyText = (text: string) => {
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined')
    return

  return window.navigator.clipboard.writeText(text)
}

export const backdrop = (open: boolean) => EventListener.emit('backdrop', open)
