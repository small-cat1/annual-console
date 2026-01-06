/**
 * WebSocket 全局状态管理
 * 管理 WebSocket 连接生命周期
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createWebSocket } from '@/utils/websocket'

export const useWebSocketStore = defineStore('websocket', () => {
  // WebSocket 实例
  const ws = createWebSocket({
    maxReconnect: 10,
    reconnectInterval: 3000,
    heartbeatInterval: 30000
  })

  // 状态
  const status = ref('disconnected') // disconnected | connecting | connected
  const lastMessage = ref(null)
  const error = ref(null)

  // 计算属性
  const isConnected = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting')

  /**
   * 连接到 WebSocket 服务器
   * @param {object} options - 连接选项
   * @param {string} options.type - 连接类型: 'screen' | 'h5'
   * @param {string} options.activityId - 活动ID
   * @param {string} options.screenType - 大屏类型: 'checkin' | 'danmaku' | 'shake' | 'draw'
   * @param {string} options.token - 用户Token（H5端需要）
   */
  function connect(options = {}) {
    const { type = 'screen', activityId, screenType, token } = options

    if (!activityId) {
      console.error('WebSocket 连接需要 activityId')
      return
    }

    // 构建 WebSocket URL
    const wsBase = import.meta.env.VITE_APP_WS_URL || 'ws://localhost:9001/ws'
    let wsUrl = wsBase
    const params = { activityId }

    if (type === 'screen') {
      // 主持人端/大屏连接
      wsUrl = `${wsBase}/screen`
      if (screenType) {
        params.type = screenType
      }
    } else if (type === 'h5') {
      // 用户端连接
      wsUrl = `${wsBase}/h5`
      if (token) {
        params.token = token
      }
    }

    status.value = 'connecting'
    error.value = null

    // 设置事件监听
    ws.on('open', () => {
      status.value = 'connected'
      console.log('WebSocket Store: 连接成功')
    })

    ws.on('close', () => {
      status.value = 'disconnected'
      console.log('WebSocket Store: 连接关闭')
    })

    ws.on('error', (err) => {
      error.value = err
      console.error('WebSocket Store: 错误', err)
    })

    ws.on('message', (data) => {
      lastMessage.value = data
    })

    ws.on('reconnect_failed', () => {
      status.value = 'disconnected'
      error.value = { message: '重连失败' }
    })

    // 连接
    ws.connect(wsUrl, params)
  }

  /**
   * 断开连接
   */
  function disconnect() {
    ws.close()
    status.value = 'disconnected'
  }

  /**
   * 订阅消息
   * @returns {Function} 取消订阅函数
   */
  function subscribe(event, callback) {
    return ws.on(event, callback)
  }





  return {
    // 状态
    status,
    isConnected,
    isConnecting,
    lastMessage,
    error,
    
    // 方法
    connect,
    disconnect,
    send,
    subscribe,

  
    // 原始实例（高级用法）
    ws
  }
})
