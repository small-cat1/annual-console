import { getCurrentRound, getRoundList, startGame, stopGame } from "@/api/game";
import { useActivityStore } from "@/store/activity";
import { useWebSocketStore } from "@/store/websocket";
import { computed, ref, watch } from "vue";

export function useGameLogic() {
  const activityStore = useActivityStore();
  const wsStore = useWebSocketStore();

  // 场次相关
  const roundList = ref([]);
  const selectedRoundId = ref("");
  const currentRound = ref(null);

  // 游戏状态 -1:未选择 0:已选择待开始 1:进行中 2:已结束
  const gameStatus = ref(-1);
  const playerCount = ref(0);

  // ⭐ 改用 endTime 替代 remainTime
  const endTime = ref(0); // 游戏结束时间戳（毫秒）
  const totalTime = ref(30); // 游戏总时长（秒）
  const currentTime = ref(Date.now()); // 当前时间（用于触发 computed 更新）

  // 5秒准备倒计时
  const showCountdown = ref(false);
  const prepareCountdown = ref(5);

  // 排行榜与中奖
  const rankingList = ref([]);
  const prevRankingMap = ref({});
  const winners = ref([]);

  // 弹窗
  const showPasswordDialog = ref(false);
  const showWinnerModal = ref(false);
  const showCelebration = ref(false);
  const password = ref("");
  const startLoading = ref(false);

  // 定时器
  let countdownTimer = null;
  let timeUpdateTimer = null; // 用于更新 currentTime

  // WebSocket 订阅
  let unsubscribeRankingUpdate = null;
  let unsubscribeGameStart = null;
  let unsubscribeGameStop = null;

  // ==================== Computed ====================

  // ⭐ 剩余时间（自动计算）
  const remainTime = computed(() => {
    if (!endTime.value || gameStatus.value !== 1) return 0;
    const remain = Math.ceil((endTime.value - currentTime.value) / 1000);
    return Math.max(0, remain);
  });

  const availableRounds = computed(() => {
    return roundList.value.filter((r) => r.status !== 2);
  });

  const statusClass = computed(() => {
    const map = {
      "-1": "",
      0: "is-ready",
      1: "is-playing",
      2: "is-finished",
    };
    return map[gameStatus.value] || "";
  });

  const statusText = computed(() => {
    const map = {
      "-1": "选择场次",
      0: "准备就绪",
      1: "进行中",
      2: "已结束",
    };
    return map[gameStatus.value] || "未知";
  });

  const countdownOffset = computed(() => {
    const circumference = 2 * Math.PI * 45;
    const progress = remainTime.value / totalTime.value;
    return circumference * (1 - progress);
  });

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

  // ==================== 时间更新 ====================

  // ⭐ 启动时间更新器（每秒更新 currentTime）
  const startTimeUpdater = () => {
    if (timeUpdateTimer) return;

    timeUpdateTimer = setInterval(() => {
      currentTime.value = Date.now();

      // 检查游戏是否结束
      if (gameStatus.value === 1 && remainTime.value <= 0) {
        stopTimeUpdater();
        requestStopGame();
      }
    }, 1000);
  };

  // 停止时间更新器
  const stopTimeUpdater = () => {
    if (timeUpdateTimer) {
      clearInterval(timeUpdateTimer);
      timeUpdateTimer = null;
    }
  };

  // ⭐ 监听页面可见性变化（手机黑屏恢复）
  const handleVisibilityChange = () => {
    if (!document.hidden && gameStatus.value === 1) {
      // 页面恢复，立即更新时间
      currentTime.value = Date.now();

      // 如果游戏已结束
      if (remainTime.value <= 0) {
        requestStopGame();
      }
    }
  };

  // ==================== WebSocket ====================

  const handleRankingUpdate = (data) => {
    console.log("收到排名更新:", data);
    if (data.ranking) {
      updateRanking(data.ranking);
    }
    if (data.playerCount !== undefined) {
      playerCount.value = data.playerCount;
    }
  };

  // ⭐ 处理游戏开始广播
  const handleGameStart = (data) => {
    console.log("收到游戏开始广播:", data);
    if (data.endTime) {
      endTime.value = data.endTime;
      totalTime.value = data.duration || 30;
      gameStatus.value = 1;
      startTimeUpdater();
    }
  };

  // ⭐ 处理游戏结束广播
  const handleGameStop = (data) => {
    console.log("收到游戏结束广播:", data);
    stopTimeUpdater();
    gameStatus.value = 2;
  };

  const updateRanking = (newList) => {
    newList.forEach((item) => {
      const prev = prevRankingMap.value[item.userId];
      if (prev) {
        const delta = item.score - prev.score;
        item.scoreDelta = delta > 0 ? delta : 0;
        item.scoreUp = delta > 0;
        item.isActive = delta > 0;
      } else {
        item.scoreDelta = 0;
        item.scoreUp = false;
        item.isActive = true;
      }

      setTimeout(() => {
        item.scoreUp = false;
        item.scoreDelta = 0;
      }, 500);
    });

    prevRankingMap.value = {};
    newList.forEach((item) => {
      prevRankingMap.value[item.userId] = { score: item.score };
    });

    rankingList.value = newList;
  };

  const subscribeWebSocket = () => {
    unsubscribeRankingUpdate = wsStore.subscribe(
      "ranking_update",
      handleRankingUpdate
    );

    // ⭐ 订阅游戏开始/结束事件
    unsubscribeGameStart = wsStore.subscribe("game_start", handleGameStart);

    unsubscribeGameStop = wsStore.subscribe("game_stop", handleGameStop);
  };

  const unsubscribeAll = () => {
    if (unsubscribeRankingUpdate) {
      unsubscribeRankingUpdate();
      unsubscribeRankingUpdate = null;
    }
    if (unsubscribeGameStart) {
      unsubscribeGameStart();
      unsubscribeGameStart = null;
    }
    if (unsubscribeGameStop) {
      unsubscribeGameStop();
      unsubscribeGameStop = null;
    }
  };

  // 重连时重新订阅
  watch(
    () => wsStore.isConnected,
    (connected) => {
      if (connected) {
        unsubscribeAll();
        subscribeWebSocket();
      }
    },
    { immediate: true }
  );

  // ==================== API 调用 ====================

  const fetchRoundList = async () => {
    try {
      const res = await getRoundList(activityStore.activityId);
      if (res.code === 0) {
        roundList.value = res.data?.list || [];
      }
    } catch (e) {
      console.error("获取场次列表失败", e);
    }
  };

  const checkCurrentRound = async () => {
    try {
      const res = await getCurrentRound(activityStore.activityId);
      if (res.code === 0 && res.data?.round) {
        currentRound.value = res.data.round;
        selectedRoundId.value = res.data.round.id;
        gameStatus.value = res.data.status;
        totalTime.value = res.data.round.duration || 30;

        if (res.data.ranking) {
          rankingList.value = res.data.ranking;
        }

        if (res.data.playerCount !== undefined) {
          playerCount.value = res.data.playerCount;
        }

        // ⭐ 使用 endTime
        if (res.data.status === 1 && res.data.endTime) {
          console.log("恢复进行中的游戏，endTime:", res.data.endTime);
          endTime.value = res.data.endTime;
          currentTime.value = Date.now();
          startTimeUpdater();
        }

        return true;
      }
      return false;
    } catch (e) {
      console.error("检查当前场次失败", e);
      return false;
    }
  };

  // ==================== 游戏操作 ====================

  // 点击开始按钮
  const handleStart = () => {
    if (!password.value) return;
    showPasswordDialog.value = false;
    startPrepareCountdown(5);
  };

  // 5秒准备倒计时
  const startPrepareCountdown = (seconds = 5) => {
    showCountdown.value = true;
    prepareCountdown.value = seconds;

    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      prepareCountdown.value--;
      if (prepareCountdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        showCountdown.value = false;
        requestStartGame();
      }
    }, 1000);
  };

  // 请求后端开始游戏
  const requestStartGame = async () => {
    startLoading.value = true;
    try {
      const res = await startGame(currentRound.value.id, password.value);
      if (res.code === 0) {
        password.value = "";

        // ⭐ 使用返回的 endTime
        if (res.data?.endTime) {
          endTime.value = res.data.endTime;
          currentTime.value = Date.now();
          gameStatus.value = 1;
          startTimeUpdater();
        }
      } else {
        alert(res.msg || "开始游戏失败");
        gameStatus.value = 0;
      }
    } catch (e) {
      console.error("开始游戏失败", e);
      alert("开始游戏失败，请重试");
      gameStatus.value = 0;
    } finally {
      startLoading.value = false;
    }
  };

  // 请求后端结束游戏
  const requestStopGame = async () => {
    try {
      const res = await stopGame(currentRound.value.id);
      if (res.code === 0) {
        stopTimeUpdater();
        gameStatus.value = 2;

        if (res.data?.winners && res.data.winners.length > 0) {
          winners.value = res.data.winners;
          showCelebration.value = true;
        }

        if (res.data?.ranking) {
          updateRanking(res.data.ranking);
        }
      } else {
        alert(res.msg || "结束游戏失败");
      }
    } catch (e) {
      console.error("结束游戏失败", e);
    }
  };

  // 手动停止游戏
  const handleStop = async () => {
    if (!confirm("确定要立即结束游戏吗？")) return;
    stopTimeUpdater();
    await requestStopGame();
  };

  // 下一场
  const handleNextRound = () => {
    resetGame();
    fetchRoundList();
  };

  // 重置游戏状态
  const resetGame = () => {
    currentRound.value = null;
    gameStatus.value = -1;
    selectedRoundId.value = "";
    rankingList.value = [];
    winners.value = [];
    prevRankingMap.value = {};
    playerCount.value = 0;
    endTime.value = 0;
    stopTimeUpdater();
  };

  // 关闭庆祝弹窗
  const closeCelebration = () => {
    showCelebration.value = false;
    showWinnerModal.value = true;
  };

  // 监听场次选择
  watch(selectedRoundId, (newId) => {
    if (newId && gameStatus.value === -1) {
      const round = roundList.value.find((r) => r.id === Number(newId));
      if (round) {
        currentRound.value = round;
        totalTime.value = round.duration || 30;
        gameStatus.value = 0;
      }
    }
  });

  // 初始化
  const initGameData = async () => {
    // 添加页面可见性监听
    document.addEventListener("visibilitychange", handleVisibilityChange);

    await fetchRoundList();
    await checkCurrentRound();

    if (wsStore.isConnected) {
      unsubscribeAll();
      subscribeWebSocket();
    }
  };

  // 清理
  const cleanup = () => {
    unsubscribeAll();
    stopTimeUpdater();
    if (countdownTimer) clearInterval(countdownTimer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  return {
    activityStore,
    wsStore,
    roundList,
    selectedRoundId,
    currentRound,
    gameStatus,
    playerCount,
    remainTime, // computed，自动计算
    totalTime,
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
  };
}
