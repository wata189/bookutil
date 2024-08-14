<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">

import { onMounted } from 'vue';

let status = "404";
let statusText = "Not Found";
let msg = "指定したページは存在しません";

onMounted(() => {
  const urlParams = (new URL(window.location.href)).searchParams;

  const urlParamStatus = urlParams.get('status');
  if(urlParamStatus){
    status = urlParamStatus;
  }
  
  const urlParamStatusText = urlParams.get('statusText');
  if(urlParamStatusText){
    statusText = urlParamStatusText;
  }
  
  const urlParamMsg = urlParams.get('msg');
  if(urlParamMsg){
    msg = urlParamMsg;
  }
});
</script>

<template>
  <q-page-container>
    <q-page>
      <div class="row justify-center q-pa-sm">
        <div class="col-auto">
          <div class="text-h1">{{ status }} {{ statusText }}</div>
          <div class="text-h2">{{ msg }}</div>
        </div>
      </div>
    </q-page>
  </q-page-container>
</template>

<style scoped>
</style>