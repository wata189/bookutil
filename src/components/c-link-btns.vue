<script setup lang="ts">

import util from "@/modules/util";

interface Props {
  bookName: string,
  isbn: string | null,
  otherLink: string | null
}
const props = defineProps<Props>();

const SEARCH_PLACEHOLDER = "@PLACEHOLDER@";
type Link = {
  title: string,
  imgUrl: string,
  searchUrl: {
    isbn: string,
    bookName: string
  }
};
const links:Link[] = [
  {
    title: "カーリル",
    imgUrl: "img/calil.jpg",
    searchUrl: {
      isbn: "https://calil.jp/book/" + SEARCH_PLACEHOLDER,
      bookName: "https://calil.jp/search?q=" + SEARCH_PLACEHOLDER
    }
  },
  {
    title: "ブクログ",
    imgUrl: "img/booklog.jpg",
    searchUrl: {
      isbn: "https://booklog.jp/item/1/" + SEARCH_PLACEHOLDER,
      bookName: "https://booklog.jp/search?keyword=" + SEARCH_PLACEHOLDER
    }
  },
  {
    title: "ブックウォーカー",
    imgUrl: "img/bookwalker.png",
    searchUrl: {
      isbn: "",
      bookName: "https://bookwalker.jp/search/?qcat=&word=" + SEARCH_PLACEHOLDER
    }
  },
  {
    title: "honto",
    imgUrl: "img/honto.jpg",
    searchUrl: {
      isbn: "https://honto.jp/netstore/search.html?k=" + SEARCH_PLACEHOLDER,
      bookName: "https://honto.jp/netstore/search.html?k=" + SEARCH_PLACEHOLDER
    }
  },
  {
    title: "Amazon",
    imgUrl: "img/amazon.png",
    searchUrl: {
      isbn: "https://www.amazon.co.jp/dp/" + SEARCH_PLACEHOLDER,
      bookName: "https://www.amazon.co.jp/s?k=" + SEARCH_PLACEHOLDER +"&i=stripbooks"
    }
  },
  {
    title: "国会図書館",
    imgUrl: "img/ndl.png",
    searchUrl: {
      isbn: "https://ndlonline.ndl.go.jp/#!/search?isbn=" + SEARCH_PLACEHOLDER,
      bookName: "https://ndlonline.ndl.go.jp/#!/search?title=" + SEARCH_PLACEHOLDER
    }
  },
  {
    title: "国立国会図書館サーチ",
    imgUrl: "img/ndl_search.png",
    searchUrl: {
      isbn: "https://iss.ndl.go.jp/books?ar=4e1f&mediatypes%5B%5D=1&mediatypes%5B%5D=4&repository_nos%5B%5D=R100000002&repository_nos%5B%5D=R100000039&repository_nos%5B%5D=R100000040&rft.isbn=" + SEARCH_PLACEHOLDER + "&search_mode=advanced",
      bookName: "https://iss.ndl.go.jp/books?ar=4e1f&mediatypes%5B%5D=1&mediatypes%5B%5D=4&repository_nos%5B%5D=R100000002&repository_nos%5B%5D=R100000039&repository_nos%5B%5D=R100000040&rft.title=" + SEARCH_PLACEHOLDER + "&search_mode=advanced"
    }
  }
];
const openExternalPage = (isbn:string | null, bookName:string, link:Link) => {
  let searchUrl = "";
  if(isbn && link.searchUrl.isbn){
    const isbn10 = isbn.length === 10 ? isbn : util.isbn13To10(isbn);
    searchUrl = link.searchUrl.isbn.replace(SEARCH_PLACEHOLDER, isbn10);
  }else{
    searchUrl = link.searchUrl.bookName.replace(SEARCH_PLACEHOLDER, bookName);
  }

  util.openPageAsNewTab(searchUrl);
};
</script>

<template>
  <q-btn
    v-for="link in links"
    :disable="!props.isbn && !props.bookName"
    round
    padding="none"
    :title="link.title"
    class="q-mx-xs"
    @click="openExternalPage(props.isbn, props.bookName, link)"
  >
    <q-avatar size="32.58px">
      <q-img :src="link.imgUrl"></q-img>
    </q-avatar>
  </q-btn>
  <q-btn
    v-if="props.otherLink && util.isUrl(props.otherLink)"
    size="19px"
    round
    padding="none"
    class="q-mx-xs"
    icon="link"
    color="white"
    text-color="black"
    title="外部リンク"
    @click="util.openPageAsNewTab(props.otherLink)"
  >
  </q-btn>
</template>