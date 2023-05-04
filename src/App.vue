<script setup lang="ts">
import CHeader from '@/components/c-header.vue';

const pageName:string = 'Bookutil'; //TODO:ページ名をページごとに取得
// TODO: メニューは権限に応じて取得
const menus = [
  {name: "読みたいリスト", to:"/toread",       icon:"mdi-format-list-bulleted-type",
    description: "読みたい本をリスト化します。"
  },
  {name: "図書館リスト",   to:"/libraries",    icon:"mdi-bank-outline",
    description: "利用する図書館の一覧を表示します。"
  },
  {name: "短編小説検索",   to:"/shortstories", icon:"mdi-book-open-variant",
    description: "短編集が収録している短編小説を検索します。"
  },
];
</script>

<template>
  <q-layout>
    <q-page-container>
      <q-page>
        <c-header
          :page-name="pageName"
          :menus="menus"
        ></c-header>
        <RouterView :menus="menus" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style>
body {
  font-family: "BIZ UDPGothic";
}

[v-cloak] {
  display: none;
}
</style>
