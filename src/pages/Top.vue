<script setup lang="ts">
import CTopIntroduction from "@/components/c-top-introduction.vue";

import util from "@/modules/util";
import { ref, ComputedRef, computed, onMounted, Ref } from 'vue';

interface Menu {
  name: string,
  to: string,
  icon: string,
  description: string
};
interface Props {
  menus: Array<Menu>
};
const props = defineProps<Props>();

type Introduction = {
  isVisible: Ref<boolean>
  name: string,
  description: string,
  to: string,
  img: string | undefined,
  icon: string | undefined,
  iconSize: string,
  class: string
}

const iconSize = "48px";
const introductions: ComputedRef<Introduction[]> = computed(() => {
  const intros:Introduction[] = props.menus.map(menu => {
    return {
      isVisible: ref(false),
      name: menu.name,
      description: menu.description,
      to: menu.to,
      img: undefined,
      icon: menu.icon,
      iconSize: iconSize,
      class: "text-primary vertical-top"
    }
  });

  
  intros.unshift({
    isVisible: ref(true),
    name: "Bookutil",
    description: `本に関係するさまざまな機能を詰め込んだアプリです。
    非ログイン時は読みたいリスト画面のみ表示し、管理者アカウントでログインすると全機能を表示できます。
    今のところは個人で利用していますが、部分的に機能を切り出してサービスとしてリリースすることも検討しています。`,
    to: "",
    img: util.getIconHref(),
    icon: undefined,
    iconSize: iconSize,
    class: "text-primary vertical-top"
  });


  return intros;
});

const introductionRefs = ref<HTMLImageElement[]>([]);
onMounted(() => {
  const marginBottom = 150;
  window.addEventListener("scroll", () => {
    introductionRefs.value.forEach((introductionRef, i) => {
      const top = introductionRef.getBoundingClientRect().top;
      if(!introductions.value[i].isVisible.value){
        introductions.value[i].isVisible.value = top < (window.innerHeight - marginBottom);
      }

    });

  });
});


</script>

<template>
  <div>
    <div
      v-for="introduction, i in introductions"
      ref="introductionRefs"
      :style="{height: '800px'}"
      :class="i % 2 === 1 ? 'bg-pink-3' : 'bg-pink-2'"
    >
      <c-top-introduction
        v-show="introduction.isVisible.value"
        :name="introduction.name"
        :description="introduction.description"
        :to="introduction.to"
        :img="introduction.img"
        :icon="introduction.icon"
        :icon-size="introduction.iconSize"
        :class="introduction.class"
      >
        <div class="row justify-end">
          <div class="col-auto">
            <q-btn 
              v-if="introduction.to"
              rounded
              color="primary"
              icon="arrow_forward"
              :to="introduction.to"
            >表示する</q-btn>
          </div>
        </div>
      </c-top-introduction>
    </div>
  </div>
</template>

<style scoped>
</style>