<template>
  <div class="ranking-panel">
    <div class="panel-header">
      <span class="panel-icon">🏆</span>
      <h2>实时排行榜</h2>
      <span class="player-count" v-if="playerCount > 0">
        <span class="count-num">{{ playerCount }}</span> 人参与
      </span>
    </div>

    <div class="ranking-body">
      <!-- 排行榜列表 -->
      <div class="ranking-list" v-if="list.length > 0">
        <TransitionGroup name="ranking">
          <div
            v-for="(item, index) in list"
            :key="item.userId"
            class="ranking-item"
            :class="{
              'is-winner': index < winnerCount,
              'is-shaking': gameStatus === 1 && item.isActive,
            }"
          >
            <div class="rank-badge" :class="'rank-' + (index + 1)">
              <span v-if="index === 0">🥇</span>
              <span v-else-if="index === 1">🥈</span>
              <span v-else-if="index === 2">🥉</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <img
              :src="item.user?.avatar || defaultAvatar"
              class="ranking-avatar"
            />
            <div class="ranking-info">
              <span class="ranking-name">{{
                item.user?.realName || item.user?.nickname || "未知"
              }}</span>
              <span class="ranking-dept">{{
                item.user?.department || ""
              }}</span>
            </div>
            <div class="ranking-score">
              <span
                class="score-value"
                :class="{ 'score-up': item.scoreUp }"
              >{{ item.score }}</span>
              <span class="score-label">次</span>
            </div>
            <!-- 分数增加动画 -->
            <div v-if="item.scoreDelta > 0" class="score-delta">
              +{{ item.scoreDelta }}
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <span class="empty-icon">📊</span>
        <p>{{ hasRound ? "等待玩家参与..." : "请先选择场次" }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DEFAULT_AVATAR } from "../composables/utils";

defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  playerCount: {
    type: Number,
    default: 0,
  },
  winnerCount: {
    type: Number,
    default: 3,
  },
  gameStatus: {
    type: Number,
    default: -1,
  },
  hasRound: {
    type: Boolean,
    default: false,
  },
});

const defaultAvatar = DEFAULT_AVATAR;
</script>

<style lang="scss" scoped>
$primary-gold: #ffd700;
$bg-card: rgba(40, 15, 15, 0.95);

.ranking-panel {
  flex: 1;
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
    color: $primary-gold;
  }

  .player-count {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);

    .count-num {
      color: $primary-gold;
      font-weight: 600;
    }
  }
}

.ranking-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid transparent;
  position: relative;
  transition: all 0.3s;

  &.is-winner {
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.1),
      rgba(255, 170, 0, 0.05)
    );
    border-color: rgba(255, 215, 0, 0.3);
  }

  &.is-shaking {
    animation: item-shake 0.3s ease-in-out;
  }
}

@keyframes item-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  &.rank-1 {
    background: linear-gradient(135deg, #ffd700, #ffaa00);
    color: #1a0a0a;
    font-size: 16px;
  }

  &.rank-2 {
    background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
    color: #1a0a0a;
    font-size: 16px;
  }

  &.rank-3 {
    background: linear-gradient(135deg, #cd7f32, #b8860b);
    color: #fff;
    font-size: 16px;
  }
}

.ranking-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
  flex-shrink: 0;
}

.ranking-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;

  .ranking-name {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ranking-dept {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;
  }
}

.ranking-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;

  .score-value {
    font-size: 20px;
    font-weight: 700;
    color: $primary-gold;
    transition: all 0.3s;

    &.score-up {
      transform: scale(1.2);
      color: #ff6b6b;
    }
  }

  .score-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.score-delta {
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: 600;
  color: #4caf50;
  animation: float-up 0.5s ease-out forwards;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(-50%);
  }
  100% {
    opacity: 0;
    transform: translateY(-80%);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    font-size: 50px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    opacity: 0.6;
    margin: 0;
  }
}

// 排行榜过渡动画
.ranking-move,
.ranking-enter-active,
.ranking-leave-active {
  transition: all 0.5s ease;
}

.ranking-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.ranking-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.ranking-leave-active {
  position: absolute;
}
</style>
