<script setup lang="ts">

import { computed, PropType, ref } from 'vue';

const props = defineProps({
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

const selected = ref("");

const options = ref(props.options);
const filterFn = (val:string, update: (callbackFn: () => void) => void):void => {
  if (val === '') {
    update(() => {
      options.value = props.options

      // here you have access to "ref" which
      // is the Vue reference of the QSelect
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    options.value = props.options.filter(v => v.toLowerCase().indexOf(needle) > -1)
  })
};

const addTag = () => {
  if(value.value){
    value.value += "/" + selected.value;
  }else{
    value.value = selected.value;
  }
  // タグ検索空にする
  selected.value = "";
};

</script>

<template>
  <q-input
    v-model="value"
    :label="label"
    :hint="hint"
  >
    <template #append>
      <q-icon v-if="value" name="cancel" class="cursor-pointer" @click.stop.prevent="value = ''" />
      <q-btn round dense flat icon="local_offer">
        <q-menu fit class="q-pa-sm">
          <q-select
            v-model="selected"
            use-input
            dense
            :options="options"
            label="タグを検索"
            @filter="filterFn"
            @update:model-value="addTag()"
          ></q-select>
        </q-menu>
      </q-btn>
    </template>
  
  </q-input>

</template>