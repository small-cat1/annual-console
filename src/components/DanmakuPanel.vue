<template>
  <section class="danmaku-panel panel">
    <div class="panel-header">
      <span class="panel-icon">✨</span>
      <h2>弹幕留言</h2>
      <span class="danmaku-count">{{ danmakuList.length }} 条</span>
      <span class="ws-status" :class="wsStatus">
        {{ wsStatusText }}
      </span>
    </div>

    <div class="panel-body">
      <div class="starry-container" ref="containerRef">
        <!-- 背景星星装饰 -->
        <div class="bg-stars">
          <div
            v-for="n in 30"
            :key="'star-' + n"
            class="bg-star"
            :style="getRandomStarStyle()"
          />
        </div>

        <!-- 弹幕星星 -->
        <TransitionGroup name="star">
          <div
            v-for="item in displayList"
            :key="item.id"
            class="danmaku-star"
            :class="{ 'is-new': item.isNew }"
            :style="item.style"
            @click="openDetail(item)"
          >
            <div class="star-bubble">
              <span class="star-content">{{
                truncateText(item.content, 20)
              }}</span>
            </div>
            <div class="star-glow" />
          </div>
        </TransitionGroup>

        <!-- 空状态 -->
        <div v-if="danmakuList.length === 0" class="empty-state">
          <span class="empty-icon">🌟</span>
          <p>暂无弹幕留言</p>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Transition name="modal">
      <div v-if="selectedItem" class="detail-modal" @click.self="closeDetail">
        <div class="detail-card">
          <button class="close-btn" @click="closeDetail">×</button>

          <div class="detail-header">
            <div class="avatar">
              <img :src="selectedItem.user?.avatar || defaultAvatar" alt="" />
            </div>
            <div class="user-info">
              <span class="nickname">{{
                selectedItem.user?.nickname || "匿名用户"
              }}</span>
              <span class="time">{{ formatDate(selectedItem.createdAt) }}</span>
            </div>
          </div>

          <div class="detail-content">
            <p>{{ selectedItem.content }}</p>
          </div>

          <div class="detail-footer">
            <span class="message-id">#{{ selectedItem.id }}</span>
            <div class="actions">
              <button
                class="action-btn highlight"
                @click="highlightMessage(selectedItem)"
              >
                <span>🌟</span> 高亮
              </button>
              <button
                class="action-btn"
                @click="copyContent(selectedItem.content)"
              >
                <span>📋</span> 复制
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 高亮展示区域 -->
    <Transition name="highlight">
      <div v-if="highlightedItem" class="highlight-display">
        <div class="highlight-card">
          <div class="highlight-avatar">
            <img :src="highlightedItem.user?.avatar || defaultAvatar" alt="" />
          </div>
          <div class="highlight-info">
            <span class="highlight-name">{{
              highlightedItem.user?.nickname || "匿名用户"
            }}</span>
            <p class="highlight-text">{{ highlightedItem.content }}</p>
          </div>
          <button class="highlight-close" @click="highlightedItem = null">
            ×
          </button>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { getDanmakuList } from "@/api/danmaku";
import { useWebSocketStore } from "@/store/websocket";
import { formatDate } from "@/utils/format";
import { showToast, showSuccess } from '@/components/Toast'
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  activityId: {
    type: [Number, String],
    required: true,
  },
  limit: {
    type: Number,
    default: 50,
  },
  useFallbackPolling: {
    type: Boolean,
    default: true,
  },
  pollInterval: {
    type: Number,
    default: 5000,
  },
});

const wsStore = useWebSocketStore();

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";
const danmakuList = ref([]);
const displayList = ref([]);
const containerRef = ref(null);
const selectedItem = ref(null);
const highlightedItem = ref(null);
let pollTimer = null;
let unsubscribe = null;

// 已使用的位置，避免重叠
const usedPositions = [];

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

