<script setup lang="ts">
import CHeader from '@/components/c-header.vue';

import { onMounted } from '@vue/runtime-core';
import { ref } from '@vue/reactivity';

import util from '@/modules/util';
import authUtil from '@/modules/authUtil';
import AxiosUtil from '@/modules/axiosUtil';

// axiosUtilのインスタンス作成
// TODO:menus取得処理をc-headerに移したら削除
const emits = defineEmits(["show-error-dialog"]);
const axiosUtil = new AxiosUtil(emits);

const pageName = 'Bookutil'; //TODO:ページ名をページごとに取得
// メニューは権限に応じて取得
const menus = ref([]);

const user = ref({email:""});

const errorDialog = ref({
  isShow: false,
  status: 500,
  statusText: "",
  msg: ""
});
const showErrorDialog = (status: number, statusText: string, msg: string) => {
  // エラーダイアログ表示
  errorDialog.value = {
    isShow: true,
    status,
    statusText,
    msg
  };
};


onMounted(async () => {
  // パラメータにcodeがあったらトークンを取得
  const urlParams = (new URL(window.location.href)).searchParams;
  const code = urlParams.get('code');


  // トークン取得
  if(code){
    localStorage.code = code;
    const tokens = await authUtil.getToken(code);

    localStorage.accessToken = tokens.accessToken;
    localStorage.idToken = tokens.idToken;
  }

  // ユーザー情報取得
  const accessToken = localStorage.accessToken;
  if(accessToken){
    const userInfo = await authUtil.getUserInfo(accessToken);
    user.value = userInfo;
  }

  // メニュー情報取得
  // TODO: メニューの取得はヘッダーで行ってからRouterViewにわたす動きにすべき
  const paramAccessToken = accessToken || '';
  const response = await axiosUtil.get(`/menus/fetch?access_token=${paramAccessToken}`);
  if(response){
    menus.value = response.data.menus
  }
});
</script>

<template>
  <q-layout>
    <c-header
      :page-name="pageName"
      :menus="menus"
      :user="user"
    ></c-header>
    <q-page-container>
      <q-page>
        <RouterView 
          :menus="menus"
          @show-error-dialog="showErrorDialog"
        />
        <q-ajax-bar
          :hijak-filter="util.isUrl"
          position="bottom"
          size="15px"
        >

        </q-ajax-bar>
      </q-page>
    </q-page-container>


    <!-- エラー表示するダイアログ -->
    <q-dialog
      v-model="errorDialog.isShow"
      persistent
    >
      <q-card>
        <q-card-section class="bg-negative text-white">
          <span class="text-h6">{{ errorDialog.status }} {{ errorDialog.statusText }}</span>
        </q-card-section>
        <q-card-section class="bg-red-5 text-white">
          <span>{{ errorDialog.msg }}</span>
        </q-card-section>
        <q-card-actions class="bg-red-5 text-white" align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<style scoped>
</style>
