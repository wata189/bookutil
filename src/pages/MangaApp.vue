<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onMounted, ref, toRefs, Ref } from "vue";
import AxiosUtil from "@/modules/axiosUtil";
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import { CacheUtil, CACHE_KEY } from "@/modules/cacheUtil";
import CDialog from "@/components/c-dialog.vue";
import CRoundBtn from "@/components/c-round-btn.vue";

const props = defineProps<{
  isAppLoaded: boolean;
}>();
const { isAppLoaded } = toRefs(props);

const SEARCHWORD_PLACEHOLDER = "@SEARCHWORD@";

const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);
const cacheUtil = new CacheUtil();

type MangaappItem = {
  name: string;
  url: string[];
  orderNum: number;
};
type Mangaapp = {
  documentId: string;
  category: string;
  orderNum: number;
  apps: MangaappItem[];
};

const searchDialogOpen = ref(false);
const searchWord = ref("");
const mangaApps: Ref<Mangaapp[]> = ref([]);
const selectedApps = ref<Set<string>>(new Set());

const appKey = (categoryDocId: string, appName: string) =>
  `${categoryDocId}:${appName}`;

const initSelected = (apps: Mangaapp[]) => {
  selectedApps.value = new Set(
    apps
      .filter((cat) => cat.category === "汎用")
      .flatMap((cat) => cat.apps.map((app) => appKey(cat.documentId, app.name))),
  );
};

const isCategoryChecked = (category: Mangaapp) =>
  category.apps.every((app) =>
    selectedApps.value.has(appKey(category.documentId, app.name)),
  );

const isCategoryIndeterminate = (category: Mangaapp) => {
  const count = category.apps.filter((app) =>
    selectedApps.value.has(appKey(category.documentId, app.name)),
  ).length;
  return count > 0 && count < category.apps.length;
};

const getCategoryModel = (category: Mangaapp): boolean | null => {
  if (isCategoryChecked(category)) return true;
  if (isCategoryIndeterminate(category)) return null;
  return false;
};

const toggleCategory = (category: Mangaapp) => {
  const allChecked = isCategoryChecked(category);
  const next = new Set(selectedApps.value);
  category.apps.forEach((app) => {
    const key = appKey(category.documentId, app.name);
    if (allChecked) next.delete(key);
    else next.add(key);
  });
  selectedApps.value = next;
};

const toggleApp = (key: string) => {
  const next = new Set(selectedApps.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  selectedApps.value = next;
};

// マンガアプリ一覧の取得
const fetchMangaApps = async () => {
  // キャッシュから取得を試みる
  const cached = (await cacheUtil.get(CACHE_KEY.MANGA_APPS)) as Mangaapp[];
  if (cached) {
    mangaApps.value = cached;
    initSelected(cached);
    return;
  }

  // なければAPIを叩く
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/mangaapp/fetch", { idToken });
  if (response && response.data.mangaApps) {
    mangaApps.value = response.data.mangaApps;
    initSelected(mangaApps.value);
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
    .flatMap((category) =>
      category.apps.filter((app) =>
        selectedApps.value.has(appKey(category.documentId, app.name)),
      ),
    )
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
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <c-round-btn
          title="一括新規作成"
          icon="travel_explore"
          color="primary"
          :is-flat="false"
          @click="searchDialogOpen = true"
        ></c-round-btn>
      </q-page-sticky>

      <c-dialog
        v-model="searchDialogOpen"
        header-text="マンガアプリ一括検索"
        hide-footer
      >
        <q-input
          v-model="searchWord"
          label="検索ワード"
          clearable
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

        <div v-if="mangaApps && mangaApps.length" class="q-mt-sm">
          <div>検索対象</div>
          <div class="search-target-list">
            <div v-for="category in mangaApps" :key="category.documentId">
              <q-checkbox
                :model-value="getCategoryModel(category)"
                :true-value="true"
                :false-value="false"
                :indeterminate-value="null"
                :label="category.category"
                @update:model-value="toggleCategory(category)"
              />
              <div class="q-pl-md">
                <div v-for="app in category.apps" :key="app.name">
                  <q-checkbox
                    :model-value="
                      selectedApps.has(appKey(category.documentId, app.name))
                    "
                    :label="app.name"
                    @update:model-value="
                      toggleApp(appKey(category.documentId, app.name))
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </c-dialog>
    </q-page>
  </q-page-container>
</template>

<style scoped>
.search-target-list {
  max-height: 40vh;
  overflow-y: auto;
}
</style>
