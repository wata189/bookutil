<script setup lang="ts">
import CHeader from '@/components/c-header.vue';

import { onMounted } from '@vue/runtime-core';
import { ref } from '@vue/reactivity';

import util from '@/modules/util';
import authUtil from '@/modules/authUtil'
import { Ref } from 'vue';


const pageName = 'Bookutil';

interface Menu {
  name: string,
  to: string,
  icon: string,
  description: string
};
const menus:Ref<Menu[]> = ref([]);
const setMenus = (fetchedMenus:Menu[]) => {
  menus.value = fetchedMenus;
};

const user = ref({email:""});

type ErrorDialog = {
  isShow: boolean,
  status: number | null,
  statusText: string,
  msg: string
}
const errorDialog:Ref<ErrorDialog> = ref({
  isShow: false,
  status: null,
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

});
</script>

<template>
  <q-layout>
    <c-header
      :page-name="pageName"
      :menus="menus"
      :user="user"
      @fetch-menus="setMenus"
      @show-error-dialog="showErrorDialog"
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
          <span class="text-h6"><span v-if="errorDialog.status">{{ errorDialog.status }} </span>{{ errorDialog.statusText }}</span>
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