// 生成背景星星样式
const getRandomStarStyle = () => {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 2}s`,
  };
};

// 生成不重叠的位置
const generatePosition = () => {
  let attempts = 0;
  let left, top;

  do {
    left = 5 + Math.random() * 85; // 5% - 90%
    top = 5 + Math.random() * 85;
    attempts++;
  } while (
    attempts < 50 &&
    usedPositions.some(
      (pos) => Math.abs(pos.left - left) < 12 && Math.abs(pos.top - top) < 15
    )
  );

  usedPositions.push({ left, top });

  // 限制记录数量
  if (usedPositions.length > 100) {
    usedPositions.shift();
  }

  return { left, top };
};

// 生成弹幕样式
const generateStyle = () => {
  const { left, top } = generatePosition();
  const scale = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
  const hue = Math.random() * 60 + 30; // 30-90 暖色调

  return {
    left: `${left}%`,
    top: `${top}%`,
    "--scale": scale,
    "--hue": hue,
    "--delay": `${Math.random() * 2}s`,
  };
};

// 截断文本
const truncateText = (text, maxLen) => {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
};

// 初始化显示列表
const initDisplayList = () => {
  usedPositions.length = 0;
  displayList.value = danmakuList.value.map((item) => ({
    ...item,
    style: generateStyle(),
    isNew: false,
  }));
};

// 获取弹幕列表
const fetchDanmakuList = async () => {
  if (!props.activityId) return;

  try {
    const res = await getDanmakuList(props.activityId, { limit: props.limit });
    if (res.code === 0) {
      const newList = res.data?.list || [];
      danmakuList.value = newList;
      initDisplayList();
    }
  } catch (e) {
    console.error("获取弹幕列表失败", e);
  }
};

// 处理新弹幕
const handleNewDanmaku = (data) => {
  console.log("收到新弹幕:", data);

  // 添加到列表
  danmakuList.value.unshift(data);

  // 添加到显示列表（带动画）
  const newItem = {
    ...data,
    style: generateStyle(),
    isNew: true,
  };
  displayList.value.unshift(newItem);

  // 移除新消息标记
  setTimeout(() => {
    newItem.isNew = false;
  }, 3000);

  // 限制数量
  if (danmakuList.value.length > props.limit) {
    danmakuList.value.pop();
    displayList.value.pop();
  }
};

// 打开详情
const openDetail = (item) => {
  selectedItem.value = item;
};

// 关闭详情
const closeDetail = () => {
  selectedItem.value = null;
};

// 高亮消息
const highlightMessage = (item) => {
  highlightedItem.value = item;
  closeDetail();
};

// 复制内容
const copyContent = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('已复制')
  } catch (e) {
    showToast({ message: '复制失败', type: 'error' })
  }
};

// 轮询
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
  if (unsubscribe) unsubscribe();
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;

  .panel-icon {
    font-size: 20px;
  }

  h2 {
    margin: 0;
    font-size: 16px;
    color: $text-light;
  }

  .danmaku-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .ws-status {
    margin-left: auto;
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
  padding: 0 16px 16px;
}

.starry-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgba(30, 40, 80, 0.4) 0%,
    rgba(10, 10, 30, 0.6) 100%
  );
  border-radius: 16px;
  overflow: hidden;
}

// 背景星星
.bg-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .bg-star {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #fff;
    border-radius: 50%;
    opacity: 0.4;
    animation: twinkle ease-in-out infinite;
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.8;
  }
}

// 弹幕星星
.danmaku-star {
  position: absolute;
  cursor: pointer;
  transform: scale(var(--scale, 1));
  animation: fadeInStar 0.5s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
  z-index: 1;

  &:hover {
    z-index: 10;

    .star-bubble {
      transform: scale(1.1);
      background: rgba(255, 215, 0, 0.25);
      border-color: rgba(255, 215, 0, 0.6);
    }

    .star-glow {
      opacity: 1;
      transform: scale(1.5);
    }
  }

  &.is-new {
    animation: newStar 0.8s ease-out;

    .star-bubble {
      background: rgba(255, 215, 0, 0.3);
      border-color: $primary-gold;
    }

    .star-glow {
      opacity: 1;
      animation: pulse 1s ease-in-out infinite;
    }
  }
}

.star-bubble {
  position: relative;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;

  .star-content {
    font-size: 13px;
    color: $text-light;
    white-space: nowrap;
  }
}

.star-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.4) 0%,
    transparent 70%
  );
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

@keyframes fadeInStar {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(var(--scale, 1));
  }
}

@keyframes newStar {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-180deg);
  }
  50% {
    transform: scale(1.3) rotate(10deg);
  }
  100% {
    opacity: 1;
    transform: scale(var(--scale, 1)) rotate(0deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0.2;
  }
}

// 列表动画
.star-enter-active {
  animation: newStar 0.6s ease-out;
}

.star-leave-active {
  animation: fadeOutStar 0.4s ease-in forwards;
}

@keyframes fadeOutStar {
  to {
    opacity: 0;
    transform: scale(0.5);
  }
}

// 空状态
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.5);

  .empty-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
    animation: float 3s ease-in-out infinite;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 详情弹窗
.detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.detail-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: linear-gradient(
    135deg,
    rgba(40, 40, 60, 0.95),
    rgba(20, 20, 40, 0.98)
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 20px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 215, 0, 0.4);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .nickname {
      font-size: 18px;
      font-weight: 600;
      color: $primary-gold;
    }

    .time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

.detail-content {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: $text-light;
    word-break: break-all;
  }
}

.detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .message-id {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: $text-light;
    font-size: 13px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &.highlight {
      background: linear-gradient(
        135deg,
        rgba(255, 215, 0, 0.3),
        rgba(255, 180, 0, 0.2)
      );

      &:hover {
        background: linear-gradient(
          135deg,
          rgba(255, 215, 0, 0.5),
          rgba(255, 180, 0, 0.4)
        );
      }
    }
  }
}

// 弹窗动画
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;

  .detail-card {
    transition: all 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .detail-card {
    transform: scale(0.9) translateY(20px);
    opacity: 0;
  }
}

// 高亮展示
.highlight-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  width: 90%;
  max-width: 500px;
}

.highlight-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.2),
    rgba(255, 180, 0, 0.1)
  );
  border: 2px solid $primary-gold;
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  animation: highlightPulse 2s ease-in-out infinite;

  .highlight-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid $primary-gold;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .highlight-info {
    flex: 1;
    min-width: 0;

    .highlight-name {
      display: block;
      font-size: 14px;
      color: $primary-gold;
      margin-bottom: 6px;
    }

    .highlight-text {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #fff;
      line-height: 1.4;
      word-break: break-all;
    }
  }

  .highlight-close {
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 24px;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

@keyframes highlightPulse {
  0%,
  100% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.5);
  }
}

// 高亮动画
.highlight-enter-active,
.highlight-leave-active {
  transition: all 0.4s ease;
}

.highlight-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.highlight-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.1);
}
</style>
