<script setup lang="ts">
import { ComputedRef, Ref, computed, ref } from "vue";

import * as bookApiUtil from "@/modules/bookApiUtil.ts";

import CDialog from "@/components/c-dialog.vue";
import CBookCard from "@/components/c-book-card.vue";
import CRoundBtn from "@/components/c-round-btn.vue";
import util from "@/modules/util";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  bookName: { type: String, default: "" },
  authorName: { type: String, default: "" },
  publisherName: { type: String, default: "" },
});

const emits = defineEmits(["update:modelValue", "ok", "error"]);

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits("update:modelValue", value);
  },
});

const apiBooks: Ref<bookApiUtil.ApiBook[]> = ref([]);

interface Book {
  bookName: string;
  isbn: string | null;
  authorName: string | null;
  publisherName: string | null;
  tags: string[];
  dispCoverUrl: string | null;
  memo: string | null;
  apiBook: bookApiUtil.ApiBook;
}
const dispBooks: ComputedRef<Book[]> = computed(() => {
  return apiBooks.value.map((apiBook: bookApiUtil.ApiBook) => {
    return {
      bookName: apiBook.bookName || "",
      isbn: apiBook.isbn || null,
      authorName: apiBook.authorName,
      publisherName: apiBook.publisherName,
      tags: [],
      dispCoverUrl: apiBook.coverUrl,
      memo: null,
      apiBook: apiBook,
    };
  });
});
const labels = {
  bookName: "書籍名",
  authorName: "著者名",
  publisherName: "出版社名",
};

const form = ref({
  bookName: props.bookName,
  authorName: props.authorName,
  publisherName: props.publisherName,
});

const isLoading = ref(false);
const searchBooks = async (
  bookName: string,
  authorName: string,
  publisherName: string
) => {
  // 入力値ない場合無反応
  if (!bookName && !authorName && !publisherName) {
    return;
  }

  apiBooks.value = [];
  isLoading.value = true;
  apiBooks.value = await bookApiUtil.searchApiBooks(
    bookName,
    authorName,
    publisherName
  );
  isLoading.value = false;

  // 検索結果ない場合はエラー投げる
  if (apiBooks.value.length === 0) {
    emits("error");
  }
};

const selectBook = async (book: bookApiUtil.ApiBook) => {
  let apiBook = book;
  if (book.isbn && util.isIsbn(book.isbn)) {
    const newApiBook = await bookApiUtil.getApiBook(book.isbn);
    if (newApiBook) {
      apiBook = newApiBook;
    }
  }

  value.value = false;
  emits("ok", apiBook);
};

const resetDialog = () => {
  form.value = {
    bookName: props.bookName,
    authorName: props.authorName,
    publisherName: props.publisherName,
  };
  apiBooks.value = [];
  isLoading.value = false;
};
</script>

<template>
  <c-dialog
    v-model="value"
    header-text="書籍検索"
    hide-footer
    no-padding
    @hide="resetDialog"
  >
    <q-form ref="booksSearchDialog">
      <div class="row q-pa-md">
        <div class="col-12 q-pa-xs">
          <q-input
            v-model="form.bookName"
            clearable
            :label="labels.bookName"
            @keydown.enter="
              searchBooks(form.bookName, form.authorName, form.publisherName)
            "
          ></q-input>
        </div>
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-input
            v-model="form.authorName"
            clearable
            :label="labels.authorName"
            @keydown.enter="
              searchBooks(form.bookName, form.authorName, form.publisherName)
            "
          ></q-input>
        </div>
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-input
            v-model="form.publisherName"
            clearable
            :label="labels.publisherName"
            @keydown.enter="
              searchBooks(form.bookName, form.authorName, form.publisherName)
            "
          ></q-input>
        </div>
        <div class="col-1"></div>
        <q-space></q-space>
        <div class="col-auto q-pa-xs">
          <q-btn
            :disable="!form.bookName && !form.publisherName && !form.authorName"
            flat
            label="検索"
            color="primary"
            @click="
              searchBooks(form.bookName, form.authorName, form.publisherName)
            "
          />
        </div>
      </div>
    </q-form>
    <div v-if="dispBooks.length > 0" class="row justify-center q-pa-md">
      <div
        v-for="(book, i) in dispBooks"
        :key="'search-book-' + i"
        class="col book-cover-wrapper q-my-sm"
      >
        <c-book-card
          :book-name="book.bookName"
          :isbn="book.isbn || ''"
          :author-name="book.authorName || ''"
          :tags="book.tags"
          :publisher-name="book.publisherName || ''"
          :disp-cover-url="book.dispCoverUrl || undefined"
          :memo="book.memo || ''"
        >
          <template #header>
            <div class="row">
              <q-space></q-space>
              <c-round-btn
                title="選択"
                icon="add"
                color="primary"
                @click="selectBook(book.apiBook)"
              ></c-round-btn>
            </div>
          </template>
        </c-book-card>
      </div>
    </div>
    <div v-else class="row justify-center q-pa-md">
      <q-spinner-ios v-if="isLoading" size="36px" class="text-primary" />
    </div>
  </c-dialog>
</template>

<style scoped>
.book-cover-wrapper {
  max-width: 140px;
  min-width: 140px;
}
</style>
