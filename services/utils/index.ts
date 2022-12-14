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

class Toast {
  private emit(message: string, type: NToast.Type) {
    EventListener.emit<NToast.Emit>('toast', { message, type })
  }
  success(message: string) {
    this.emit(message, 'success')
  }
  info(message: string) {
    this.emit(message, 'info')
  }
  warn(message: string) {
    this.emit(message, 'warn')
  }
  error(message: string) {
    this.emit(message, 'error')
  }
}

export const toast = new Toast()

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

export const backdrop = (open: boolean) => EventListener.emit('backdrop', open)
