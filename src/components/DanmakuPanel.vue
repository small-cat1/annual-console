<template>
  <section class="danmaku-panel panel">
    <div class="panel-header">
      <span class="panel-icon">💬</span>
      <h2>实时弹幕</h2>
      <span class="danmaku-count">{{ danmakuList.length }} 条</span>
      <span class="ws-status" :class="wsStatus">
        {{ wsStatusText }}
      </span>
    </div>

    <div class="panel-body">
      <div class="danmaku-list" ref="listRef">
        <TransitionGroup name="danmaku">
          <div v-for="item in danmakuList" :key="item.id" class="danmaku-item">
            <div class="danmaku-avatar">
              <img :src="item.user?.avatar || defaultAvatar" alt="" />
            </div>
            <div class="danmaku-content">
              <span class="danmaku-user">{{ item.user?.nickname || '匿名' }}</span>
              <span class="danmaku-text">{{ item.content }}</span>
            </div>
            <span class="danmaku-time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </TransitionGroup>
        <div v-if="danmakuList.length === 0" class="empty-state">
          <span class="empty-icon">💬</span>
          <p>暂无弹幕</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { getDanmakuList } from '@/api/danmaku'
import { formatDate } from '@/utils/format'
import { useWebSocketStore } from '@/store/websocket'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  activityId: {
    type: [Number, String],
    required: true
  },
  limit: {
    type: Number,
    default: 30
  },
  // 是否使用轮询作为降级方案
  useFallbackPolling: {
    type: Boolean,
    default: true
  },
  pollInterval: {
    type: Number,
    default: 5000
  }
})

const wsStore = useWebSocketStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const danmakuList = ref([])
const listRef = ref(null)
let pollTimer = null
let unsubscribe = null

// WebSocket 状态
const wsStatus = computed(() => wsStore.status)
const wsStatusText = computed(() => {
  switch (wsStore.status) {
    case 'connected': return '实时'
    case 'connecting': return '连接中...'
    default: return '离线'
  }
})

// 获取弹幕列表（初始化和降级轮询用）
const fetchDanmakuList = async () => {
  if (!props.activityId) return

  try {
    const res = await getDanmakuList(props.activityId, { limit: props.limit })
    if (res.code === 0) {
      const newList = res.data?.list || []
      // 检查是否有新弹幕
      if (newList.length > 0 && danmakuList.value.length > 0) {
        if (newList[0].id !== danmakuList.value[0]?.id) {
          danmakuList.value = newList
          scrollToTop()
        }
      } else {
        danmakuList.value = newList
      }
    }
  } catch (e) {
    console.error('获取弹幕列表失败', e)
  }
}

// 处理新弹幕（WebSocket 推送）
const handleNewDanmaku = (data) => {
  console.log('收到新弹幕:', data)
  
  // 添加到列表头部
  danmakuList.value.unshift(data)
  
  // 限制列表长度
  if (danmakuList.value.length > props.limit) {
    danmakuList.value = danmakuList.value.slice(0, props.limit)
  }
  
  scrollToTop()
}

// 滚动到顶部
const scrollToTop = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = 0
    }
  })
}

// 开始轮询（降级方案）
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(fetchDanmakuList, props.pollInterval)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 监听 WebSocket 状态
watch(
  () => wsStore.isConnected,
  (connected) => {
    if (connected) {
      // WebSocket 连接成功，停止轮询
      stopPolling()
      // 订阅弹幕消息
      unsubscribe = wsStore.subscribe('new_danmaku', handleNewDanmaku)
    } else if (props.useFallbackPolling) {
      // WebSocket 断开，启用轮询
      startPolling()
    }
  },
  { immediate: true }
)

// 监听 activityId 变化
watch(
  () => props.activityId,
  (newVal) => {
    if (newVal) {
      fetchDanmakuList()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 如果 WebSocket 已连接，订阅消息
  if (wsStore.isConnected) {
    unsubscribe = wsStore.subscribe('new_danmaku', handleNewDanmaku)
  } else if (props.useFallbackPolling) {
    // 否则启用轮询
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style lang="scss" scoped>
$primary-gold: #ffd700;
$text-light: #fff5e6;

.danmaku-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  .ws-status {
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 11px;
    
    &.connected {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }
    
    &.connecting {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }
    
    &.disconnected {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }
  }
}

.panel-body {
  flex: 1;
  overflow: hidden;
}

.danmaku-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

.danmaku-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 215, 0, 0.05);
  }

  .danmaku-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba(255, 215, 0, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .danmaku-content {
    flex: 1;
    min-width: 0;

    .danmaku-user {
      display: block;
      font-size: 12px;
      color: $primary-gold;
      margin-bottom: 4px;
    }

    .danmaku-text {
      display: block;
      font-size: 14px;
      line-height: 1.4;
      word-break: break-all;
      color: $text-light;
    }
  }

  .danmaku-time {
    font-size: 11px;
    opacity: 0.5;
    white-space: nowrap;
    color: $text-light;
  }
}

.danmaku-enter-active,
.danmaku-leave-active {
  transition: all 0.3s ease;
}

.danmaku-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.danmaku-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  opacity: 0.6;
  color: $text-light;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}
</style>
