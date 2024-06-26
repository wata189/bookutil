<script setup lang="ts">

import util from "@/modules/util";
import CBookLinks from "@/components/c-book-links.vue";

const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg";

const props = defineProps({
  bookName: {type:String, required:true},
  isbn: {type:String, default:""},
  authorName: {type:String, default:""},
  tags: {type:Array<String>, default:[]},
  dispCoverUrl: {type:String, required:true},
  memo: {type:String, default:""},
  hideBookLinks: {type:Boolean, default:false}
});

</script>

<template>
<q-card class="q-py-sm q-mx-sm" :flat="!util.isDarkMode()" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-3' " :title="props.bookName">
  <slot name="header"></slot>
  <q-img
    :src="dispCoverUrl"
    decoding="async"
    class="book-img book-card-item"
    fit="contain"
  >
    <template v-slot:error>
      <q-img
        :src="IMG_PLACEHOLDER_PATH"
        decoding="async"
        class="book-img book-card-item bg-transparent"
        fit="contain"
      >

      </q-img>
    </template>
  </q-img>
  <div class="ellipsis q-px-sm book-card-item">
      {{ bookName }}
  </div>
  <q-menu fit class="q-pa-md book-info" :class="util.isDarkMode() ? '' : 'bg-pink-2'">
    <div class="book-info-inner">
      <div class="text-bold">
        {{ bookName }}<template v-if="authorName"> / {{ authorName }}</template>
      </div>
      <div v-if="isbn">{{ isbn }}</div>
      <q-expansion-item
        v-if="memo"
        dense
      >
        <template v-slot:header="{expanded}">
          <q-item-section class="ellipsis">
            <template v-if="!expanded">{{ memo }}</template>
          </q-item-section>
        </template>
        <div class="book-card-memo">{{ memo }}</div>
        
      </q-expansion-item>
      <div>
        <q-chip v-for="tag in tags" dense color="primary" text-color="white">{{ tag }}</q-chip>
      </div>
      <c-book-links
        v-if="!hideBookLinks"
        :bookName="bookName"
        :isbn="isbn"
        :author-name="authorName"
        :other-link="memo"
      ></c-book-links>
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

@media (min-width: 600px){
  .book-img{
    height: 150px;
  }
}

.book-info-inner{
  font-family: "BIZ UDPGothic";
  max-width: 250px;
}
</style>