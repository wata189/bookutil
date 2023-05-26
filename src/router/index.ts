import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'top',
    props: true,
    component: async () => {
      const top = await import('@/pages/Top.vue');
      return top;
    }
  },
  {
    path: '/top',
    name: '/top',
    props: true,
    component: async () => {
      const top = await import('@/pages/Top.vue');
      return top;
    }
  },

  {
    path: '/toread',
    name: '/toread',
    props: true,
    component: async () => {
      const toread = await import('@/pages/Toread.vue');
      return toread;
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;