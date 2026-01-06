import {
  getCurrentRound,
  getRoundList,
  getWinners,
  startGame,
  stopGame,
} from "@/api/game";
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
  const remainTime = ref(0);
  const totalTime = ref(30);

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
  let gameTimer = null;

  // WebSocket 订阅
  let unsubscribeRankingUpdate = null;

  // ==================== Computed ====================

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
  };

  const unsubscribeAll = () => {
    if (unsubscribeRankingUpdate) unsubscribeRankingUpdate();
  };

  watch(
    () => wsStore.isConnected,
    (connected) => {
      if (connected) {
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
        remainTime.value = res.data.remaining || 0;
        totalTime.value = res.data.round.duration || 30;

        if (res.data.ranking) {
          rankingList.value = res.data.ranking;
        }

        return true;
      }
      return false;
    } catch (e) {
      console.error("检查当前场次失败", e);
      return false;
    }
  };

  const fetchWinners = async () => {
    if (!currentRound.value) return;

    try {
      const res = await getWinners(currentRound.value.id);
      if (res.code === 0) {
        winners.value = res.data?.list || [];
      }
    } catch (e) {
      console.error("获取中奖名单失败", e);
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
    try {
      const res = await startGame(currentRound.value.id, password.value);
      if (res.code === 0) {
        password.value = "";
        startGameCountdown();
      } else {
        alert(res.msg || "开始游戏失败");
        gameStatus.value = 0;
      }
    } catch (e) {
      console.error("开始游戏失败", e);
      alert("开始游戏失败，请重试");
      gameStatus.value = 0;
    }
  };

  // 开始游戏倒计时
  const startGameCountdown = () => {
    gameStatus.value = 1;
    remainTime.value = totalTime.value;

    if (gameTimer) clearInterval(gameTimer);

    gameTimer = setInterval(() => {
      if (remainTime.value > 0) {
        remainTime.value--;
      } else {
        clearInterval(gameTimer);
        gameTimer = null;
        requestStopGame();
      }
    }, 1000);
  };

  // 请求后端结束游戏
  const requestStopGame = async () => {
    try {
      const res = await stopGame(currentRound.value.id);
      if (res.code === 0) {
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

    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }

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
    remainTime.value = 0;
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
    await fetchRoundList();
    await checkCurrentRound();

    if (wsStore.isConnected) {
      subscribeWebSocket();
    }
  };

  // 清理
  const cleanup = () => {
    unsubscribeAll();
    if (countdownTimer) clearInterval(countdownTimer);
    if (gameTimer) clearInterval(gameTimer);
  };

  return {
    activityStore,
    wsStore,
    roundList,
    selectedRoundId,
    currentRound,
    gameStatus,
    playerCount,
    remainTime,
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