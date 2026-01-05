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
      <div class="danmaku-container" ref="containerRef">
        <!-- 飞舞的弹幕 -->
        <div
          v-for="item in flyingDanmakus"
          :key="item.uniqueKey"
          class="danmaku-fly"
          :style="item.style"
        >
          <img
            class="danmaku-avatar"
            :src="item.user?.avatar || defaultAvatar"
            alt=""
          />
          <span class="danmaku-user">{{ item.user?.nickname || "匿名" }}</span>
          <span class="danmaku-text">{{ item.content }}</span>
        </div>

        <div v-if="danmakuList.length === 0" class="empty-state">
          <span class="empty-icon">💬</span>
          <p>暂无弹幕</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { getDanmakuList } from "@/api/danmaku";
import { useWebSocketStore } from "@/store/websocket";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  activityId: {
    type: [Number, String],
    required: true,
  },
  limit: {
    type: Number,
    default: 30,
  },
  useFallbackPolling: {
    type: Boolean,
    default: true,
  },
  pollInterval: {
    type: Number,
    default: 5000,
  },
  // 弹幕轨道数量
  trackCount: {
    type: Number,
    default: 6,
  },
  // 弹幕飞行时间范围（秒）
  minDuration: {
    type: Number,
    default: 8,
  },
  maxDuration: {
    type: Number,
    default: 15,
  },
});

const wsStore = useWebSocketStore();

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";
const danmakuList = ref([]);
const flyingDanmakus = ref([]);
const containerRef = ref(null);
let pollTimer = null;
let unsubscribe = null;
let loopTimer = null;
let uniqueId = 0;

// WebSocket 状态
const wsStatus = computed(() => wsStore.status);
const wsStatusText = computed(() => {
  switch (wsStore.status) {
    case "connected":
      return "实时";
    case "connecting":
      return "连接中...";
    default:
      return "离线";
  }
});

// 生成随机弹幕样式
const generateStyle = () => {
  const track = Math.floor(Math.random() * props.trackCount);
  const duration =
    props.minDuration + Math.random() * (props.maxDuration - props.minDuration);
  const topPercent = (track / props.trackCount) * 80 + 5; // 5% - 85% 范围

  return {
    top: `${topPercent}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${Math.random() * 2}s`,
  };
};

// 添加飞行弹幕
const addFlyingDanmaku = (item) => {
  const flyItem = {
    ...item,
    uniqueKey: `${item.id}-${uniqueId++}`,
    style: generateStyle(),
  };
  flyingDanmakus.value.push(flyItem);

  // 动画结束后移除
  const duration = parseFloat(flyItem.style.animationDuration) * 1000;
  const delay = parseFloat(flyItem.style.animationDelay) * 1000;
  setTimeout(() => {
    const index = flyingDanmakus.value.findIndex(
      (d) => d.uniqueKey === flyItem.uniqueKey
    );
    if (index > -1) {
      flyingDanmakus.value.splice(index, 1);
    }
  }, duration + delay + 500);
};

// 循环播放弹幕
let loopIndex = 0;
const startLoop = () => {
  stopLoop();
  if (danmakuList.value.length === 0) return;

  const addNext = () => {
    if (danmakuList.value.length === 0) return;

    // 随机添加 1-3 条弹幕
    const count = Math.min(
      Math.floor(Math.random() * 3) + 1,
      danmakuList.value.length
    );

    for (let i = 0; i < count; i++) {
      const item = danmakuList.value[loopIndex % danmakuList.value.length];
      addFlyingDanmaku(item);
      loopIndex++;
    }
  };

  // 立即添加一批
  addNext();

  // 定时添加新弹幕
  loopTimer = setInterval(addNext, 2000);
};

const stopLoop = () => {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
};

// 获取弹幕列表
const fetchDanmakuList = async () => {
  if (!props.activityId) return;

  try {
    const res = await getDanmakuList(props.activityId, { limit: props.limit });
    if (res.code === 0) {
      const newList = res.data?.list || [];
      danmakuList.value = newList;

      // 重新开始循环
      if (newList.length > 0) {
        startLoop();
      }
    }
  } catch (e) {
    console.error("获取弹幕列表失败", e);
  }
};

// 处理新弹幕（WebSocket 推送）
const handleNewDanmaku = (data) => {
  console.log("收到新弹幕:", data);

  // 添加到列表
  danmakuList.value.unshift(data);
  if (danmakuList.value.length > props.limit) {
    danmakuList.value = danmakuList.value.slice(0, props.limit);
  }

  // 立即显示新弹幕
  addFlyingDanmaku(data);
};

// 开始轮询
const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(fetchDanmakuList, props.pollInterval);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// 监听 WebSocket 状态
watch(
  () => wsStore.isConnected,
  (connected) => {
    if (connected) {
      stopPolling();
      unsubscribe = wsStore.subscribe("new_danmaku", handleNewDanmaku);
    } else if (props.useFallbackPolling) {
      startPolling();
    }
  },
  { immediate: true }
);

// 监听 activityId 变化
watch(
  () => props.activityId,
  (newVal) => {
    if (newVal) {
      fetchDanmakuList();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (wsStore.isConnected) {
    unsubscribe = wsStore.subscribe("new_danmaku", handleNewDanmaku);
  } else if (props.useFallbackPolling) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
  stopLoop();
  if (unsubscribe) {
    unsubscribe();
  }
});
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
  position: relative;
}

.danmaku-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.danmaku-fly {
  position: absolute;
  right: -100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.7),
    rgba(30, 30, 30, 0.8)
  );
  border-radius: 20px;
  white-space: nowrap;
  animation: fly-left linear forwards;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(4px);

  .danmaku-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(255, 215, 0, 0.4);
    object-fit: cover;
  }

  .danmaku-user {
    font-size: 12px;
    color: $primary-gold;
    font-weight: 500;
  }

  .danmaku-text {
    font-size: 14px;
    color: $text-light;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes fly-left {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(-100vw - 100%));
    opacity: 0;
  }
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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
