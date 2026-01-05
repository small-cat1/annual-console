<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-wrapper">
        <div class="toast-content" :class="[type]">
          <span class="toast-icon">{{ iconMap[type] }}</span>
          <span class="toast-message">{{ message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // info, success, error, warning
    validator: (val) => ['info', 'success', 'error', 'warning'].includes(val)
  },
  duration: {
    type: Number,
    default: 2000
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)

const iconMap = {
  info: '💬',
  success: '✨',
  error: '❌',
  warning: '⚠️'
}

let timer = null

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val && props.duration > 0) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        visible.value = false
        emit('update:modelValue', false)
      }, props.duration)
    }
  }
)
</script>

<style lang="scss" scoped>
.toast-wrapper {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, rgba(40, 40, 60, 0.95), rgba(20, 20, 40, 0.98));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.1);
  
  &.success {
    border-color: rgba(76, 175, 80, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(76, 175, 80, 0.2);
  }
  
  &.error {
    border-color: rgba(244, 67, 54, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(244, 67, 54, 0.2);
  }
  
  &.warning {
    border-color: rgba(255, 193, 7, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 193, 7, 0.2);
  }
}

.toast-icon {
  font-size: 18px;
}

.toast-message {
  font-size: 14px;
  color: #fff5e6;
  white-space: nowrap;
}

// 动画
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.95);
}
</style>