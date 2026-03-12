import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

const visible = ref(false)
const options = ref<ConfirmOptions>({ message: '' })
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirmDialog() {
  function confirm(opts: ConfirmOptions | string): Promise<boolean> {
    const normalised = typeof opts === 'string' ? { message: opts } : opts
    options.value = normalised
    visible.value = true
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    visible.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function handleCancel() {
    visible.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return { visible, options, confirm, handleConfirm, handleCancel }
}
