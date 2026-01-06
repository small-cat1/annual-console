<template>
  <div class="game-page">
    <!-- 无活动ID提示 -->
    <div v-if="!activityStore.hasActivityId" class="loading-state error-state">
      <div class="state-content">
        <span class="icon">⚠️</span>
        <h2>未指定活动</h2>
        <p>请在URL中添加活动ID参数，如：?activityId=1</p>
      </div>
    </div>

    <!-- 加载失败提示 -->
    <div v-else-if="activityStore.loadError" class="loading-state error-state">
      <div class="state-content">
        <span class="icon">❌</span>
        <h2>活动加载失败</h2>
        <p>请检查活动ID是否正确</p>
        <button class="btn btn-primary" @click="retryLoad">重试</button>
      </div>
    </div>

    <!-- 正常页面内容 -->
    <template v-else-if="activityStore.isReady">
      <!-- 背景装饰 -->
      <div class="bg-decorations">
        <div class="spotlight spotlight-1"></div>
        <div class="spotlight spotlight-2"></div>
      </div>

      <!-- 顶部标题栏 -->
      <GameHeader
        :title="activityStore.config?.title || '摇一摇大作战'"
        v-model="selectedRoundId"
        :rounds="availableRounds"
        :disabled="gameStatus === 1 || showCountdown"
        :game-status="gameStatus"
        :show-countdown="showCountdown"
        :ws-status="wsStore.status"
        :ws-status-text="wsStatusText"
        :status-class="statusClass"
        :status-text="statusText"
        @back="goBack"
        @show-password="showPasswordDialog = true"
        @stop="handleStop"
        @show-winners="showWinnerModal = true"
        @next-round="handleNextRound"
      />

      <!-- 主体内容 -->
      <main class="game-main">
        <!-- 左侧：奖品 + 排行榜 -->
        <section class="left-section">
          <!-- 奖品展示 -->
          <PrizeCard
            :round="currentRound"
            :game-status="gameStatus"
            :show-countdown="showCountdown"
            :prepare-countdown="prepareCountdown"
            :remain-time="remainTime"
            :countdown-offset="countdownOffset"
            :player-count="playerCount"
          />

          <!-- 实时排行榜 -->
          <RankingPanel
            :list="rankingList"
            :player-count="playerCount"
            :winner-count="currentRound?.winnerCount || 3"
            :game-status="gameStatus"
            :has-round="!!currentRound"
          />
        </section>

        <!-- 右侧：弹幕面板 -->
        <section class="right-section">
          <DanmakuPanel
            :activity-id="activityStore.activityId"
            :limit="50"
            class="danmaku-full"
          />
        </section>
      </main>

      <!-- 密码输入弹窗 -->
      <PasswordModal
        :show="showPasswordDialog"
        v-model="password"
        :loading="startLoading"
        @close="showPasswordDialog = false"
        @submit="handleStart"
      />

      <!-- 中奖名单弹窗 -->
      <WinnerModal
        :show="showWinnerModal"
        :round-name="currentRound?.roundName"
        :prize="currentRound?.prize"
        :winners="winners"
        @close="showWinnerModal = false"
      />

      <!-- 游戏结束庆祝弹窗 -->
      <CelebrationModal
        :show="showCelebration"
        :winners="winners"
        @close="closeCelebration"
      />
    </template>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import DanmakuPanel from "@/components/DanmakuPanel.vue";
import { useActivityStore } from "@/store/activity";
import { onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  CelebrationModal,
  GameHeader,
  PasswordModal,
  PrizeCard,
  RankingPanel,
  WinnerModal,
} from "./game/components";
import { useGameLogic } from "./game/composables/useGameLogic";

const router = useRouter();
const route = useRoute();
const activityStore = useActivityStore();

// 使用游戏逻辑 composable
const {
  wsStore,
  roundList,
  selectedRoundId,
  currentRound,
  gameStatus,
  playerCount,
  remainTime,
  showCountdown,
  prepareCountdown,
  rankingList,
  winners,
  showPasswordDialog,
  showWinnerModal,
  showCelebration,
  password,
  startLoading,
  availableRounds,
  statusClass,
  statusText,
  countdownOffset,
  wsStatusText,
  handleStart,
  handleStop,
  handleNextRound,
  closeCelebration,
  initGameData,
  cleanup,
} = useGameLogic();

// 返回控制台
const goBack = () => {
  router.push("/dashboard?activityId=" + route.query.activityId);
};

// 重试加载
const retryLoad = async () => {
  await activityStore.init(route.query.activityId);
  if (activityStore.isReady) {
    await initGameData();
  }
};

// 初始化
onMounted(async () => {
  // 如果 store 已经初始化过，直接使用
  if (activityStore.isReady) {
    await initGameData();
    return;
  }

  // 尝试初始化
  const success = await activityStore.init();

  if (!success) {
    // 初始化失败（无 activityId 或加载失败），重定向到首页
    if (!activityStore.hasActivityId) {
      router.replace("/dashboard");
    }
    // 如果是 loadError，页面会显示错误提示，不重定向
    return;
  }

  await initGameData();
});

// 清理
onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
$primary-red: #e63946;
$primary-gold: #ffd700;
$text-light: #fff5e6;
$bg-card: rgba(40, 15, 15, 0.95);

.game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0505 0%, #1a0a0a 50%, #150808 100%);
  color: $text-light;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.spotlight {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;

  &.spotlight-1 {
    top: -150px;
    left: 10%;
    background: $primary-red;
    animation: float-slow 10s ease-in-out infinite;
  }

  &.spotlight-2 {
    bottom: -150px;
    right: 10%;
    background: $primary-gold;
    animation: float-slow 12s ease-in-out infinite reverse;
  }
}

@keyframes float-slow {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 20px);
  }
}

// 主体内容
.game-main {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  min-height: calc(100vh - 90px);
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-section {
  .danmaku-full {
    height: 100%;
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.2);
    border-top-color: $primary-gold;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 14px;
    opacity: 0.7;
  }

  &.error-state {
    .state-content {
      text-align: center;
      padding: 40px;
      background: $bg-card;
      border-radius: 20px;
      border: 1px solid rgba(255, 215, 0, 0.2);

      .icon {
        font-size: 60px;
        display: block;
        margin-bottom: 16px;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 12px;
        color: $primary-gold;
      }

      p {
        font-size: 14px;
        opacity: 0.7;
        margin: 0 0 20px;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, #9b1b30);
    color: #fff;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(230, 57, 70, 0.5);
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .game-main {
    grid-template-columns: 1fr;
  }

  .right-section {
    display: none;
  }
}
</style>
