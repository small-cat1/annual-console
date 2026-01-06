<template>
  <Teleport to="body">
    <div
      class="modal-overlay celebration-overlay"
      v-if="show"
      @click.self="$emit('close')"
    >
      <div class="celebration-content">
        <!-- 彩带 -->
        <div class="confetti-container">
          <div
            v-for="i in 50"
            :key="i"
            class="confetti"
            :style="getConfettiStyle(i)"
          ></div>
        </div>

        <div class="celebration-main">
          <div class="celebration-icon">🎉</div>
          <h2>游戏结束!</h2>
          <p>恭喜以下 {{ winners.length }} 位幸运儿获奖</p>

          <div class="winner-showcase">
            <div
              v-for="(winner, index) in winners.slice(0, 5)"
              :key="winner.userId"
              class="winner-card"
              :style="{ animationDelay: index * 0.15 + 's' }"
            >
              <div class="winner-rank-badge">{{ index + 1 }}</div>
              <img
                :src="winner.user?.avatar || defaultAvatar"
                class="winner-avatar"
              />
              <span class="winner-name">{{
                winner.user?.realName || winner.user?.nickname
              }}</span>
              <span class="winner-score">{{ winner.score }}次</span>
            </div>
          </div>

          <div class="celebration-actions">
            <button class="btn btn-gold btn-large" @click="$emit('close')">
              查看完整名单
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { DEFAULT_AVATAR, getConfettiStyle } from "../composables/utils";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  winners: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["close"]);

const defaultAvatar = DEFAULT_AVATAR;
</script>

<style lang="scss" scoped>
$primary-gold: #ffd700;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.celebration-overlay {
  background: rgba(0, 0, 0, 0.9);
}

.celebration-content {
  position: relative;
  text-align: center;
}

.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .confetti {
    position: absolute;
    top: -10px;
    width: 10px;
    height: 10px;
    animation: confetti-fall linear infinite;
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.celebration-main {
  position: relative;
  z-index: 1;

  .celebration-icon {
    font-size: 80px;
    display: block;
    margin-bottom: 16px;
    animation: celebrate 1s ease-in-out infinite;
  }

  h2 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 8px;
    background: linear-gradient(135deg, $primary-gold, #fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 15px;
    opacity: 0.8;
    margin-bottom: 24px;
    color: #fff;
  }
}

@keyframes celebrate {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.1) rotate(-5deg);
  }
  75% {
    transform: scale(1.1) rotate(5deg);
  }
}

.winner-showcase {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .winner-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 16px;
    animation: pop-in 0.5s ease-out backwards;

    .winner-rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, $primary-gold, #ffaa00);
      color: #1a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .winner-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid $primary-gold;
    }

    .winner-name {
      font-size: 14px;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #fff;
    }

    .winner-score {
      font-size: 12px;
      color: $primary-gold;
    }
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.celebration-actions {
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 32px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    min-width: 180px;

    &.btn-gold {
      background: linear-gradient(135deg, $primary-gold, #ffaa00);
      color: #1a0a0a;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
      }
    }
  }
}
</style>
