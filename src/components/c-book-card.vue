<script setup lang="ts">

import util from "@/modules/util";
import CLinkBtns from "@/components/c-link-btns.vue";

const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg"
interface Book {
  bookName: string,
  isbn: string | null,
  authorName: string | null,
  tags: string[],
  dispCoverUrl: string,
  memo: string | null
}
interface Props {
  book: Book
}
const props = defineProps<Props>();

</script>

<template>
<q-card class="q-pb-sm q-mx-sm" :flat="!util.isDarkMode()" :class="util.isDarkMode() ? 'bg-dark' : 'bg-transparent' " :title="props.book.bookName">
  <slot name="header"></slot>
  <q-img
    :src="book.dispCoverUrl"
    decoding="async"
    class="book-img book-card-item"
    fit="contain"
    @error="book.dispCoverUrl = IMG_PLACEHOLDER_PATH"
  ></q-img>
  <div class="ellipsis q-px-sm book-card-item">
      {{ book.bookName }}
  </div>
  <q-menu fit class="q-pa-md book-info">
    <div class="book-info-inner">
      <div class="text-bold">
        {{ book.bookName }}<template v-if="book.authorName"> / {{ book.authorName }}</template>
      </div>
      <div v-if="book.isbn">{{ book.isbn }}</div>
      <q-expansion-item
        v-if="book.memo"
        dense
      >
        <template v-slot:header="{expanded}">
          <q-item-section class="ellipsis">
            <template v-if="!expanded">{{ book.memo }}</template>
          </q-item-section>
        </template>
        <div class="book-card-memo">{{ book.memo }}</div>
        
      </q-expansion-item>
      <div>
        <q-chip v-for="tag in book.tags" dense color="teal" text-color="white">{{ tag }}</q-chip>
      </div>
      <c-link-btns
        :bookName="book.bookName"
        :isbn="book.isbn"
        :other-link="book.memo"
      ></c-link-btns>
      <slot name="menu-footer"></slot>
    </div>
  </q-menu>
</q-card>

</template>

<style scoped>

.book-card-item{
  cursor: pointer;
}

.book-card-memo{
  white-space: pre-line;
}

.book-img{
  height: 120px;
}

.book-info-inner{
  font-family: "BIZ UDPGothic";
  max-width: 250px;
}
</style>