<script setup lang="ts">
import { onMounted, Ref } from '@vue/runtime-core';
import { ref } from '@vue/reactivity';
import { QForm} from "quasar";

import axiosUtil from '@/modules/axiosUtil';
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import openBdUtil from "@/modules/openBdUtil";

import CRoundBtn from '@/components/c-round-btn.vue';
import CDialog from "@/components/c-dialog.vue";
import CInputTag from "@/components/c-input-tag.vue";



const searchWord = ref("");
const tags = ref("");

type Book = {
  id: string,
  bookName: string,
  isbn: string | null,
  coverUrl: string,
  authorName: string | null,
  publisherName: string | null,
  page: number | null,
  otherUrl: string | null,
  newBookCheckFlg: Ref<number>,
  updateAt: number,
  tags: string,
  isChecked: Ref<boolean>
};

const toreadBooks: Ref<Book[]> = ref([]);

const toreadTagOptions = ref([]);

// toread画面初期化処理
const initToread = async () => {
  const accessToken = localStorage.accessToken;
  const response = await axiosUtil.get(`/toread/init?access_token=${accessToken}`);
  if(response){
    toreadBooks.value = response.data.toreadRows.map((book:Book):Book => {
      const retBook = {
        ...book,
        isChecked: ref(false)
      };
      retBook.newBookCheckFlg = ref(book.newBookCheckFlg);
      return retBook;
    });
    toreadTagOptions.value = response.data.toreadTags;
  }
};


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
  }
];
const openExternalPage = (isbn:string | null, bookName:string, link:Link) => {
  let searchUrl = "";
  if(isbn && link.searchUrl.isbn){
    searchUrl = link.searchUrl.isbn.replace(SEARCH_PLACEHOLDER, isbn);
  }else{
    searchUrl = link.searchUrl.bookName.replace(SEARCH_PLACEHOLDER, bookName);
  }

  openPageAsNewTab(searchUrl);
};
const openPageAsNewTab = (url: string) => {
  util.openPageAsNewTab(url);
};

const getBookInfo = async (isbn:string) => {
  const trimedIsbn = isbn.trim()
  if(!trimedIsbn){return;}
  if(!util.isIsbn(trimedIsbn)){return;}

  const bookInfo = await openBdUtil.getBookInfo(trimedIsbn);
  // bookInfoがあったらフォームに設定
  if(bookInfo){
    bookDialog.value.form.isbn = bookInfo.isbn;
    bookDialog.value.form.bookName = bookInfo.bookName;
    bookDialog.value.form.authorName = bookInfo.authorName;
    bookDialog.value.form.publisherName = bookInfo.publisherName;
    bookDialog.value.form.page = bookInfo.page;
  }

};

const bookDialogForm:Ref<QForm | undefined> = ref();
const createBook = () => {
  // フォームのバリデーション処理
  if(!bookDialogForm.value){return;}
  bookDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // formを送る
    const params = await createCreateParams(bookDialog.value.form);
    const response = await axiosUtil.post(`/toread/create`, params);
    if(response){
      // 画面情報取得し直し
      await initToread();
      // ダイアログ消す
      bookDialog.value.isShow = false;
    }
  });
};

type BookForm = {
    bookName: string,
    isbn: string,
    authorName: string,
    publisherName: string,
    page: number | null
    otherUrl: string;
    newBookCheckFlg: number;
    tags: string;
}
const createCreateParams = async (form:BookForm) => {
  const params = await createBookParams(form);

  return params;
};
const createBookParams = async (form:BookForm) => {
  const accessToken = localStorage.accessToken || "";
  const user = await authUtil.getUserInfo(accessToken);
  const email = user.email || "No User Data";
  const params = {
    id: null,
    create_at: null,
    user: email,

    // フォームのパラメータ
    book_name: form.bookName.trim(),
    isbn: form.isbn.trim() || null,
    page: form.page || null,
    author_name: form.authorName.trim() || null,
    publisher_name: form.publisherName.trim() || null,
    other_url: form.otherUrl.trim() || null,
    new_book_check_flg: form.newBookCheckFlg,
    tags: form.tags.trim() || "",

    // アクセストークン
    access_token: accessToken
  };
  
  return params;
};
const initBookDialogForm:BookForm = {
  bookName: "",
  isbn: "",
  authorName: "",
  publisherName: "",
  page: null,
  otherUrl: "",
  newBookCheckFlg: 0,
  tags: ""
};
const bookDialog = ref({
  isShow: false,
  bookId: "",
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  form: initBookDialogForm
});
const showNewBookDialog = () => {
  bookDialog.value.bookId = "";
  bookDialog.value.headerText = "新規作成";
  bookDialog.value.okLabel = "新規作成";
  bookDialog.value.okFunction = createBook;
  bookDialog.value.form = {
    bookName: "",
    isbn: "",
    authorName: "",
    publisherName: "",
    page: null,
    otherUrl: "",
    newBookCheckFlg: 0,
    tags: ""
  };
  bookDialog.value.isShow = true;
};

const labels = {
  bookName: "書籍名",
  isbn: "ISBN",
  page: "ページ数",
  authorName: "著者名",
  publisherName: "出版社名",
  otherUrl: "その他URL",
  tags: "タグ",
  newBookCheckFlg: "新刊チェック"
};
const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  page: [validationUtil.isNumber(labels.page)],
  otherUrl: [validationUtil.isUrl(labels.otherUrl)]
};

const showBookDialog = (bookId:string) => {
  // TODO:編集ダイアログ表示

  return bookId;
};

