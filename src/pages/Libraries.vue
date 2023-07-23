<script setup lang="ts">

import { computed, ref } from 'vue';
import { onMounted, Ref } from '@vue/runtime-core';

import util from "@/modules/util";
import AxiosUtil from '@/modules/axiosUtil';

const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);

type Library = {
  id: string,
  city: string,
  name: string,
  closestStation? : string,
  url: string,
  mapUrl: string,
  dayOfWeek: number,
  isOpen: boolean,
  startTime?: string,
  endTime?: string
}
const libraries:Ref<Library[]> = ref([]);

const dispLibraries = computed(() => {
  return libraries.value.map(library => {

    let isOpenLibrary = library.isOpen;
    let dispStartTime = null;
    let dispEndTime = null;
    if(library.isOpen && library.startTime && library.endTime){
      dispStartTime = library.startTime.slice(0, 2) + ":" + library.startTime.slice(2);
      dispEndTime = library.endTime.slice(0, 2) + ":" + library.endTime.slice(2);

      const tmpTime = Number(util.formatDateToStr(new Date(), "hhmm"));
      const startTime = Number(library.startTime);
      const endTime = Number(library.endTime);

      isOpenLibrary = startTime <= tmpTime && tmpTime <= endTime;
    }

    const toreadLink = `bookutil/toread?filterCondTags=${library.city}図書館 よみたい`

    return {...library, isOpenLibrary, dispStartTime, dispEndTime, toreadLink};
  });
});

const fetchLibraries = async () => {
  const response = await axiosUtil.get('/libraries/fetch');
  if(response){
    libraries.value = response.data.libraries;
  }
}

onMounted(async () => {
  await fetchLibraries();
});
</script>

<template>
  <div class="row justify-center">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <div v-for="library in dispLibraries" class="q-pa-md">
        <q-card class="q-pa-md">
          <div class="text-h6">
            
            <a :href="library.url" target="_blank">
              <q-icon :name="library.isOpenLibrary ? 'layers' : 'layers_clear'" />{{library.city}}図書館
            </a>
            <a :href="library.mapUrl" target="_blank">
            <q-icon name="place" class="q-px-sm" /></a>
            
          </div>
          <div>
            {{ library.name }}
            <span v-if="library.closestStation">{{ library.closestStation }}駅</span>
          </div>
          <div>
            <span v-if="library.isOpen">{{ library.dispStartTime }} - {{ library.dispEndTime }}</span>
            <span v-else>休み</span>
          </div>
          
          <a :href="library.toreadLink" target="_blank">よみたいリストで表示</a>
          
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-menu{
  cursor: pointer;
}
</style>