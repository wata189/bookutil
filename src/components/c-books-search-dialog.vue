<script setup lang="ts">

import { ComputedRef, Ref, computed, ref } from 'vue';

import googleBooksUtil from '@/modules/googleBooksUtil';

import CDialog from "@/components/c-dialog.vue";
import CBookCard from '@/components/c-book-card.vue';
import CRoundBtn from '@/components/c-round-btn.vue';

const props = defineProps({
  modelValue: {type:Boolean, required: true},
  searchWord: {type:String, required: true}
});


const emits = defineEmits(["update:modelValue","ok", "error"]);

const value = computed({
  get() {
    return props.modelValue
  },
  set(value){
    emits("update:modelValue", value)
  }
});

const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg"
type GoogleBook = {
  bookName: string | undefined,
  isbn: string | undefined,
  authorName: string,
  page: number | undefined,
  coverUrl: string | undefined,
  description: string | undefined
};
const googleBooks:Ref<GoogleBook[]> = ref([]);

interface Book {
  bookName: string,
  isbn: string | null,
  authorName: string | null,
  tags: string[],
  dispCoverUrl: string,
  memo: string | null,
  googleBook: GoogleBook
}
const books:ComputedRef<Book[]> = computed(() =>{
  return googleBooks.value.map((googleBook:GoogleBook) => {
    return {
      bookName: googleBook.bookName || "",
      isbn: googleBook.isbn || null,
      authorName: googleBook.authorName,
      tags: [],
      dispCoverUrl: googleBook.coverUrl || IMG_PLACEHOLDER_PATH,
      memo: googleBook.description || null,
      googleBook: googleBook
    };
  });
});


const searchBooks = async (searchWord:string) => {
  googleBooks.value = await googleBooksUtil.searchBooks(searchWord);

  // 検索結果ない場合はエラー投げる
  if(googleBooks.value.length === 0){
    value.value = false;
    emits("error");
  }
};
const selectBook = (book:GoogleBook) => {
  value.value = false;
  emits("ok", book);
};
</script>

<template>
  <c-dialog
    v-model="value"
    header-text="書籍検索"
    hide-footer
    @show="searchBooks(props.searchWord)"
    @hide="googleBooks = []"
    class="books-search-dialog"
    no-padding
  >
    <div class="row justify-center q-pa-md">
      <div v-for="book in books" class="col book-cover-wrapper q-my-sm">
        <c-book-card :book="book">
          <template v-slot:header>
            <div class="row">
              <q-space></q-space>
              <c-round-btn
                title="選択"
                icon="add"
                color="primary"
                @click="selectBook(book.googleBook)"
              ></c-round-btn>
            </div>
          </template>
        </c-book-card>
      </div>
    </div>
  </c-dialog>
</template>

<style scoped>
.book-cover-wrapper{
  max-width: 140px;
  min-width: 140px;
}
</style>