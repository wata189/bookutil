<script setup lang="ts">

import { computed } from 'vue';
import util from "@/modules/util";

const props = defineProps({
  modelValue: {type:Boolean, required: true},
  headerText: {type:String, required: true},
  okLabel: {type:String, default: "OK"},
  hideFooter: {type:Boolean, default: false},
  noPadding: {type:Boolean, default: false},
  href:{type:String, required: false}
});
const emits = defineEmits([
  "update:modelValue",
  "show",
  "ok"
]);
const value = computed({
  get() {
    return props.modelValue
  },
  set(value){
    emits("update:modelValue", value)
  }
})
</script>

<template>
  <q-dialog
    v-model="value"
    persistent
    @show="emits('show')"
  >
    <q-card :class="util.isDarkMode()? '' : 'bg-pink-2'">
      <q-card-section class="row" :class="util.isDarkMode()? '' : 'bg-pink-3'">
        <div class="text-h6">{{ headerText }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator></q-separator>

      <q-card-section class="dialog-content scroll" :class="noPadding ? 'q-pa-none' : ''">
        <slot></slot>
      </q-card-section>

      <q-separator v-if="!hideFooter"></q-separator>

      <q-card-section v-if="!hideFooter" class="row">
        <q-btn flat label="閉じる" color="secondary" v-close-popup />
        <q-space />
        <q-btn 
          flat 
          :label="okLabel" 
          color="primary" 
          :href="props.href" 
          @click="emits('ok')"
          target="_blank" 
          noopener
          norefferer
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.dialog-content{
  max-height: 70vh;
  white-space: pre-line;
}
</style>