import { reactive } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const toasts = reactive<Toast[]>([])
let nextId = 1

function addToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  const id = nextId++
  toasts.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
}

function removeToast(id: number) {
  const idx = toasts.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error', 6000),
    warning: (msg: string) => addToast(msg, 'warning', 5000),
    info: (msg: string) => addToast(msg, 'info'),
    remove: removeToast,
  }
}
