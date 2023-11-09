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

type BusinessHours = {
  dayOfWeek: number,
  isOpen: boolean,
  startTime?: string,
  endTime?: string
}
type Library = {
  id: string,
  city: string,
  name: string,
  closestStation? : string,
  url: string,
  mapUrl: string,
  businessHours: BusinessHours[],
  selectedWeekNum: number
}
const libraries:Ref<Library[]> = ref([]);

const weekNum = (new Date()).getDay();
const selectedWeekNum = ref(weekNum);
const weekOptions = [
  {label: "日", value: 0},
  {label: "月", value: 1},
  {label: "火", value: 2},
  {label: "水", value: 3},
  {label: "木", value: 4},
  {label: "金", value: 5},
  {label: "土", value: 6},
];

const dispLibraries = computed(() => {

  return libraries.value.map(library => {

    const businessHour = library.businessHours.find(hour => hour.dayOfWeek === weekNum) || {isOpen: false};

    const dispBusinessHours = library.businessHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek ).map(businessHour => {

      let dispStartTime = null;
      let dispEndTime = null;
      if(businessHour.isOpen && businessHour.startTime && businessHour.endTime){

        dispStartTime = businessHour.startTime.slice(0, 2) + ":" + businessHour.startTime.slice(2);
        dispEndTime = businessHour.endTime.slice(0, 2) + ":" + businessHour.endTime.slice(2);
      }
      
      return {
        ...businessHour,
        dispStartTime,
        dispEndTime
      }
    })

    let isOpenLibrary = businessHour.isOpen;
    if(businessHour.isOpen && businessHour.startTime && businessHour.endTime){
      const tmpTime = Number(util.formatDateToStr(new Date(), "hhmm"));
      const startTime = Number(businessHour.startTime);
      const endTime = Number(businessHour.endTime);

      isOpenLibrary = startTime <= tmpTime && tmpTime <= endTime;
    }

    const toreadLink = `toread?filterCondWord=${library.city}図書館 よみたい`

    return {...library, businessHour, dispBusinessHours, isOpenLibrary, toreadLink};
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
  
  <q-layout view="hHh lpr fFf">
    <q-page-container>
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
                <span v-if="library.dispBusinessHours[selectedWeekNum].isOpen">
                  {{ library.dispBusinessHours[selectedWeekNum].dispStartTime }} - {{ library.dispBusinessHours[selectedWeekNum].dispEndTime }}
                </span>
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
    </q-page-container>
    <q-footer elevated :class="util.isDarkMode() ? 'bg-dark' : 'bg-white text-black'">
      <div class="row">
        <q-space></q-space>
        <q-btn-toggle
          v-model="selectedWeekNum"
          toggle-color="secondary"
          :options="weekOptions"
        ></q-btn-toggle>
        <q-space></q-space>
      </div>
    </q-footer>
  </q-layout>

  
</template>

<style scoped>
.card-menu{
  cursor: pointer;
}
</style>