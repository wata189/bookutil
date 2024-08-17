<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import authUtil from "@/modules/authUtil";
import AxiosUtil from "@/modules/axiosUtil";
import { CacheUtil } from "@/modules/cacheUtil";
import { NotifyUtil } from "@/modules/notifyUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import { QForm, useQuasar } from "quasar";
import { onMounted, ref, Ref, toRefs, ComputedRef, computed } from "vue";
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  BOOKSHELF: "cache-bookshelf",
  BOOKS: "cache-toreadBooks",
  TAGS: "cache-toreadTags",
  TAGS_HISTORIES: "cache-tagsHistories",
};
const notifyUtil = new NotifyUtil(useQuasar());
import CRoundBtn from "@/components/c-round-btn.vue";
import CInputTag from "@/components/c-input-tag.vue";

// axiosUtilのインスタンス作成
const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);
const EMIT_NAME_CONFIRM = "show-confirm-dialog";

interface Props {
  isAppLoaded: boolean;
}
const props = defineProps<Props>();

const newBooksForm: Ref<QForm | undefined> = ref();
const addNewBooks = () => {
  // フォームのバリデーション処理
  if (!newBooksForm.value) {
    return;
  }
  newBooksForm.value.validate().then(async (success: boolean) => {
    if (!success) {
      return;
    }

    // 確認ダイアログ
    const toreadBooks = forms.value
      .filter((form) => form.addTo === ADD_TO_TOREAD)
      .map((form) => `${form.authorName}『${form.bookName}』`)
      .join("\n");
    const bookshelfBooks = forms.value
      .filter((form) => form.addTo === ADD_TO_BOOKSHELF)
      .map((form) => `${form.authorName}『${form.bookName}』`)
      .join("\n");
    const notAddBooks = forms.value
      .filter((form) => form.addTo === ADD_TO_NOT)
      .map((form) => `${form.authorName}『${form.bookName}』`)
      .join("\n");
    const msg = `以下のように新刊を追加します。よろしいですか？

■よみたいリスト
${toreadBooks}

■本棚
${bookshelfBooks}

■追加しない
${notAddBooks}`;

    emits(EMIT_NAME_CONFIRM, "確認", msg, false, async () => {
      // TODO:タグ履歴更新
      // if (form.value.tags) {
      //   await addTagsHistories(form.value.tags);
      // }

      // formを送る
      const idToken = await authUtil.getIdToken();
      const user = authUtil.getUserInfo();
      const params = {
        newBooks: forms.value,
        idToken,
        user: user.email || "No User Data",
      };
      const response = await axiosUtil.post(`/newbook/add`, params);

      // ToreadとBookshelfのキャッシュのみ更新 時短のため非同期でやる
      const limitHours = 24;
      cacheUtil.set(CACHE_KEY.BOOKS, response.data.toreadBooks, limitHours);
      cacheUtil.set(
        CACHE_KEY.BOOKSHELF,
        response.data.bookshelfBooks,
        limitHours
      );

      const message = `新刊を一括追加しました`;
      notifyUtil.notify(message);
      // 画面情報を消す
      forms.value = [];
    });
  });
};

const ADD_TO_TOREAD = "Toread";
const ADD_TO_BOOKSHELF = "Bookshelf";
const ADD_TO_NOT = "";
type AddTo = "Toread" | "Bookshelf" | "";
type AddToOptions = { label: string; value: AddTo };
const addToOptions: AddToOptions[] = [
  { label: "追加しない", value: ADD_TO_NOT },
  { label: "よみたいリスト", value: ADD_TO_TOREAD },
  { label: "本棚", value: ADD_TO_BOOKSHELF },
];

type NewBookForm = {
  documentId: string;
  bookName: string;
  isbn: string;
  authorName: string;
  publisherName: string;
  newBookCheckFlg: number;
  tags: string;
  addTo: AddTo;
  updateAt: number;
};
const forms: Ref<NewBookForm[]> = ref([]);

const isOpens: ComputedRef<boolean[]> = computed(() => {
  return forms.value.map((form) => form.addTo !== ADD_TO_NOT);
});

const toreadTagOptions: Ref<string[]> = ref([]);
const tagsHistories: Ref<string[]> = ref([]);
const fetchTags = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/tag/fetch", { idToken });
  await setTags(response.data.tags);
};
const setTags = async (tags: string[]) => {
  // キャッシュに保存
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.TAGS, tags, limitHours);
  toreadTagOptions.value = tags;
};

