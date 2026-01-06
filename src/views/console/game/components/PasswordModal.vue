<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      v-if="show"
      @click.self="$emit('close')"
    >
      <div class="modal modal-password">
        <div class="modal-header">
          <h3>🔐 输入场次密码</h3>
          <button class="modal-close" @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>场次密码</label>
            <input
              type="password"
              :value="modelValue"
              placeholder="请输入场次密码"
              @input="$emit('update:modelValue', $event.target.value)"
              @keyup.enter="$emit('submit')"
              autofocus
            />
          </div>
          <p class="form-tip">密码在后台查看</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="$emit('close')">
            取消
          </button>
          <button
            class="btn btn-gold"
            @click="$emit('submit')"
            :disabled="!modelValue || loading"
          >
            {{ loading ? "验证中..." : "确认开始" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue", "close", "submit"]);
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

.modal {
  background: linear-gradient(135deg, rgba(40, 15, 15, 0.98), rgba(30, 10, 10, 0.98));
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  min-width: 400px;
  max-width: 90vw;
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
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 15px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: $primary-gold;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

.form-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
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

  &.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &.btn-gold {
    background: linear-gradient(135deg, $primary-gold, #ffaa00);
    color: #1a0a0a;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@media (max-width: 768px) {
  .modal {
    min-width: 90vw;
  }
}
</style>
