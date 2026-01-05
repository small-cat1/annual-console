import { createApp, ref, h } from 'vue'
import ToastComponent from './index.vue'

let toastInstance = null
let toastContainer = null

const createToast = () => {
  if (toastContainer) {
    document.body.removeChild(toastContainer)
  }
  
  toastContainer = document.createElement('div')
  document.body.appendChild(toastContainer)
  
  const visible = ref(false)
  const message = ref('')
  const type = ref('info')
  const duration = ref(2000)
  
  const app = createApp({
    setup() {
      return () => h(ToastComponent, {
        modelValue: visible.value,
        message: message.value,
        type: type.value,
        duration: duration.value,
        'onUpdate:modelValue': (val) => {
          visible.value = val
        }
      })
    }
  })
  
  app.mount(toastContainer)
  
  return {
    show(options) {
      if (typeof options === 'string') {
        options = { message: options }
      }
      message.value = options.message || ''
      type.value = options.type || 'info'
      duration.value = options.duration ?? 2000
      visible.value = true
    },
    hide() {
      visible.value = false
    }
  }
}

const getToast = () => {
  if (!toastInstance) {
    toastInstance = createToast()
  }
  return toastInstance
}

// 导出函数
export const showToast = (options) => {
  getToast().show(options)
}

export const showSuccess = (message) => {
  getToast().show({ message, type: 'success' })
}

export const showError = (message) => {
  getToast().show({ message, type: 'error' })
}

export const showWarning = (message) => {
  getToast().show({ message, type: 'warning' })
}

export const hideToast = () => {
  getToast().hide()
}

export default {
  showToast,
  showSuccess,
  showError,
  showWarning,
  hideToast
}