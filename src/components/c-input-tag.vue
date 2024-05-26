<script setup lang="ts">

import { computed, PropType, ref } from 'vue';

const props = defineProps({
  id: {type:String, required:true},
  modelValue: {type:String, required: true},
  label: {type:String, default: ""},
  hint: {type:String, default: ""},
  options: {type: Array as PropType<string[]>, required: true}
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

// const selected = ref("");

const options = ref(props.options);
const filteredOptions = computed(() => {
  return options.value.filter(option => option.includes(value.value))
});

</script>

<template>
  <q-input
    v-model="value"
    :label="label"
    :hint="hint"
    :list="id + '-list'"
  >
    <datalist :id="id + '-list'">
      <option v-for="option in filteredOptions" :value="option"></option>
    </datalist>
    <template v-slot:append>
      <q-icon v-if="value" name="cancel" @click.stop.prevent="value = ''" class="cursor-pointer" />
    </template>
  </q-input>

</template>