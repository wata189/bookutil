<script setup lang="ts">
import { computed, ref } from "vue";
import { Dark } from "quasar";
import { onMounted } from "@vue/runtime-core";
import { useRouter } from "vue-router";

import CRoundBtn from "@/components/c-round-btn.vue";

import authUtil from "@/modules/authUtil";
import util from "@/modules/util";

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
  user: User
};
const props = defineProps<Props>();


// ダークモード情報をlocalstorageから取り出して設定
const isDarkMode = ref(false);
if(localStorage.isDarkMode === "true"){
  isDarkMode.value = true;
}

const themeChangeTitle = computed(() => {
  const pre = isDarkMode.value ? "ライト" : "ダーク";
  return pre + "モードに切り替え";
});
const themeChangeIcon = computed(() => {
  return isDarkMode.value ? "dark_mode" : "light_mode";
});

const toggleMode = () => {
  setMode(!isDarkMode.value); //ダークモードをトグルして設定
};
const setMode = (isDark: boolean) => {
  isDarkMode.value = isDark;
  Dark.set(isDark);

  // ダークモードの値をlocalStorageに保存
  localStorage.isDarkMode = isDark;
};

const iconSize = "24px";4

const iconSrc = util.getIconHref();

onMounted(async () => {
  setMode(isDarkMode.value);
});

</script>

<template>
  <q-header reveal elevated :class="isDarkMode ? 'bg-dark' : 'bg-white text-black'">
    <q-toolbar>
      <q-toolbar-title shrink class="toolbar-title">
        <div @click="router.push('/')">
          <q-img :src="iconSrc" :width="iconSize" :height="iconSize" class="text-primary vertical-middle"></q-img>
          <span class="vertical-middle q-mx-sm">{{ props.pageName }}</span>
        </div>
      </q-toolbar-title>

      <q-space></q-space>

      <!-- ヘッダーの遷移アイコンは引数からurlとアイコンと名前受け取る -->
      <c-round-btn
        v-for="menu in menus"
        :title="menu.name"
        :icon="menu.icon"
        :to="menu.to"
      />
      <q-separator vertical inset />
      <c-round-btn
        :title="themeChangeTitle"
        :icon="themeChangeIcon"
        @click="toggleMode"
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