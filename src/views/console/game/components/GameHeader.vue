<template>
  <header class="game-header">
    <div class="header-left">
      <button class="back-btn" @click="$emit('back')">
        <span>←</span>
        返回控制台
      </button>
    </div>

    <div class="header-center">
      <span class="logo-icon">🎮</span>
      <h1>{{ title }}</h1>
    </div>

    <div class="header-right">
      <!-- 场次选择 -->
      <div class="round-selector">
        <select
          :value="modelValue"
          class="round-select"
          :disabled="disabled"
          @change="$emit('update:modelValue', $event.target.value)"
        >
          <option value="">选择场次</option>
          <option
            v-for="round in rounds"
            :key="round.id"
            :value="round.id"
          >
            {{ round.roundName }}
          </option>
        </select>
      </div>

      <!-- 控制按钮组 -->
      <div class="control-btn-group">
        <!-- 未开始/已选择场次：开始按钮 -->
        <button
          v-if="gameStatus === -1 || gameStatus === 0"
          class="btn btn-gold"
          :class="{ 'btn-glow': modelValue && gameStatus === 0 }"
          :disabled="!modelValue || showCountdown"
          @click="$emit('showPassword')"
        >
          <span class="btn-icon">▶️</span>
          开始游戏
        </button>

        <!-- 进行中：停止按钮 -->
        <button
          v-else-if="gameStatus === 1"
          class="btn btn-danger"
          @click="$emit('stop')"
        >
          <span class="btn-icon">⏹️</span>
          立即结束
        </button>

        <!-- 已结束：查看名单 + 下一场 -->
        <template v-else-if="gameStatus === 2">
          <button class="btn btn-primary" @click="$emit('showWinners')">
            <span class="btn-icon">📋</span>
            中奖名单
          </button>
          <button class="btn btn-gold" @click="$emit('nextRound')">
            <span class="btn-icon">➡️</span>
            下一场
          </button>
        </template>
      </div>

      <!-- 状态指示 -->
      <div class="status-area">
        <!-- WebSocket 连接状态 -->
        <span class="ws-indicator" :class="wsStatus">
          <span class="ws-dot"></span>
          {{ wsStatusText }}
        </span>
        <!-- 游戏状态 -->
        <span class="status-tag" :class="statusClass">
          <span class="status-dot"></span>
          {{ statusText }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "摇一摇大作战",
  },
  modelValue: {
    type: [String, Number],
    default: "",
  },
  rounds: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  gameStatus: {
    type: Number,
    default: -1,
  },
  showCountdown: {
    type: Boolean,
    default: false,
  },
  wsStatus: {
    type: String,
    default: "disconnected",
  },
  wsStatusText: {
    type: String,
    default: "未连接",
  },
  statusClass: {
    type: String,
    default: "",
  },
  statusText: {
    type: String,
    default: "选择场次",
  },
});

defineEmits([
  "update:modelValue",
  "back",
  "showPassword",
  "stop",
  "showWinners",
  "nextRound",
]);
</script>

<style lang="scss" scoped>
$primary-red: #e63946;
$primary-gold: #ffd700;
$dark-red: #9b1b30;
$text-light: #fff5e6;

.game-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header-left {
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }
  }
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;

  .logo-icon {
    font-size: 32px;
  }

  h1 {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, $primary-gold, #fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.round-selector {
  .round-select {
    padding: 10px 32px 10px 14px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffd700' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;

    &:focus {
      outline: none;
      border-color: $primary-gold;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    option {
      background: #1a0a0a;
      color: #fff;
    }
  }
}

.control-btn-group {
  display: flex;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  .btn-icon {
    font-size: 16px;
  }

  &.btn-gold {
    background: linear-gradient(135deg, $primary-gold, #ffaa00);
    color: #1a0a0a;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
    }

    &.btn-glow {
      animation: glow 2s ease-in-out infinite;
    }
  }

  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, $dark-red);
    color: #fff;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
  }

  &.btn-danger {
    background: linear-gradient(135deg, #ff4444, #cc0000);
    color: #fff;
    box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(255, 215, 0, 0.7),
      0 0 60px rgba(255, 215, 0, 0.3);
  }
}

.status-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ws-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .ws-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
  }

  &.connected {
    border-color: rgba(76, 175, 80, 0.4);
    .ws-dot {
      background: #4caf50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    }
  }

  &.connecting {
    border-color: rgba(255, 193, 7, 0.4);
    .ws-dot {
      background: #ffc107;
      animation: blink 1s infinite;
    }
  }
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
  }

  &.is-ready {
    border-color: rgba(33, 150, 243, 0.4);
    .status-dot {
      background: #2196f3;
    }
  }

  &.is-playing {
    border-color: rgba(76, 175, 80, 0.4);
    .status-dot {
      background: #4caf50;
      animation: pulse 1s infinite;
    }
  }

  &.is-finished {
    border-color: rgba(156, 39, 176, 0.4);
    .status-dot {
      background: #9c27b0;
    }
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

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 16px;

    .header-center {
      order: -1;
      width: 100%;
      justify-content: center;
    }

    .header-right {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
