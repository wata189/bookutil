<script setup lang="ts">
import CRoundBtn from "@/components/c-round-btn.vue";

const props = defineProps({
  title:{type:String, default: ""},
  icon:{type:String, default: ""},
  imgUrl:{type:String, default: ""},
  isFlat:{type:Boolean, default: true},
  href:{type:String, default: ""},
  color:{type:String, default: "secondary"},
  target:{type:String, default: "_blank"},
});

const emits = defineEmits(["click"]);
</script>

<template>
  <c-round-btn 
    :flat="props.isFlat"
    :color="props.color"
    :title="props.title"
    :href="props.href"
    @click="emits('click')"
    :target="props.target"
    noopener
    norefferer
  >
    <q-icon v-if="props.icon" size="28px" :name="props.icon" />
    <q-avatar v-else size="32.58px">
      <q-img :src="props.imgUrl"></q-img>
    </q-avatar>
  </c-round-btn>
</template>