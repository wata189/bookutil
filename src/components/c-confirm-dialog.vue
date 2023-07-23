<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({
  modelValue: {type:Boolean, required: true},
  headerText: {type:String, required: true},
  okLabel: {type:String, default: "OK"},
  cancelLabel: {type:String, default: "キャンセル"},
  isError: {type:Boolean, default: false},
  isNegative: {type:Boolean, default: false},
  next: {type:Function}
});
const emits = defineEmits(["update:modelValue"]);
const value = computed({
  get() {
    return props.modelValue
  },
  set(value){
    emits("update:modelValue", value)
  }
});

// isError, isNegativeを参照してスタイル設定
const isNegativeColor = computed(() => {
  return props.isNegative || props.isError
});
const isShowSeparator = computed(() => {
  return !isNegativeColor.value;
});
const headerClass = computed(() => {
  return isNegativeColor.value ? "bg-negative text-white" : "";
});
const bodyClass = computed(() => {
  return isNegativeColor.value ? "bg-red-5 text-white" : "";
});
const footerClass = computed(() => {
  return isNegativeColor.value ? "bg-red-5 text-white" : "";
});
const cancelBtnColor = computed(() => {
  return isNegativeColor.value ? "white" : "secondary";
});
const okBtnColor = computed(() => {
  return isNegativeColor.value ? "white" : "primary";
});

const ok = () => {
  value.value = false;
  if(props.next){
    props.next();
  }
}
</script>

<template>
  <q-dialog
    v-model="value"
    persistent
  >
    <q-card class="confirm-dialog-card">
      <q-card-section class="row" :class="headerClass">
        <div class="text-h6">{{ headerText.trim() }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator v-if="isShowSeparator"></q-separator>

      <q-card-section :class="bodyClass">
        <div class="confirm-dialog-content">
          <slot></slot>
        </div>
      </q-card-section>


      <q-card-actions class="row" :class="footerClass">
        <q-btn v-if="!isError" flat :label="cancelLabel" :color="cancelBtnColor" v-close-popup />
        <q-space />
        <q-btn flat :label="okLabel" :color="okBtnColor" @click="ok"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>


<style scoped>
.confirm-dialog-card{
  min-width: 300px;
}
.confirm-dialog-content{
  white-space: pre-line;
}
</style>