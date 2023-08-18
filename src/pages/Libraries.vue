<script setup lang="ts">

import { computed, ref, watch, toRefs, onMounted } from 'vue';
import { Ref } from '@vue/runtime-core';

import CRoundBtn from "@/components/c-round-btn.vue";

import util from "@/modules/util";
import authUtil from '@/modules/authUtil';
import AxiosUtil from '@/modules/axiosUtil';


const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);

interface Props {
  isAppLoaded: boolean
}
const props = defineProps<Props>();

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

    const toreadLink = `toread?filterCondTags=${library.city}図書館 よみたい`

    return {...library, isOpenLibrary, dispStartTime, dispEndTime, toreadLink};
  });
});

const fetchLibraries = async () => {
  const accessToken = await authUtil.getLocalStorageAccessToken();
  const response = await axiosUtil.get(`/libraries/fetch?accessToken=${accessToken}`);
  if(response){
    libraries.value = response.data.libraries;
  }
}

// Appコンポーネントのロードが終わった後、子コンポーネントの処理
// 初回ロードと画面遷移の療法に対応できるようにする
const {isAppLoaded} = toRefs(props);
const init = async () => {
  // 初回ロード→onMountedのタイミングでは処理を行わないで、watchから呼び出されたタイミングで処理実行
  // VueRouterで遷移→
  if(!isAppLoaded.value){return;}

  await fetchLibraries();

  // 初回ロード→watchの中でinit呼ばれているのでunwatchして2回め動かないようにする
  // VueRouterで遷移→onMountedの中でinit呼ばれて、未使用のwatchをunwatch
  unwatch();

  console.log("mounted libraries");
};
const unwatch = watch(isAppLoaded, init);
onMounted(init);
</script>

<template>
  <div class="row justify-center">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <div v-for="library in dispLibraries" class="q-pa-md">
        <q-card class="q-pa-md">
          <div class="text-h6">
            
            <q-icon :name="library.isOpenLibrary ? 'layers' : 'layers_clear'" /> {{library.city}}図書館
            <c-round-btn
              title="図書館サイトを表示"
              icon="account_balance"
              dense
              @click="util.openPageAsNewTab(library.url)"
              color="secondary"
            ></c-round-btn>
            <c-round-btn
              title="Googleマップで表示"
              icon="place"
              dense
              @click="util.openPageAsNewTab(library.mapUrl)"
              color="secondary"
            ></c-round-btn>
            
          </div>
          <div>
            {{ library.name }}
            <span v-if="library.closestStation">{{ library.closestStation }}駅</span>
          </div>
          <div>
            <span v-if="library.isOpen">{{ library.dispStartTime }} - {{ library.dispEndTime }}</span>
            <span v-else>休み</span>
          </div>
          
          <q-btn
            color="secondary"
            dense
            @click="util.openPageAsNewTab(library.toreadLink)"
          >
            よみたいリストで表示
          </q-btn>
          
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