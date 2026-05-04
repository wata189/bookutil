<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onMounted, ref, toRefs, Ref } from "vue";
import AxiosUtil from "@/modules/axiosUtil";
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import { CacheUtil, CACHE_KEY } from "@/modules/cacheUtil";

const props = defineProps<{
  isAppLoaded: boolean;
}>();
const { isAppLoaded } = toRefs(props);

const SEARCHWORD_PLACEHOLDER = "@SEARCHWORD@";

const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);
const cacheUtil = new CacheUtil();

interface MangaApp {
  documentId: string;
  name: string;
  url: string[];
}

const searchWord = ref("");
const mangaApps: Ref<MangaApp[]> = ref([]);

// マンガアプリ一覧の取得
const fetchMangaApps = async () => {
  // キャッシュから取得を試みる
  const cached = (await cacheUtil.get(CACHE_KEY.MANGA_APPS)) as MangaApp[];
  if (cached) {
    mangaApps.value = cached;
    return;
  }

  // なければAPIを叩く
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/mangaapp/fetch", { idToken });
  if (response && response.data.mangaApps) {
    mangaApps.value = response.data.mangaApps;
    // 30日程度キャッシュ
    await cacheUtil.set(CACHE_KEY.MANGA_APPS, mangaApps.value, 24 * 30);
  }
};

// 一括検索実行
const executeBatchSearch = (word: string) => {
  if (!word) return;

  const trimedWord = word.trim();
  if (!trimedWord) return;

  mangaApps.value
    .map((app) => {
      // @SEARCHWORD@ を入力文字に置換してURLを組み立てる
      return app.url
        .map((part) =>
          part === SEARCHWORD_PLACEHOLDER
            ? encodeURIComponent(trimedWord)
            : part,
        )
        .join("");
    })
    .forEach((url) => open(url));
};

onMounted(
  util.waitParentMount(isAppLoaded, async () => {
    await fetchMangaApps();
  }),
);
</script>

<template>
  <q-page-container>
    <q-page>
      <div class="row justify-center">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
          <q-input
            v-model="searchWord"
            label="マンガアプリ一括検索"
            clearable
            class="q-pa-md"
            @keydown.enter="executeBatchSearch(searchWord)"
          >
            <template #append>
              <q-btn
                round
                dense
                flat
                icon="search"
                :disabled="!searchWord || !searchWord.trim()"
                @click="executeBatchSearch(searchWord)"
              ></q-btn>
            </template>
          </q-input>

          <q-expansion-item
            v-if="mangaApps && mangaApps.length"
            class="q-pa-md"
            dense
          >
            <template #header>
              <q-item-section class="ellipsis"
                >以下のマンガアプリを検索します。
              </q-item-section>
            </template>
            <div>
              <ul>
                <li v-for="app in mangaApps" :key="app.documentId">
                  {{ app.name }}
                </li>
              </ul>
            </div>
          </q-expansion-item>
        </div>
      </div>
    </q-page>
  </q-page-container>
</template>

<style scoped></style>
