<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({
  modelValue: {type:Number, required: true},
  max: {type:Number, required: true}
});
const emits = defineEmits(["update:modelValue"]);
const value = computed({
  get() {
    return props.modelValue
  },
  set(value){
    // 上にスクロール
    scrollTo(0, 0)
    emits("update:modelValue", value)
  }
})
</script>

<template>
  <q-pagination
    v-model="value"
    :max="max"
    direction-links
    boundary-links
    flat
    :max-pages="5"
    color="primary"
    icon-first="skip_previous"
    icon-last="skip_next"
    icon-prev="fast_rewind"
    icon-next="fast_forward"
  />
</template>