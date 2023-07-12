<script setup lang="ts">
import { computed, ref } from 'vue';
import { Dark } from 'quasar';
import { useRouter } from "vue-router";
import { onMounted } from '@vue/runtime-core';
import CRoundBtn from '@/components/c-round-btn.vue';
import authUtil from '@/modules/authUtil';

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

const router = useRouter();
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

const transite = (to:string) => {
  router.push(to);
};
const toggleMode = () => {
  setMode(!isDarkMode.value); //ダークモードをトグルして設定
};
const setMode = (isDark: boolean) => {
  isDarkMode.value = isDark;
  Dark.set(isDark);

  // ダークモードの値をlocalStorageに保存
  localStorage.isDarkMode = isDark;
};
const login = () => {
  authUtil.login();
};
const logout = () => {
  // アクセストークン初期化
  localStorage.accessToken = "";

  authUtil.logout();
};

onMounted(() => {
  setMode(isDarkMode.value);
});

</script>

<template>
  <q-header reveal elevated :class="isDarkMode ? 'bg-dark' : 'bg-white text-black'">
    <q-toolbar>
      <q-toolbar-title class="toolbar-title">
        <!--TODO:アイコンを設定-->
        <div @click="transite('/')">{{ props.pageName }}</div>
      </q-toolbar-title>

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
              <q-item clickable v-close-popup @click="logout">
                <q-item-section>ログアウト</q-item-section>
              </q-item>
            </template>
            <q-item v-else clickable v-close-popup @click="login">
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