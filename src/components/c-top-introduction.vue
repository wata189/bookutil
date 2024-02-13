<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import CTransition from "@/components/c-transition.vue";

const props = defineProps({
  name: {type: String, required: true},
  description: {type: String, required: true},
  to: {type: String, default: "/"},
  img: {type: String || undefined, default: undefined},
  icon: {type: String || undefined, default: undefined},
  iconSize: {type: String, default: "16px"},
  class: {type: String, default: ""}
});

</script>

<template>
  <c-transition
    appear
    enter="fadeIn"
    leave="fadeOut"
  >
    <div class="introduction q-pa-md text-black">
      <div class="introduction-title" @click="router.push(props.to)">
        <div class="q-py-xl text-center">
          <q-img v-if="img" :src="img" :width="iconSize" :height="iconSize" :class="class"></q-img>
          <q-icon v-else-if="icon" :name="icon" :size="iconSize" :class="class"></q-icon>
          <span class="text-h3">{{ name }}</span>
        </div>
        <q-separator inset color="dark" />
      </div>
      
      <div class="q-py-xl introduction-description">
        {{ description }}
      </div>
      <slot></slot>
    </div>
  </c-transition>
</template>
<style scoped>
.introduction{
  height: 800px;
  font-family: "BIZ UDPMincho"
}
.introduction-description{
  font-size: 24px;
  white-space: pre-line;
}
.introduction-title{
  cursor: pointer;
}
</style>