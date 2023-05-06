<script setup lang="ts">

interface Props {
  title:string,
  icon:string,
  to?:string
};
const props = defineProps<Props>();

const emits = defineEmits(["click"]);
</script>

<template>
  <q-btn 
    flat
    round
    :title="props.title"
    :icon="props.icon"
    :to="props.to"
    @click="emits('click')"
  >
    <slot></slot>
  </q-btn>
</template>