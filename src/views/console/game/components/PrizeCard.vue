<template>
  <div class="prize-card" v-if="round?.prize">
    <div class="prize-badge">本轮奖品</div>
    <div class="prize-content">
      <div class="prize-image-wrap">
        <img :src="round.prize.image" class="prize-image" />
        <div class="prize-shine"></div>
      </div>

      <!-- 倒计时显示区域 -->
      <div class="prize-countdown-area">
        <!-- 5秒准备倒计时 -->
        <div v-if="showCountdown" class="countdown-display ready-countdown">
          <span class="countdown-label">准备开始</span>
          <span class="countdown-value countdown-big">{{ prepareCountdown }}</span>
        </div>

        <!-- 游戏进行中倒计时 -->
        <div
          v-else-if="gameStatus === 1"
          class="countdown-display playing-countdown"
        >
          <span class="countdown-label">剩余时间</span>
          <div class="countdown-ring">
            <svg viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="45" />
              <circle
                class="ring-progress"
                cx="50"
                cy="50"
                r="45"
                :style="{ strokeDashoffset: countdownOffset }"
              />
            </svg>
            <span class="countdown-value">{{ remainTime }}</span>
          </div>
          <span class="countdown-unit">秒</span>
        </div>

        <!-- 游戏结束 -->
        <div v-else-if="gameStatus === 2" class="countdown-display finished">
          <span class="finished-icon">🏆</span>
          <span class="finished-text">游戏结束</span>
        </div>

        <!-- 等待开始 -->
        <div v-else class="countdown-display waiting">
          <span class="waiting-icon">⏳</span>
          <span class="waiting-text">等待开始</span>
        </div>
      </div>

      <div class="prize-info">
        <h3 class="prize-name">{{ round.prize.name }}</h3>
        <div class="prize-meta">
          <span class="meta-tag level">{{ prizeLevel }}</span>
          <span class="meta-tag count">× {{ round.winnerCount }}</span>
        </div>
      </div>
    </div>

    <!-- 进行中的冲刺提示 -->
    <div v-if="gameStatus === 1" class="sprint-tip">
      <span class="sprint-icon">🔥</span>
      <span>疯狂摇动中... {{ playerCount }} 人参与</span>
      <span class="sprint-icon">🔥</span>
    </div>
  </div>

  <!-- 空状态奖品卡片 -->
  <div class="prize-card prize-empty" v-else>
    <div class="empty-icon">🎁</div>
    <p>请先选择游戏场次</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getPrizeLevel } from "../composables/utils";

const props = defineProps({
  round: {
    type: Object,
    default: null,
  },
  gameStatus: {
    type: Number,
    default: -1,
  },
  showCountdown: {
    type: Boolean,
    default: false,
  },
  prepareCountdown: {
    type: Number,
    default: 5,
  },
  remainTime: {
    type: Number,
    default: 0,
  },
  countdownOffset: {
    type: Number,
    default: 0,
  },
  playerCount: {
    type: Number,
    default: 0,
  },
});

const prizeLevel = computed(() => getPrizeLevel(props.round?.prize?.level));
</script>

<style lang="scss" scoped>
$primary-red: #e63946;
$primary-gold: #ffd700;
$bg-card: rgba(40, 15, 15, 0.95);

.prize-card {
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
  position: relative;

  &.prize-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;

    .empty-icon {
      font-size: 60px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      font-size: 16px;
      opacity: 0.6;
      margin: 0;
    }
  }
}

.prize-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 14px;
  background: linear-gradient(135deg, $primary-gold, #ffaa00);
  color: #1a0a0a;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  z-index: 1;
}

.prize-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 24px 24px;
}

.prize-image-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 16px;

  .prize-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 16px;
  }

  .prize-shine {
    position: absolute;
    inset: -10px;
    background: radial-gradient(
      circle,
      rgba(255, 215, 0, 0.2) 0%,
      transparent 70%
    );
    animation: shine 3s ease-in-out infinite;
  }
}

@keyframes shine {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.prize-countdown-area {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
}

.countdown-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &.ready-countdown {
    .countdown-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .countdown-big {
      font-size: 80px;
      font-weight: 700;
      color: $primary-gold;
      text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
      animation: pulse-number 1s ease-in-out infinite;
    }
  }

  &.playing-countdown {
    .countdown-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .countdown-ring {
      position: relative;
      width: 100px;
      height: 100px;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);

        .ring-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.1);
          stroke-width: 6;
        }

        .ring-progress {
          fill: none;
          stroke: $primary-gold;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 283; // 2 * PI * 45
          transition: stroke-dashoffset 1s linear;
        }
      }

      .countdown-value {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 36px;
        font-weight: 700;
        color: $primary-gold;
      }
    }

    .countdown-unit {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  &.finished {
    .finished-icon {
      font-size: 50px;
    }

    .finished-text {
      font-size: 18px;
      font-weight: 600;
      color: $primary-gold;
    }
  }

  &.waiting {
    .waiting-icon {
      font-size: 40px;
      opacity: 0.6;
    }

    .waiting-text {
      font-size: 16px;
      opacity: 0.6;
    }
  }
}

@keyframes pulse-number {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.prize-info {
  text-align: center;

  .prize-name {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px;
    color: #fff;
  }

  .prize-meta {
    display: flex;
    justify-content: center;
    gap: 10px;

    .meta-tag {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.level {
        background: rgba(255, 215, 0, 0.15);
        color: $primary-gold;
        border: 1px solid rgba(255, 215, 0, 0.3);
      }

      &.count {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    }
  }
}

.sprint-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(
    to right,
    rgba(230, 57, 70, 0.2),
    rgba(255, 107, 107, 0.2)
  );
  border-top: 1px solid rgba(230, 57, 70, 0.3);
  font-size: 14px;
  color: #ff6b6b;
  animation: sprint-pulse 1s ease-in-out infinite;

  .sprint-icon {
    animation: shake 0.5s ease-in-out infinite;
  }
}

@keyframes sprint-pulse {
  0%,
  100% {
    background: linear-gradient(
      to right,
      rgba(230, 57, 70, 0.2),
      rgba(255, 107, 107, 0.2)
    );
  }
  50% {
    background: linear-gradient(
      to right,
      rgba(230, 57, 70, 0.3),
      rgba(255, 107, 107, 0.3)
    );
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}
</style>
