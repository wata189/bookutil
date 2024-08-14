<script setup lang="ts">
import CHeader from "@/components/c-header.vue";
import CConfirmDialog from "@/components/c-confirm-dialog.vue";

import { Ref, ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import 'animate.css';

import { NotifyUtil } from "@/modules/notifyUtil";
const notifyUtil = new NotifyUtil(useQuasar());
import util from "@/modules/util";
import authUtil from "@/modules/authUtil"
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();

const isDev = import.meta.env.DEV;
const pageName = isDev ? "(開発)" : "";
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
const menus:Ref<Menu[]> = ref([
  {
    "name": "読みたいリスト", 
    "to": "/toread", 
    "icon": "format_list_bulleted", 
    "description": `管理者が読みたい本をカード形式で表示します。
    カードにはタグを設定することができ、本のジャンルや優先度などを登録しています。
    カーリル、Amazon、国会図書館などのAPIと連携し、本の様々な情報を取得し、登録できます。
    また、登録した情報からAmazon、カーリル、ブクログなどさまざまなサービスへの検索が可能です。`}
]);

const user = ref({email:""});

type Dialog = {
  isShow: boolean,
  headerText: string,
  msg: string,
  isError?: boolean,
  next?: (() => void),
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
const showConfirmDialog = (headerText:string, msg:string, isNegative:boolean, next:(() => void)) => {
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

const setUserInfo = (userInfo: {email:string}) => {
  user.value = userInfo
  // メニュー情報設定
  const menuValues = [...menus.value];
  if(user.value.email){
    menuValues.push(
      {
        "name": "本棚", 
        "to": "/bookshelf", 
        "icon": "menu_book", 
        "description": `管理者が読んだ本をカード形式で表示します。
        カードには評価を5段階で設定することができます。`
      }
    );
    menuValues.push(
      {
        "name": "図書館リスト", 
        "to": "/libraries", 
        "icon": "account_balance", 
        "description": `管理者が利用する図書館の一覧を表示します。
        各図書館の予約画面、Googleマップ、カレンダー、図書カードのバーコードへのリンクがあります。
        また、図書館がタグに登録されている読みたいリストの本を表示できます。`
      }
    );
  }
  menus.value = menuValues;
}
onMounted(async () => {

  // ユーザー情報取得
  const userInfo = authUtil.getUserInfo();
  if(userInfo.email){
    setUserInfo(userInfo);
    // Appのロード完了フラグを立てる
    isAppLoaded.value = true;
    console.log("mounted app");
  }else{
    // authが未ロードの場合もあるので、その場合はロードを待つ
    authUtil.waitAuthStateChanged(async () => {
      const userInfo = authUtil.getUserInfo();
      setUserInfo(userInfo);
      if(!userInfo.email){
        // 未ログイン時はキャッシュ空にして、ログイン時のキャッシュが残らないようにする
        await cacheUtil.clear();
        // 未ログイン時は未ログインであることを通知する
        const message = "ログインしていません。ログインしていない場合、一部の機能が制限されます。";
        notifyUtil.notify(message, undefined, true);
      }
      isAppLoaded.value = true;
      console.log("mounted app");
    });
  }
});
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <c-header
      :page-name="pageName"
      :menus="menus"
      :user="user"
      :is-loading="isLoading"
      :is-app-loaded="isAppLoaded"
      @show-error-dialog="showErrorDialog"
    ></c-header>
    <RouterView 
      :menus="menus"
      :is-app-loaded="isAppLoaded"
      @show-error-dialog="showErrorDialog"
      @show-confirm-dialog="showConfirmDialog"
    />


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
      color="transparent"
      @start="showLoading"
      @stop="hideLoading"
    ></q-ajax-bar>

    
  </q-layout>
</template>

<style scoped>
</style>