const labels = {
  bookName: "書籍名",
  isbn: "ISBN",
  authorName: "著者名",
  publisherName: "出版社名",
  memo: "メモ",
  coverUrl: "書影URL",
  tags: "タグ",
  newBookCheckFlg: "図書館チェック",
};
const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
};

const emptyMessage = ref("新刊情報を取得しています");

const { isAppLoaded } = toRefs(props);
onMounted(
  util.waitParentMount(isAppLoaded, async () => {
    // 新刊取得処理
    const idToken = await authUtil.getIdToken();
    const response = await axiosUtil.post("/newbook/fetch", { idToken });
    if (response.data.newBooks.length > 0) {
      forms.value = response.data.newBooks;
    }
    emptyMessage.value = "追加していない新刊はありません";

    // キャッシュからリスト取得してみる
    const cachedTagsHistories = (await cacheUtil.get(
      CACHE_KEY.TAGS_HISTORIES
    )) as string[] | null;
    if (cachedTagsHistories) {
      tagsHistories.value = cachedTagsHistories;
    }
    const cachedToreadTags = (await cacheUtil.get(CACHE_KEY.TAGS)) as
      | string[]
      | null;
    if (cachedToreadTags) {
      await setTags(cachedToreadTags);
    } else {
      fetchTags(); // tagOptions処理は完全に非同期で回す
    }

    console.log("mounted toread");
  })
);
</script>
<template>
  <div>
    <q-page-container>
      <q-page>
        <q-form v-if="forms.length > 0" ref="newBooksForm">
          <q-card
            v-for="(form, i) in forms"
            :key="form.documentId"
            class="q-pa-sm q-ma-sm"
            :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-2'"
          >
            <div>{{ form.authorName }}『{{ form.bookName }}』</div>
            <div class="row">
              <div class="col-12 q-pa-xs">
                <!-- <q-select
                  v-model="form.addTo"
                  :options="addToOptions"
                  label="追加先"
                  emit-value
                  map-options
                /> -->
                <q-radio
                  v-for="option in addToOptions"
                  :key="'add-to-option-' + option.value + '-' + i"
                  v-model="form.addTo"
                  :val="option.value"
                  :label="option.label"
                  dense
                  class="q-pr-md"
                >
                </q-radio>
              </div>
            </div>
            <q-expansion-item v-model="isOpens[i]" header-style="display:none;">
              <div class="row">
                <div class="col-12 col-sm-5 col-md-3 q-pa-xs">
                  <q-input
                    v-model="form.bookName"
                    clearable
                    :label="labels.bookName"
                    :rules="form.addTo ? validationRules.bookName : []"
                  ></q-input>
                </div>
                <div class="col-6 col-sm-4 col-md-2 q-pa-xs">
                  <q-input
                    v-model="form.authorName"
                    clearable
                    :label="labels.authorName"
                  ></q-input>
                </div>
                <div class="col-6 col-sm-3 col-md-2 q-pa-xs">
                  <q-input
                    v-model="form.publisherName"
                    clearable
                    :label="labels.publisherName"
                  ></q-input>
                </div>
                <div class="col-12 col-md-5 q-pa-xs">
                  <c-input-tag
                    :id="'new-books-dialog-tag' + i"
                    v-model="form.tags"
                    :label="labels.tags"
                    hint=",/スペースで区切られます"
                    :options="toreadTagOptions"
                  ></c-input-tag>
                </div>
                <div
                  v-if="form.addTo === ADD_TO_TOREAD"
                  class="col-12 col-sm-auto q-pa-xs"
                >
                  <q-toggle
                    v-model="form.newBookCheckFlg"
                    :disable="
                      !(util.isExist(form.isbn) && util.isIsbn(form.isbn))
                    "
                    size="md"
                    :true-value="1"
                    :false-value="0"
                    :label="labels.newBookCheckFlg"
                  ></q-toggle>
                </div>
              </div>
            </q-expansion-item>
          </q-card>
        </q-form>
        <div v-else class="row justify-center q-pa-md">
          {{ emptyMessage }}
        </div>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <div class="row justify-end items-end">
        <div class="col-auto q-pa-xs">
          <c-round-btn
            title="新刊追加"
            icon="queue"
            color="primary"
            :is-flat="false"
            @click="addNewBooks"
          ></c-round-btn>
        </div>
      </div>
    </q-footer>
  </div>
</template>
<style scoped></style>
