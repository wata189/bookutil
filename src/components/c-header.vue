<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Dark } from 'quasar';
  import { useRouter } from "vue-router";
  import CRoundBtn from '@/components/c-round-btn.vue';

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

  const router = useRouter();
  const transite = (to:string) => {
    router.push(to);
  };
</script>

<template>
  <q-toolbar>
    <!--TODO:アイコンを設定してトップ画面に遷移できるようにする-->
    <q-toolbar-title class="toolbar-title">
        <div @click="transite('/')">{{ props.pageName }}</div>
    </q-toolbar-title>

    <!-- TODO: ヘッダーの遷移アイコンは引数からurlとアイコンと名前受け取る -->
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
      @click="changeTheme"
    ></c-round-btn>
    <c-round-btn
      title="ユーザー情報"
      icon="mdi-account"
    ></c-round-btn>
  </q-toolbar>
</template>

<style scoped>
.toolbar-title{
  cursor: pointer;
}
</style>