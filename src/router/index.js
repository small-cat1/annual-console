import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Console",
    component: () => import("@/views/console/Index.vue"),
    meta: { title: "控制台" },
  },
  {
    path: "/game",
    name: "Game",
    component: () => import("@/views/console/Game.vue"),
    meta: { title: "游戏控制" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title
    ? `${to.meta.title} - 年会控制台`
    : "年会控制台";
  next();
});

export default router;
