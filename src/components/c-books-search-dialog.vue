<script setup lang="ts">

import { ComputedRef, Ref, computed, ref } from 'vue';

import {searchNdlBooks, NdlBook} from '@/modules/ndlSearchUtil.ts';

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
const ndlBooks:Ref<NdlBook[]> = ref([]);

interface Book {
  bookName: string,
  isbn: string | null,
  authorName: string | null,
  tags: string[],
  dispCoverUrl: string,
  memo: string | null,
  ndlBook: NdlBook
}
const dispBooks:ComputedRef<Book[]> = computed(() =>{
  return ndlBooks.value.map((ndlBook:NdlBook) => {
    console.log(ndlBook.coverUrl);
    return {
      bookName: ndlBook.bookName || "",
      isbn: ndlBook.isbn || null,
      authorName: ndlBook.authorName,
      tags: [],
      dispCoverUrl: ndlBook.coverUrl || IMG_PLACEHOLDER_PATH,
      memo: null,
      ndlBook: ndlBook
    };
  });
});


const searchBooks = async (searchWord:string) => {
  ndlBooks.value = await searchNdlBooks(searchWord);

  // 検索結果ない場合はエラー投げる
  if(ndlBooks.value.length === 0){
    value.value = false;
    emits("error");
  }
};
const selectBook = (book:NdlBook) => {
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
    @hide="ndlBooks = []"
    class="books-search-dialog"
    no-padding
  >
    <div class="row justify-center q-pa-md">
      <div v-for="book in dispBooks" class="col book-cover-wrapper q-my-sm">
        <c-book-card :book="book">
          <template v-slot:header>
            <div class="row">
              <q-space></q-space>
              <c-round-btn
                title="選択"
                icon="add"
                color="primary"
                @click="selectBook(book.ndlBook)"
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