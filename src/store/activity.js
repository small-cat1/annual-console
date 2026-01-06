import { getActivityDetail } from "@/api/activity";
import { defineStore } from "pinia";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activityId: null,
    config: null,
    loadError: false,
    isReady: false,
    initialized: false, // 新增：标记是否完成初始化检查
  }),

  getters: {
    // 活动状态 0未开始 1进行中 2已结束
    activityStatus: (state) => {
      if (!state.config) return -1;
      return state.config.status ?? -1;
    },

    // 活动是否进行中
    isOngoing: (state) => {
      return state.config?.status === 1;
    },

    // 是否有活动ID
    hasActivityId: (state) => !!state.activityId,
    
    // 是否显示无活动提示（初始化完成且没有活动ID）
    showNoActivity: (state) => state.initialized && !state.activityId,
  },

  actions: {
    async init(activityId) {
      // 重置状态
      this.loadError = false;
      this.isReady = false;

      if (!activityId) {
        activityId = localStorage.getItem("activityId");
      }
      console.log("Activity ID:", activityId);
      if (!activityId) {
        this.activityId = null;
        this.config = null;
        this.initialized = true; // 标记初始化完成
        return false;
      }

      try {
        const res = await getActivityDetail(activityId);
        if (res.code === 0 && res.data) {
          this.activityId = Number(activityId);
          localStorage.setItem("activityId", this.activityId);
          this.config = res.data;
          this.isReady = true;
          this.initialized = true; // 标记初始化完成
          return true;
        } else {
          this.loadError = true;
          this.initialized = true; // 标记初始化完成
          return false;
        }
      } catch (e) {
        console.error("获取活动信息失败", e);
        this.loadError = true;
        this.initialized = true; // 标记初始化完成
        return false;
      }
    },
  },
});
