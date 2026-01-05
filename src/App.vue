<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useActivityStore } from '@/store/activity'
import { useWebSocketStore } from '@/store/websocket'

const route = useRoute()
const activityStore = useActivityStore()
const wsStore = useWebSocketStore()

// 监听活动ID变化，自动连接 WebSocket
watch(
  () => activityStore.activityId,
  (activityId) => {
    if (activityId) {
      // 主持人端使用 screen 类型连接
      wsStore.connect({
        type: 'screen',
        activityId: activityId.toString()
      })
    }
  }
)

onUnmounted(() => {
  wsStore.disconnect()
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
