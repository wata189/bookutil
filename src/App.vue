<script setup lang="ts">
import CHeader from "@/components/c-header.vue";
import CConfirmDialog from "@/components/c-confirm-dialog.vue";

import { onBeforeMount } from "@vue/runtime-core";
import { ref } from "@vue/reactivity";
import { Ref } from "vue";

import util from "@/modules/util";
import authUtil from "@/modules/authUtil"
import AxiosUtil from "@/modules/axiosUtil";

// axiosUtilのインスタンス作成
const emits = defineEmits(["show-error-dialog", "fetch-menus"]);
const axiosUtil = new AxiosUtil(emits);


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

const isShowInnerLoading = ref(false);
const setIsShowInnerLoading = (bool:boolean) => {
  isShowInnerLoading.value = bool
}

onBeforeMount(async () => {
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

  // メニュー情報取得
  const response = await axiosUtil.get(`/menus/fetch?access_token=${accessToken}`);
  if(response){
    menus.value = response.data.menus;
  }

});
</script>

<template>
  <q-layout>
    <c-header
      :page-name="pageName"
      :menus="menus"
      :user="user"
      @show-error-dialog="showErrorDialog"
    ></c-header>
    <q-page-container>
      <q-page>
        <RouterView 
          :menus="menus"
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
      @start="setIsShowInnerLoading(true)"
      @stop="setIsShowInnerLoading(false)"
      color="transparent"
    >

    </q-ajax-bar>
    <q-dialog
      v-model="isShowInnerLoading"
      persistent
    >
    <q-spinner-gears size="50px" color="secondary" />
    </q-dialog>

    
  </q-layout>
</template>

<style scoped>
</style>
