<script setup lang="ts">

import util from "@/modules/util";
import { ComputedRef, computed } from "vue";
import CRoundLink from "@/components/c-round-link.vue";

interface Props {
  bookName: string,
  isbn: string | null,
  authorName: string | null,
  otherLink: string | null
}
const props = defineProps<Props>();

const SEARCH_PLACEHOLDER = "@PLACEHOLDER@";
type Link = {
  title: string,
  imgUrl: string,
  searchUrl: {
    isbn: string | null
    bookName: string | null
    authorName: string | null
  }
};
const links:Link[] = [
  {
    title: "カーリル",
    imgUrl: "img/calil.jpg",
    searchUrl: {
      isbn: "https://calil.jp/book/" + SEARCH_PLACEHOLDER,
      bookName: "https://calil.jp/search?q=" + SEARCH_PLACEHOLDER,
      authorName: null
    }
  },
  {
    title: "ブックウォーカー",
    imgUrl: "img/bookwalker.png",
    searchUrl: {
      isbn: null,
      bookName: "https://bookwalker.jp/search/?qcat=&word=" + SEARCH_PLACEHOLDER,
      authorName: null
    }
  },
  {
    title: "honto",
    imgUrl: "img/honto.jpg",
    searchUrl: {
      isbn: "https://honto.jp/netstore/search.html?k=" + SEARCH_PLACEHOLDER,
      bookName: "https://honto.jp/netstore/search.html?k=" + SEARCH_PLACEHOLDER,
      authorName: null
    }
  },
  {
    title: "Amazon",
    imgUrl: "img/amazon.png",
    searchUrl: {
      isbn: "https://www.amazon.co.jp/dp/" + SEARCH_PLACEHOLDER,
      bookName: "https://www.amazon.co.jp/s?k=" + SEARCH_PLACEHOLDER +"&i=stripbooks",
      authorName: null
    }
  },
  {
    title: "国会図書館",
    imgUrl: "img/ndl.png",
    searchUrl: {
      isbn: "https://ndlsearch.ndl.go.jp/search?cs=bib&display=panel&from=0&size=20&f-ht=ndl&f-mt=dtbook&f-mt=magazine&f-mt=dissertation&f-mt=dbook&f-mt=ddoc&f-isbn=" + SEARCH_PLACEHOLDER,
      bookName: "https://ndlsearch.ndl.go.jp/search?cs=bib&display=panel&from=0&size=20&keyword=" + SEARCH_PLACEHOLDER + "&f-ht=ndl&f-mt=dtbook&f-mt=magazine&f-mt=dissertation&f-mt=dbook&f-mt=ddoc",
      authorName: null
    }
  },
  {
    title: "マルチサーチ",
    imgUrl: "img/multisearch.ico",
    searchUrl: {
      isbn: "https://wata189.github.io/multisearch-vite/?isbn=" + SEARCH_PLACEHOLDER,
      bookName: "https://wata189.github.io/multisearch-vite/?bookName=" + SEARCH_PLACEHOLDER,
      authorName: null
    }
  },
  {
    title: "Wikipedia",
    imgUrl: "img/wikipedia.png",
    searchUrl: {
      isbn: null,
      bookName: null,
      authorName: "https://ja.wikipedia.org/wiki/" + SEARCH_PLACEHOLDER
    }
  }
];
type LinkBtn = {
  title: string,
  imgUrl: string | undefined,
  href: string | undefined,
  icon: string | undefined,
  color: string | undefined
};
const linkBtns:ComputedRef<LinkBtn[]> = computed(() => {
  const linkBtns:LinkBtn[] = links.map((link) => {
    let href:string | undefined = undefined;
    
    if(props.isbn && link.searchUrl.isbn){
      const isbn10 = props.isbn.length === 10 ? props.isbn : util.isbn13To10(props.isbn);
      href = link.searchUrl.isbn.replace(SEARCH_PLACEHOLDER, isbn10);
    }else if(props.bookName && link.searchUrl.bookName){
      href = link.searchUrl.bookName.replace(SEARCH_PLACEHOLDER, props.bookName);
    }else if(props.authorName && link.searchUrl.authorName){
      // 空白・カンマ取り除いてトリム 英語のことは考慮しない
      // eslint-disable-next-line no-irregular-whitespace
      const trimedAuthorName = props.authorName.trim().replace(/[ 　,，、]/g, "");
      href = link.searchUrl.authorName.replace(SEARCH_PLACEHOLDER, trimedAuthorName);
    }
    return {
      title: link.title, 
      imgUrl: link.imgUrl, 
      href,
      icon: undefined,
      color: undefined
    };
  });

  if(props.otherLink && util.isUrl(props.otherLink)){
    const otherLinkBtn:LinkBtn = {
      title: "外部リンク",
      imgUrl: undefined,
      href: props.otherLink,
      icon: "link",
      color: "secondary"
    }
    linkBtns.push(otherLinkBtn);
  }

  return linkBtns;
});
</script>

<template>
  <c-round-link
    v-for="linkBtn in linkBtns"
    :key="linkBtn.title"
    :disable="!linkBtn.href"
    round
    :title="linkBtn.title"
    :href="linkBtn.href"
    :img-url="linkBtn.imgUrl"
    :icon="linkBtn.icon"
    :color="linkBtn.color"
    
  ></c-round-link>
</template>