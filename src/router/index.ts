import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "index",
    props: true,
    component: async () => {
      return await import("@/pages/Toread.vue");
    },
  },

  {
    path: "/toread",
    name: "toread",
    props: true,
    component: async () => {
      return await import("@/pages/Toread.vue");
    },
  },
  {
    path: "/bookshelf",
    name: "bookshelf",
    props: true,
    component: async () => {
      return await import("@/pages/Bookshelf.vue");
    },
  },

  {
    path: "/libraries",
    name: "libraries",
    props: true,
    component: async () => {
      return await import("@/pages/Libraries.vue");
    },
  },

  {
    path: "/newbook",
    name: "newbook",
    props: true,
    component: async () => {
      return await import("@/pages/Newbook.vue");
    },
  },

  // 404
  {
    path: "/:catchAll(.*)",
    name: "404",
    props: true,
    component: async () => {
      return await import("@/pages/404.vue");
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
