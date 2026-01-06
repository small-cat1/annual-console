<template>
  <div class="console-page">
    <!-- 无活动ID提示 -->
    <div v-if="!activityStore.hasActivityId" class="no-activity">
      <div class="no-activity-content">
        <span class="icon">⚠️</span>
        <h2>未指定活动</h2>
        <p>请在URL中添加活动ID参数，如：?activityId=1</p>
      </div>
    </div>

    <!-- 加载失败提示 -->
    <div v-else-if="activityStore.loadError" class="load-error">
      <div class="error-content">
        <span class="icon">❌</span>
        <h2>活动加载失败</h2>
        <p>请检查活动ID是否正确</p>
        <button class="btn btn-primary" @click="retryLoad">重试</button>
      </div>
    </div>

    <!-- 正常页面 -->
    <template v-else-if="activityStore.isReady">
      <!-- 背景装饰 -->
      <div class="bg-decorations">
        <div class="lantern lantern-left"></div>
        <div class="lantern lantern-right"></div>
        <div class="firework firework-1"></div>
        <div class="firework firework-2"></div>
        <div class="firework firework-3"></div>
      </div>

      <!-- 顶部标题栏 -->
      <header class="console-header">
        <div class="header-left">
          <button class="game-entry-btn" @click="goToGame">
            <span class="btn-icon">🎮</span>
            进入游戏控制
          </button>
        </div>
        <div class="header-center">
          <img
            v-if="activityStore.config.logo"
            :src="activityStore.config.logo"
            class="activity-logo"
          />
          <span v-else class="logo-icon">🎊</span>
          <h1>{{ activityStore.config.title || "年会控制台" }}</h1>
        </div>
        <div class="header-right">
          <span class="ws-indicator" :class="wsStore.status">
            <span class="ws-dot"></span>
            {{ wsStatusText }}
          </span>
          <span class="time-display">{{ currentTime }}</span>
        </div>
      </header>

      <!-- 主体内容 -->
      <main class="console-main">
        <!-- 左侧：签到管理 -->
        <section class="panel checkin-panel">
          <div class="panel-header">
            <span class="panel-icon">✅</span>
            <h2>签到管理</h2>
            <span
              class="status-tag"
              :class="checkInData.isOpen ? 'is-open' : 'is-closed'"
            >
              {{ checkInData.isOpen ? "签到中" : "未开启" }}
            </span>
          </div>

          <div class="panel-body">
            <!-- 签到展示区：左侧人数 + 右侧二维码 -->
            <div class="checkin-display" v-if="checkInData.isOpen">
              <div class="checkin-count">
                <div class="count-value">{{ checkInData.total }}</div>
                <div class="count-label">签到人数</div>
              </div>
              <div class="qrcode-box">
                <div class="qrcode-wrapper">
                  <qrcode-vue :value="checkInQrUrl" :size="200" level="M" />
                </div>
                <p class="qrcode-tip">扫码进入活动</p>
              </div>
            </div>

            <!-- 未开启时只显示人数 -->
            <div class="checkin-display single" v-else>
              <div class="checkin-count">
                <div class="count-value">{{ checkInData.total }}</div>
                <div class="count-label">签到人数</div>
              </div>
            </div>

            <!-- 签到控制按钮 -->
            <div class="action-buttons">
              <button
                v-if="!checkInData.isOpen"
                class="btn btn-primary btn-glow"
                @click="handleOpenCheckIn"
                :disabled="btnLoading"
              >
                <span class="btn-icon">🚀</span>
                开启签到
              </button>
              <button
                v-else
                class="btn btn-danger"
                @click="handleCloseCheckIn"
                :disabled="btnLoading"
              >
                <span class="btn-icon">⏹️</span>
                关闭签到
              </button>
            </div>

            <!-- 最新签到列表 -->
            <div class="checkin-list" v-if="checkInData.isOpen">
              <div class="list-header">
                <span>最新签到</span>
              </div>
              <div class="list-content">
                <div
                  v-for="item in checkInData.list"
                  :key="item.id"
                  class="checkin-item"
                >
                  <img
                    :src="item.avatar || defaultAvatar"
                    class="user-avatar"
                  />
                  <div class="user-info">
                    <span class="user-name">{{
                      item.realName || item.nickname
                    }}</span>
                    <span class="user-dept">{{ item.department || "-" }}</span>
                  </div>
                  <span class="checkin-time">{{ item.checkInTime }}</span>
                </div>
                <div v-if="!checkInData.list.length" class="empty-tip">
                  暂无签到记录
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 右侧：弹幕 -->
        <DanmakuPanel
          :activity-id="activityStore.activityId"
          :limit="30"
          :poll-interval="3000"
        />
      </main>

      <!-- 底部状态栏 -->
      <footer class="console-footer">
        <div class="footer-item">
          <span class="footer-icon">📡</span>
          <span>{{ wsStore.isConnected ? "实时同步中" : "连接中..." }}</span>
        </div>
        <div class="footer-item">
          <span class="footer-icon">🎪</span>
          <span>活动ID: {{ activityStore.activityId }}</span>
        </div>
      </footer>
    </template>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { closeCheckIn, getCheckInStats, openCheckIn } from "@/api/checkin";
