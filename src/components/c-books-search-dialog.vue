<script setup lang="ts">
import { ComputedRef, Ref, computed, ref } from "vue";

import * as bookApiUtil from "@/modules/bookApiUtil.ts";

import CDialog from "@/components/c-dialog.vue";
import CBookCard from "@/components/c-book-card.vue";
import CRoundBtn from "@/components/c-round-btn.vue";
import util from "@/modules/util";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  searchWord: { type: String, required: true },
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

const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg";
const apiBooks: Ref<bookApiUtil.ApiBook[]> = ref([]);

interface Book {
  bookName: string;
  isbn: string | null;
  authorName: string | null;
  tags: string[];
  dispCoverUrl: string;
  memo: string | null;
  apiBook: bookApiUtil.ApiBook;
}
const dispBooks: ComputedRef<Book[]> = computed(() => {
  return apiBooks.value.map((apiBook: bookApiUtil.ApiBook) => {
    return {
      bookName: apiBook.bookName || "",
      isbn: apiBook.isbn || null,
      authorName: apiBook.authorName,
      tags: [],
      dispCoverUrl: apiBook.coverUrl || IMG_PLACEHOLDER_PATH,
      memo: null,
      apiBook: apiBook,
    };
  });
});

const searchBooks = async (searchWord: string) => {
  apiBooks.value = await bookApiUtil.searchApiBooks(searchWord);

  // 検索結果ない場合はエラー投げる
  if (apiBooks.value.length === 0) {
    value.value = false;
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
</script>

<template>
  <c-dialog
    v-model="value"
    header-text="書籍検索"
    hide-footer
    class="books-search-dialog"
    no-padding
    @show="searchBooks(props.searchWord)"
    @hide="apiBooks = []"
  >
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
          :disp-cover-url="book.dispCoverUrl"
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
      <q-spinner-ios size="36px" class="text-primary" />
    </div>
  </c-dialog>
</template>

<style scoped>
.book-cover-wrapper {
  max-width: 140px;
  min-width: 140px;
}
</style>