onMounted(async () => {
  await initToread();
});
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
      <q-page>
        <div class="row">
          <div v-for="book in toreadBooks" class="col book-cover-wrapper q-pa-sm">
            <q-card class="q-pb-sm" :title="book.bookName">
              <q-checkbox
                v-model="book.isChecked"
              >
              </q-checkbox>
              <q-img
                :src="book.coverUrl"
                class="book-img"
                fit="contain"
              ></q-img>
              <div class="ellipsis q-px-sm">
                  {{ book.bookName }}
              </div>
              <q-menu fit class="q-pa-md book-info">
                <div class="text-bold">
                  {{ book.bookName }}
                </div>
                <div>
                  {{ book.authorName }} <span v-if="book.authorName && book.publisherName">/</span> {{ book.publisherName }}
                </div>
                <div>
                  <q-chip v-for="tag in book.tags.split('/')" dense color="teal">{{ tag }}</q-chip>
                </div>
                <q-btn
                  v-for="link in links"
                  round
                  padding="none"
                  :title="link.title"
                  class="q-mx-xs"
                  @click="openExternalPage(book.isbn, book.bookName, link)"
                >
                  <q-avatar size="32.58px">
                    <q-img :src="link.imgUrl"></q-img>
                  </q-avatar>
                </q-btn>
                <q-btn
                  v-if="book.otherUrl"
                  size="19px"
                  round
                  padding="none"
                  class="q-mx-xs"
                  icon="link"
                  color="white"
                  text-color="black"
                  title="外部リンク"
                  @click="openPageAsNewTab(book.otherUrl)"
                >
                </q-btn>
                <div class="row">
                  <div class="col-auto">
                    <q-toggle
                      v-model="book.newBookCheckFlg"
                      :true-value="1"
                      :false-value="0"
                      color="teal"
                    >
                      新刊チェック
                    </q-toggle>
                  </div>
                  <div class="col"></div>
                  <div class="col-auto">
                    <c-round-btn
                      title="編集"
                      icon="edit"
                      color="primary"
                      @click="showBookDialog(book.id)"
                    ></c-round-btn>
                  </div>
                </div>
              </q-menu>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>
    <q-footer class="bg-grey">
      <div class="row">
        <div class="col-12 col-sm-4 q-pa-sm">
          <q-input dense v-model="searchWord" label="検索"></q-input>
        </div>
        <div class="col-12 col-sm-8 q-pa-sm">
          <c-input-tag
            v-model="tags"
            label="タグ"
            dense
            hint=",/スペースで区切られます"
            :options="toreadTagOptions"
          ></c-input-tag>
        </div>
      </div>
      <div class="row">
        <div class="col-6  col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="negative" class="full-width">一括削除</q-btn>
        </div>
        <div class="col-6  col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="primary" class="full-width">一括タグ</q-btn>
        </div>
        <div class="col-0  col-sm-3 col-md-6"></div>
        <div class="col-12 col-sm-3 col-md-2 q-pa-sm">
          <q-btn color="primary" class="full-width" @click="showNewBookDialog">新規作成</q-btn>
        </div>
        <c-dialog
          v-model="bookDialog.isShow"
          :headerText="bookDialog.headerText"
          :okLabel = "bookDialog.okLabel"
          @ok="bookDialog.okFunction"
        >
          <q-form ref="bookDialogForm" class="row">
            <div class="col-12 q-pa-xs">
              <q-input
                v-model="bookDialog.form.bookName"
                :label="labels.bookName"
                :rules="validationRules.bookName"
              ></q-input>
            </div>
            <div class="col-8 col-md-2 q-pa-xs">
              <q-input
                v-model="bookDialog.form.isbn"
                :label="labels.isbn"
                :rules="validationRules.isbn"
                mask="#########X###"
              >
                <template v-slot:append>
                  <q-btn 
                    round 
                    dense 
                    flat 
                    icon="search"
                    @click="getBookInfo(bookDialog.form.isbn)"
                  ></q-btn>
                </template>
              </q-input>
            </div>
            <div class="col-4 col-md-2 q-pa-xs">
              <q-input
                v-model.number="bookDialog.form.page"
                type="number"
                min="1"
                :label="labels.page"
                :rules="validationRules.page"
              ></q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-4 q-pa-xs">
              <q-input
                v-model="bookDialog.form.authorName"
                :label="labels.authorName"
              ></q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-4 q-pa-xs">
              <q-input
                v-model="bookDialog.form.publisherName"
                :label="labels.publisherName"
              ></q-input>
            </div>
            <div class="col-12 col-md-6 q-pa-xs">
              <q-input
                v-model="bookDialog.form.otherUrl"
                :label="labels.otherUrl"
                :rules="validationRules.otherUrl"
              ></q-input>
            </div>
            <div class="col-12 col-md-6 q-pa-xs">
              <c-input-tag
                v-model="bookDialog.form.tags"
                :label="labels.tags"
                hint=",/スペースで区切られます"
                :options="toreadTagOptions"
              ></c-input-tag>
            </div>
            <div>
              <q-toggle
                v-model="bookDialog.form.newBookCheckFlg"
                :true-value="1"
                :false-value="0"
                :label="labels.newBookCheckFlg"
              ></q-toggle>
            </div>
            <q-space />
            <div>
              <q-btn
                v-for="link in links"
                :disable="!bookDialog.form.isbn"
                round
                padding="none"
                :title="link.title"
                class="q-mx-xs"
                @click="openExternalPage(bookDialog.form.isbn, bookDialog.form.bookName, link)"
              >
                <q-avatar size="32.58px">
                  <q-img :src="link.imgUrl"></q-img>
                </q-avatar>
              </q-btn>
            </div>
          </q-form>
        </c-dialog>
      </div>
    </q-footer>

  </q-layout>
</template>

<style scoped>
.book-cover-wrapper{
  max-width: 140px;
  min-width: 140px;
}

.book-img{
  max-height: 150px;
}

.book-info div{
  font-family: "BIZ UDPGothic";
}
</style>