import DanmakuPanel from "@/components/DanmakuPanel.vue";
import { useActivityStore } from "@/store/activity";
import { useWebSocketStore } from "@/store/websocket";
import QrcodeVue from "qrcode.vue";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const activityStore = useActivityStore();
const wsStore = useWebSocketStore();

const H5_BASE = import.meta.env.VITE_APP_H5_URL || window.location.origin;

// WebSocket 状态文字
const wsStatusText = computed(() => {
  switch (wsStore.status) {
    case "connected":
      return "已连接";
    case "connecting":
      return "连接中";
    default:
      return "未连接";
  }
});

// 当前时间
const currentTime = ref("");

// 签到列表
const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";

// 签到统计数据
const checkInData = reactive({
  isOpen: false,
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  list: [],
});

// 按钮加载状态
const btnLoading = ref(false);

// 签到二维码URL
const checkInQrUrl = computed(
  () =>
    `${H5_BASE}/entry?activityId=${activityStore.activityId}&t=${Date.now()}`
);

// 定时器
let timeTimer = null;
// WebSocket 订阅取消函数
let unsubscribeCheckin = null;

// 更新当前时间
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("zh-CN", { hour12: false });
};

// 获取签到统计（仅初始化时调用一次）
const fetchCheckInData = async () => {
  if (!activityStore.activityId) return;

  try {
    const res = await getCheckInStats(activityStore.activityId);
    if (res.code === 0 && res.data) {
      checkInData.isOpen = res.data.isOpen || false;
      checkInData.total = res.data.total || 0;
      checkInData.pending = res.data.pending || 0;
      checkInData.approved = res.data.approved || 0;
      checkInData.rejected = res.data.rejected || 0;
      checkInData.list = res.data.list || [];
    }
  } catch (e) {
    console.error("获取签到统计失败", e);
  }
};

// 处理新签到（WebSocket 推送）
const handleNewCheckin = (data) => {
  console.log("收到签到统计更新:", data);

  // 直接替换统计数据
  checkInData.total = data.total ?? checkInData.total;
  checkInData.pending = data.pending ?? checkInData.pending;
  checkInData.approved = data.approved ?? checkInData.approved;
  checkInData.rejected = data.rejected ?? checkInData.rejected;

  // 如果有列表数据也更新
  if (data.list) {
    checkInData.list = data.list;
  }
};

// 订阅 WebSocket 消息
const subscribeWebSocket = () => {
  if (unsubscribeCheckin) {
    unsubscribeCheckin();
  }
  unsubscribeCheckin = wsStore.subscribe("checkin_stats", handleNewCheckin);
};

// 监听 WebSocket 连接状态，连接成功后订阅
watch(
  () => wsStore.isConnected,
  (connected) => {
    if (connected) {
      subscribeWebSocket();
    }
  },
  { immediate: true }
);

// 开启签到
const handleOpenCheckIn = async () => {
  btnLoading.value = true;
  try {
    const res = await openCheckIn(activityStore.activityId);
    if (res.code === 0) {
      checkInData.isOpen = true;
    }
  } catch (e) {
    console.error("开启签到失败", e);
  } finally {
    btnLoading.value = false;
  }
};

// 关闭签到
const handleCloseCheckIn = async () => {
  btnLoading.value = true;
  try {
    const res = await closeCheckIn(activityStore.activityId);
    if (res.code === 0) {
      checkInData.isOpen = false;
    }
  } catch (e) {
    console.error("关闭签到失败", e);
  } finally {
    btnLoading.value = false;
  }
};

// 进入游戏控制
const goToGame = () => {
  router.push({
    path: "/game",
    query: { activityId: activityStore.activityId },
  });
};

// 重试加载
const retryLoad = async () => {
  await activityStore.init(route.query.activityId);
  if (activityStore.isReady) {
    await fetchCheckInData();
  }
};

// 初始化
onMounted(async () => {
  updateTime();
  timeTimer = setInterval(updateTime, 1000);

  const success = await activityStore.init(route.query.activityId);

  if (success) {
    // 只请求一次初始数据
    await fetchCheckInData();

    // 如果 WebSocket 已连接，立即订阅
    if (wsStore.isConnected) {
      subscribeWebSocket();
    }
  }
});

// 清理
onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
  if (unsubscribeCheckin) unsubscribeCheckin();
});
</script>

