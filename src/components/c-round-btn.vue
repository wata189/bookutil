<script setup lang="ts">

const props = defineProps({
  title:{type:String, default: ""},
  icon:{type:String, default: ""},
  isFlat:{type:Boolean, default: true},
  to:{type:String, default: ""},
  color:{type:String, default: ""}
});

const emits = defineEmits(["click"]);
</script>

<template>
  <q-btn 
    :flat="props.isFlat"
    round
    :color="props.color"
    :title="props.title"
    :icon="props.icon"
    :to="props.to"
    @click="emits('click')"
  >
    <slot></slot>
  </q-btn>
</template>