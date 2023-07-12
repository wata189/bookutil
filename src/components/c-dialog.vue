<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({
  modelValue: {type:Boolean, required: true},
  headerText: {type:String, required: true},
  okLabel: {type:String, default: "OK"}
});
const emits = defineEmits([
  "update:modelValue",
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
    :full-width="true"
  >
    <q-card>
      <q-card-section class="row">
        <div class="text-h6">{{ headerText }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator></q-separator>

      <q-card-section>
        <slot></slot>
      </q-card-section>

      <q-separator></q-separator>

      <q-card-section class="row">
        <q-btn flat label="閉じる" color="secondary" v-close-popup />
        <q-space />
        <q-btn flat :label="okLabel" color="primary" @click="emits('ok')"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>