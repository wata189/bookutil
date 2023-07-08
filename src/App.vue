<script setup lang="ts">
import CHeader from '@/components/c-header.vue';

import { onMounted } from '@vue/runtime-core';
import { ref } from '@vue/reactivity';
import axiosUtil from '@/modules/axiosUtil';
import authUtil from '@/modules/authUtil';

const pageName = 'Bookutil'; //TODO:ページ名をページごとに取得
// TODO: メニューは権限に応じて取得
const menus = ref([]);

const user = ref({email:""});

const isBookutilUrl = (url:string) => {
  return /^http/.test(url)
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
        <RouterView :menus="menus" />
        <q-ajax-bar
          :hijak-filter="isBookutilUrl"
          position="bottom"
          size="5px"
        >

        </q-ajax-bar>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style>
/* TODO:styleは共通style作る */
body {
  font-family: "BIZ UDPGothic";
}

[v-cloak] {
  display: none;
}
</style>
