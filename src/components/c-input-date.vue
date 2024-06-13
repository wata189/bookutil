<script setup lang="ts">

import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {type:String, required: true},
  label: {type:String, required: true},
  rules: {type:Array<((val: string) => string | true)>, default: []}
});
let value = computed({
  get(){
    return props.modelValue;
  },
  set(value){
    emits("update:modelValue", value)
  }
})
const emits = defineEmits([
  "update:modelValue"
]);

const isShow = ref(false);

</script>

<template>
  <q-input
    v-model="value"
    :rules="rules"
    mask="XXXX/XX/XX"
  >
    <template v-slot:append>
      <q-btn 
        round 
        dense 
        flat 
        icon="event"
      >
        <q-popup-proxy v-model="isShow">
          <q-date v-model="value" today-btn @update:model-value="isShow = false" />
        </q-popup-proxy>
      </q-btn>
    </template>
  </q-input>

</template>