<script setup lang="ts">
import { computed, ref } from "vue";
import { Dark } from "quasar";
import { onMounted } from "@vue/runtime-core";
import { useRouter } from "vue-router";

import CRoundBtn from "@/components/c-round-btn.vue";

import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  IS_DARK_MODE: "cache-isDarkMode"
};

const router = useRouter();

interface Menu {
  name: string,
  to: string,
  icon: string,
  description: string
};
interface User {
  email: string
}
interface Props {
  pageName: string,
  menus: Array<Menu>,
  user: User,
  isLoading: boolean
};
const props = defineProps<Props>();

const isDarkMode = ref(false);

const themeChangeTitle = computed(() => {
  const pre = isDarkMode.value ? "ライト" : "ダーク";
  return pre + "モードに切り替え";
});
const themeChangeIcon = computed(() => {
  return isDarkMode.value ? "dark_mode" : "light_mode";
});

const toggleMode = async () => {
  await setMode(!isDarkMode.value); //ダークモードをトグルして設定
};
const setMode = async (isDark: boolean) => {
  isDarkMode.value = isDark;
  Dark.set(isDark);

  // ダークモードの値をキャッシュに保存
  await cacheUtil.set(CACHE_KEY.IS_DARK_MODE, isDark);
};

// 認証情報以外のキャッシュをクリアして画面更新
const clearCache = async () => {
  await cacheUtil.refresh();
  window.location.reload();
};

const iconSize = "24px";

const iconSrc = util.getIconHref();

onMounted(async () => {
  // ダークモード情報をキャッシュから取り出して設定
  const cachedIsDarkMode:boolean | null = await cacheUtil.get(CACHE_KEY.IS_DARK_MODE);
  if(cachedIsDarkMode){
    isDarkMode.value = cachedIsDarkMode;
  }
  await setMode(isDarkMode.value);
});

</script>

<template>
  <q-header reveal elevated :class="isDarkMode ? 'bg-dark text-primary' : 'bg-pink-3 text-black'">
    <q-toolbar>
      <q-toolbar-title shrink class="toolbar-title">
        <div @click="router.push('/')">
          <q-img :src="iconSrc" :width="iconSize" :height="iconSize" class="text-primary vertical-middle"></q-img>
          <span class="vertical-middle q-mx-sm">{{ props.pageName }}</span>
        </div>
      </q-toolbar-title>
      <q-spinner-ios v-if="isLoading" size="36px" />

      <q-space></q-space>

      <!-- ヘッダーの遷移アイコンは引数からurlとアイコンと名前受け取る -->
      <c-round-btn
        v-for="menu in menus"
        :title="menu.name"
        :icon="menu.icon"
        :to="menu.to"
      />
      <q-separator vertical inset color="" />
      <c-round-btn
        :title="themeChangeTitle"
        :icon="themeChangeIcon"
        @click="toggleMode"
      ></c-round-btn>
      <c-round-btn
        title="キャッシュをクリアする"
        icon="cached"
        @click="clearCache"
      ></c-round-btn>
      <c-round-btn
        title="ユーザー情報"
        icon="person"
      >
        <q-menu>
          <q-list>
            <template v-if="user.email">
              <q-item v-close-popup>
                <q-item-section>{{ user.email }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="authUtil.logout">
                <q-item-section>ログアウト</q-item-section>
              </q-item>
            </template>
            <q-item v-else clickable v-close-popup @click="authUtil.login">
              <q-item-section>ログイン</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </c-round-btn>
    </q-toolbar>
  </q-header>
</template>

<style scoped>
.toolbar-title{
  cursor: pointer;
}
</style>