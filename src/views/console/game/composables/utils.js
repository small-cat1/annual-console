// 默认头像
export const DEFAULT_AVATAR =
  "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";

// 获取奖品等级名称
export const getPrizeLevel = (level) => {
  const map = {
    1: "特等奖",
    2: "一等奖",
    3: "二等奖",
    4: "三等奖",
    5: "参与奖",
  };
  return map[level] || "奖品";
};

// 彩带样式生成
export const getConfettiStyle = (i) => {
  const colors = [
    "#ffd700",
    "#e63946",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
  ];
  return {
    left: Math.random() * 100 + "%",
    backgroundColor: colors[i % colors.length],
    animationDelay: Math.random() * 3 + "s",
    animationDuration: Math.random() * 2 + 2 + "s",
  };
};
