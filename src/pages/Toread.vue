<script setup lang="ts">
  import { onMounted } from '@vue/runtime-core';
  import { ref } from '@vue/reactivity';
import axiosUtil from '@/modules/axiosUtil';

  const searchWord = ref('');
  const tags = ref('');

  const toreadTable = {
    rows: ref([]),
    columns: [],
    loading: ref(true)
  };

  const toreadTagOptions = ref([]);

  // toread画面初期化処理
  const initToread = async () => {
    const accessToken = localStorage.accessToken;
    const response = await axiosUtil.get(`/toread/init?access_token=${accessToken}`);
    if(response){
      toreadTable.rows.value = response.data.toreadRows;
      toreadTagOptions.value = response.data.toreadTags;
    }
    toreadTable.loading.value = false;
  };

  onMounted(async () => {
    await initToread();
  });
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
      <q-page>
        <q-table
          :rows="toreadTable.rows.value"
          :loading="toreadTable.loading.value"
        >

        </q-table>

      </q-page>
    </q-page-container>
    <q-footer class="bg-grey">
      <div class="row">
        <div class="col-12 col-sm-4 q-pa-sm">
          <q-input dense v-model="searchWord" label="検索"></q-input>
        </div>
        <div class="col-12 col-sm-8 q-pa-sm">
          <q-select
            use-input
            v-model="tags" 
            :options="toreadTagOptions"
            dense 
            label="タグ"
          ></q-select>
        </div>
      </div>
      <div class="row">
        <div class="col-6  col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="negative" class="full-width">一括削除</q-btn>
        </div>
        <div class="col-6  col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="primary" class="full-width">一括タグ</q-btn>
        </div>
        <div class="col-0  col-sm-3 col-md-6"></div>
        <div class="col-12 col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="primary" class="full-width">新規作成</q-btn>
        </div>
      </div>
    </q-footer>

  </q-layout>
</template>

<style scoped>
</style>