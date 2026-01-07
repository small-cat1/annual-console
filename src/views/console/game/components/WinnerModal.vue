<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      v-if="show"
      @click.self="$emit('close')"
    >
      <div class="modal modal-winners">
        <div class="modal-header">
          <h3>🏆 {{ roundName }} - 中奖名单</h3>
          <button class="modal-close" @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="winner-prize-info" v-if="prize">
            <img :src="getUrl(prize.image)" class="winner-prize-img" />
            <span class="winner-prize-name">{{ prize.name }}</span>
          </div>
          <div class="winner-list-full">
            <div
              v-for="(winner, index) in winners"
              :key="winner.userId"
              class="winner-row"
            >
              <span class="winner-rank" :class="'rank-' + (index + 1)">{{
                index + 1
              }}</span>
              <img
                :src="winner.user?.avatar || defaultAvatar"
                class="winner-avatar"
              />
              <div class="winner-info">
                <span class="winner-name">{{
                  winner.user?.realName || winner.user?.nickname
                }}</span>
                <span class="winner-dept">{{
                  winner.user?.department || ""
                }}</span>
              </div>
              <span class="winner-score">{{ winner.score }} 次</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="$emit('close')">
            确定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { getUrl } from "@/utils/format";
import { DEFAULT_AVATAR } from "../composables/utils";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  roundName: {
    type: String,
    default: "",
  },
  prize: {
    type: Object,
    default: null,
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
$primary-red: #e63946;
$dark-red: #9b1b30;

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

.modal {
  background: linear-gradient(135deg, rgba(40, 15, 15, 0.98), rgba(30, 10, 10, 0.98));
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  min-width: 450px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: $primary-gold;
  }

  .modal-close {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 18px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.winner-prize-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;

  .winner-prize-img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
  }

  .winner-prize-name {
    font-size: 16px;
    font-weight: 600;
    color: $primary-gold;
  }
}

.winner-list-full {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;

  .winner-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;

    .winner-rank {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;

      &.rank-1 {
        background: linear-gradient(135deg, #ffd700, #ffaa00);
        color: #1a0a0a;
      }

      &.rank-2 {
        background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
        color: #1a0a0a;
      }

      &.rank-3 {
        background: linear-gradient(135deg, #cd7f32, #b8860b);
        color: #fff;
      }
    }

    .winner-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .winner-info {
      flex: 1;
      min-width: 0;

      .winner-name {
        display: block;
        font-size: 14px;
      }

      .winner-dept {
        display: block;
        font-size: 11px;
        opacity: 0.6;
      }
    }

    .winner-score {
      font-size: 14px;
      color: $primary-gold;
      font-weight: 500;
    }
  }
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

  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, $dark-red);
    color: #fff;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(230, 57, 70, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .modal {
    min-width: 90vw;
  }
}
</style>
