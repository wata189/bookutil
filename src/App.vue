<script setup lang="ts">
import CHeader from '@/components/c-header.vue';

import { onMounted } from '@vue/runtime-core';
import { ref } from '@vue/reactivity';
import axiosUtil from '@/modules/axiosUtil';

const pageName = 'Bookutil'; //TODO:ページ名をページごとに取得
// TODO: メニューは権限に応じて取得
const menus = ref([]);

onMounted(async () => {
  const response = await axiosUtil.get("/menus/fetch");
  if(response){
    menus.value = response.data.menus
  }
})
</script>

<template>
  <q-layout>
    <q-page-container>
      <q-page>
        <c-header
          :page-name="pageName"
          :menus="menus"
        ></c-header>
        <q-separator></q-separator>
        <RouterView :menus="menus" />
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
