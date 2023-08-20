<script setup lang="ts">
import CHeader from "@/components/c-header.vue";
import CConfirmDialog from "@/components/c-confirm-dialog.vue";

import { onMounted } from "@vue/runtime-core";
import { ref } from "@vue/reactivity";
import { Ref } from "vue";
import { useQuasar } from "quasar";
const $q = useQuasar();

import util from "@/modules/util";
import authUtil from "@/modules/authUtil"

const isDev = import.meta.env.DEV;
const pageName = isDev ? "Bookutil(開発)" : "Bookutil";
const iconHref = util.getIconHref();
const head = document.querySelector("head");
head?.append(
  Object.assign(document.createElement("link"), {
    rel: "icon",
    type: "image/svg+xml",
    href: iconHref
  })
);

interface Menu {
  name: string,
  to: string,
  icon: string,
  description: string
};
const menus:Ref<Menu[]> = ref([]);

const user = ref({email:""});

type Dialog = {
  isShow: boolean,
  headerText: string,
  msg: string,
  isError?: boolean,
  next?: Function,
  isNegative?: boolean
};
const dialog:Ref<Dialog> = ref({
  isShow: false,
  headerText: "",
  msg: ""
});
const showErrorDialog = (status: number, statusText: string, msg: string) => {
  dialog.value = {
    isShow: true,
    headerText: status ? `${status} ${statusText}` : statusText,
    msg,
    isError: true
  };

  
};
const showConfirmDialog = (headerText:string, msg:string, isNegative:boolean, next:Function) => {
  dialog.value = {
    isShow: true,
    headerText,
    msg,
    next,
    isNegative
  };
}; 

const isLoading:Ref<boolean> = ref(false);
const showLoading = () => {
  isLoading.value = true;
};
const hideLoading = () => {
  isLoading.value = false;
};
const isAppLoaded = ref(false);

onMounted(async () => {
  // パラメータにcodeがあったらトークンを取得
  const urlParams = (new URL(window.location.href)).searchParams;
  const code = urlParams.get("code");

  const beforeAccessToken = await authUtil.getLocalStorageAccessToken();
  // トークン取得
  if(code && !beforeAccessToken){
    await authUtil.getToken(code);
  }

  // ユーザー情報取得
  const accessToken = await authUtil.getLocalStorageAccessToken();
  if(accessToken){
    const userInfo = await authUtil.getUserInfo(accessToken);
    user.value = userInfo;
  }

  // メニュー情報設定
  const menuValues = [
    {"name": "読みたいリスト", "to": "/toread", "icon": "format_list_bulleted", "description": "読みたい本をリスト化します。"}
  ]
  if(user.value.email){
    menuValues.push(
      {"name": "図書館リスト", "to": "/libraries", "icon": "account_balance", "description": "利用する図書館の一覧を表示します。"}
    )
  }else{
    // 未ログイン時は未ログインであることを通知する
    $q.notify({
      message: `ログインしていません。ログインしていない場合、一部の機能が制限されます。`,
      color: "negative",
      actions: [
        {icon:"close", color: "white", round: true, handler: () => {}}
      ]
    });
  }
  menus.value = menuValues;

  // Appのロード完了フラグを立てる
  isAppLoaded.value = true;

  console.log("mounted app");
});
</script>

<template>
  <q-layout>
    <c-header
      :page-name="pageName"
      :menus="menus"
      :user="user"
      :is-loading="isLoading"
      @show-error-dialog="showErrorDialog"
    ></c-header>
    <q-page-container>
      <q-page>
        <RouterView 
          :menus="menus"
          :is-app-loaded="isAppLoaded"
          @show-error-dialog="showErrorDialog"
          @show-confirm-dialog="showConfirmDialog"
        />
      </q-page>
    </q-page-container>


    <!-- ダイアログ -->
    <c-confirm-dialog
      v-model="dialog.isShow"
      :header-text="dialog.headerText"
      :is-error="dialog.isError"
      :is-negative="dialog.isNegative"
      :next="dialog.next"
    >
      {{ dialog.msg }}
    </c-confirm-dialog>

    <!-- ajax-barのhijak-filter機能でAPI叩いたのを検知して、ローディングを表示させる -->
    <q-ajax-bar
      :hijak-filter="util.isUrl"
      @start="showLoading"
      @stop="hideLoading"
      color="transparent"
    ></q-ajax-bar>

    
  </q-layout>
</template>

<style scoped>
</style>
