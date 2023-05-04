<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Dark } from 'quasar';
import PRoundBtn from '@/components/parts/p-round-btn.vue';

  interface Menu {
    name: string,
    to: string,
    icon: string,
    description: string
  };
  interface Props {
    pageName: string,
    menus: Array<Menu>
  };

  const props = defineProps<Props>();


  const themeChangeTitle = computed(() => {
    const pre = isDarkMode.value ? "ライト" : "ダーク";
    return pre + "モードに切り替え";
  });
  const themeChangeIcon = computed(() => {
    return isDarkMode.value ? "mdi-weather-night" : "mdi-weather-sunny";
  });
  const setDarkMode = (isDark: boolean) => {
    isDarkMode.value = isDark;
    Dark.set(isDark);

    // ダークモードの値をlocalStorageに保存
    localStorage.isDarkMode = isDark;
  };
  const changeTheme = () => {
    setDarkMode(!isDarkMode.value); //ダークモードをトグルして設定
  };

  // ダークモード情報をlocalstorageから取り出して設定
  const isDarkMode = ref(false);
  if(localStorage.isDarkMode === "true"){
    isDarkMode.value = true;
  }
  setDarkMode(isDarkMode.value);
</script>

<template>
  <q-toolbar>
    <!--TODO:アイコンを設定してトップ画面に遷移できるようにする-->
    <q-toolbar-title>
        {{ props.pageName }}
    </q-toolbar-title>

    <!-- TODO: ヘッダーの遷移アイコンは引数からurlとアイコンと名前受け取る -->
    <p-round-btn
      v-for="menu in menus"
      :title="menu.name"
      :icon="menu.icon"
      :to="menu.to"
    />
    <q-separator vertical inset />
    <p-round-btn
      :title="themeChangeTitle"
      :icon="themeChangeIcon"
      @click="changeTheme"
    ></p-round-btn>
    <p-round-btn
      title="ユーザー情報"
      icon="mdi-account"
    ></p-round-btn>
  </q-toolbar>
</template>

<style scoped>
</style>