<style lang="scss" scoped>
// 主题色变量
$primary-red: #e63946;
$primary-gold: #ffd700;
$dark-red: #9b1b30;
$bg-dark: #1a0a0a;
$bg-card: rgba(40, 15, 15, 0.9);
$text-light: #fff5e6;
$text-gold: #ffd700;

.console-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0808 100%);
  color: $text-light;
  position: relative;
  overflow: hidden;
}

// 无活动ID / 加载失败 / 加载中
.no-activity,
.load-error,
.loading-state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-activity-content,
.error-content {
  text-align: center;
  padding: 40px;
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);

  .icon {
    font-size: 60px;
    display: block;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    margin-bottom: 10px;
    color: $primary-gold;
  }

  p {
    font-size: 14px;
    opacity: 0.7;
    margin-bottom: 20px;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 215, 0, 0.2);
  border-top-color: $primary-gold;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 背景装饰
.bg-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

// 顶部标题栏
.console-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  .header-left,
  .header-right {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .header-right {
    justify-content: flex-end;
    gap: 16px;
  }

  .header-center {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    .activity-logo {
      height: 40px;
      width: auto;
    }

    .logo-icon {
      font-size: 32px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, $primary-gold, #fff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
  }

  .ws-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.3);

    .ws-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    &.connected {
      .ws-dot {
        background: #4caf50;
      }
      color: #81c784;
    }
    &.connecting {
      .ws-dot {
        background: #ffc107;
        animation: blink 1s infinite;
      }
      color: #ffc107;
    }
    &.disconnected {
      .ws-dot {
        background: #f44336;
      }
      color: #e57373;
    }
  }

  .time-display {
    font-size: 20px;
    font-weight: 600;
    font-family: "Courier New", monospace;
    color: $primary-gold;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.game-entry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $primary-red, $dark-red);
  border: none;
  border-radius: 25px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  animation: bounce 2s ease-in-out infinite;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(230, 57, 70, 0.5);
  }

  .btn-icon {
    font-size: 18px;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

// 主体内容 - 两栏布局
.console-main {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  min-height: calc(100vh - 140px);
}

// 面板通用样式
.panel {
  background: $bg-card;
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(
    to right,
    rgba(154, 27, 48, 0.5),
    rgba(40, 15, 15, 0.5)
  );
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  .panel-icon {
    font-size: 20px;
  }

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    color: $text-gold;
  }

  .status-tag {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.is-open {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.4);
    }

    &.is-closed {
      background: rgba(158, 158, 158, 0.2);
      color: #bdbdbd;
      border: 1px solid rgba(158, 158, 158, 0.4);
    }
  }
}

.panel-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

// 二维码区域
.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;

  .qrcode-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  }

  .qrcode-tip {
    margin-top: 16px;
    font-size: 15px;
    color: $primary-gold;
  }
}

// 按钮
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  .btn-icon {
    font-size: 20px;
  }

  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, $dark-red);
    color: #fff;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(230, 57, 70, 0.5);
    }
  }

  &.btn-danger {
    background: linear-gradient(135deg, #ff4444, #cc0000);
    color: #fff;
  }

  &.btn-glow {
    animation: glow 2s ease-in-out infinite;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(230, 57, 70, 0.7),
      0 0 60px rgba(255, 215, 0, 0.3);
  }
}

// 签到列表
.checkin-list {
  margin-top: 24px;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
  padding-top: 20px;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-size: 14px;
    color: $text-gold;
  }

  .list-content {
    max-height: 240px;
    overflow-y: auto;
  }

  .checkin-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 215, 0, 0.3);
    }

    .user-info {
      flex: 1;
      margin-left: 12px;
      overflow: hidden;

      .user-name {
        display: block;
        font-size: 14px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-dept {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 2px;
      }
    }

    .checkin-time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-family: "Courier New", monospace;
    }
  }

  .empty-tip {
    text-align: center;
    padding: 20px;
    font-size: 13px;
    opacity: 0.5;
  }
}
// 签到展示区 - 左右布局
.checkin-display {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;

  &.single {
    justify-content: center;
  }
}

.checkin-count {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 30px 20px;
  min-height: 280px;

  .count-value {
    font-size: 100px;
    font-weight: 700;
    color: $primary-gold;
    line-height: 1;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }

  .count-label {
    margin-top: 16px;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.qrcode-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 20px;
  min-height: 280px;

  .qrcode-wrapper {
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  }

  .qrcode-tip {
    margin-top: 16px;
    font-size: 15px;
    color: $primary-gold;
  }
}
// 底部状态栏
.console-footer {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 215, 0, 0.1);

  .footer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    opacity: 0.7;
  }
}

// 响应式
@media (max-width: 1200px) {
  .console-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .console-header {
    flex-wrap: wrap;
    gap: 12px;

    .header-center {
      order: -1;
      width: 100%;
      justify-content: center;
    }

    .header-left,
    .header-right {
      flex: none;
    }
  }
}
</style>
