<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">

import { computed, ref, toRefs, onMounted, Ref } from 'vue';

import CRoundLink from "@/components/c-round-link.vue";
import CRoundBtn from "@/components/c-round-btn.vue";

import util from "@/modules/util";
import authUtil from '@/modules/authUtil';
import AxiosUtil from '@/modules/axiosUtil';
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = "cache-libraries"


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
  spUrl?: string,
  calendarUrl?: string,
  barcodeUrl?: string
}
const libraries:Ref<Library[]> = ref([]);

const dispLibraries = computed(() => {

  return libraries.value.map(library => {

    const toreadLink = `toread?filterCondWord=${library.city}図書館 よみたい`

    return {...library, toreadLink};
  });
});

const fetchLibraries = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/libraries/fetch", {idToken});
  if(response){
    libraries.value = response.data.libraries;

    // キャッシュ保存
    const limitHours = 24 * 30; // キャッシュ期限は1月くらい
    await cacheUtil.set(CACHE_KEY, response.data.libraries, limitHours);
  }
};

// Appコンポーネントのロードが終わった後、子コンポーネントの処理
// 初回ロードと画面遷移の療法に対応できるようにする
const {isAppLoaded} = toRefs(props);
onMounted(util.waitParentMount(isAppLoaded, async () => {
  // キャッシュからリスト取得してみる
  const cachedLibraries: Library[] | null = await cacheUtil.get(CACHE_KEY);
  if(cachedLibraries){
    libraries.value = cachedLibraries;
  }else{
    // キャッシュから取得できなかったらサーバーから取得
    await fetchLibraries();
  }

  console.log("mounted libraries");

}));
</script>

<template>
  
  <q-page-container>
    <q-page>
      <div class="row justify-center">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
          <div v-for="library in dispLibraries" :key="library.id" class="q-pa-md">
            <q-card class="q-pa-md" :class="util.isDarkMode() ? '' : 'bg-pink-3'">
              <div class="text-h6">
                
                {{library.city}}図書館
                
              </div>
              <div>
                {{ library.name }}
                <span v-if="library.closestStation">{{ library.closestStation }}駅</span>
              </div>
              <div class="row">
                <c-round-link
                  title="図書館サイトを表示"
                  icon="account_balance"
                  color="primary"
                  :href="util.isSmartPhone() && library.spUrl ? library.spUrl : library.url"
                ></c-round-link>
                <c-round-link
                  title="Googleマップで表示"
                  icon="place"
                  color="primary"
                  :href="library.mapUrl"
                ></c-round-link>
                <c-round-link
                  v-if="library.calendarUrl"
                  title="カレンダーを表示"
                  icon="today"
                  color="primary"
                  :href="library.calendarUrl"
                ></c-round-link>
                <c-round-link
                  v-if="library.barcodeUrl"
                  title="バーコードを表示"
                  icon="qr_code_2"
                  color="primary"
                  :href="library.barcodeUrl"
                ></c-round-link>
                <q-space></q-space>
                <c-round-btn
                  color="primary"
                  title="読みたいリストで表示"
                  icon="format_list_bulleted"
                  :to="library.toreadLink"
                />
              </div>
              
            </q-card>
          </div>
        </div>
      </div>
    </q-page>
  </q-page-container>

  
</template>

<style scoped>
.card-menu{
  cursor: pointer;
}
</style>