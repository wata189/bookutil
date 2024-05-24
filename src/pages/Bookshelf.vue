<script setup lang="ts">
import { onMounted, Ref } from '@vue/runtime-core';
import { computed, ref, toRefs } from 'vue';
import { QForm, useQuasar } from "quasar";

import { NotifyUtil } from "@/modules/notifyUtil";
const notifyUtil = new NotifyUtil(useQuasar());
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import AxiosUtil from '@/modules/axiosUtil';
import {NdlBook, getNdlBook, searchNdlShortStorys, ShortStory} from '@/modules/ndlSearchUtil';
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  BOOKSHELF: "cache-bookshelf",
  TAGS: "cache-toreadTags",
  TAGS_HISTORIES: "cache-tagsHistories"
};
import CBooksSearchDialog from '@/components/c-books-search-dialog.vue';
import CRoundBtn from '@/components/c-round-btn.vue';
import CDialog from "@/components/c-dialog.vue";
import CInputTag from "@/components/c-input-tag.vue";
import CPagination from '@/components/c-pagination.vue';
import CBookCard from '@/components/c-book-card.vue';
import CTransition from "@/components/c-transition.vue";
// axiosUtilのインスタンス作成
const EMIT_NAME_ERROR = "show-error-dialog";
const EMIT_NAME_CONFIRM = "show-confirm-dialog";
const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);

const emitError = (statusText:string, msg:string, status?:number) => {
  emits(EMIT_NAME_ERROR, status, statusText, msg);
};

interface Props {
  isAppLoaded: boolean
}
const props = defineProps<Props>();

const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg"

type Content = {
  authorName: string | null,
  contentName: string,
  rate: number
};
type BookshelfBook = {
  documentId: string | null,
  bookName: string,
  isbn: string | null,
  coverUrl: string,
  authorName: string | null,
  publisherName: string | null,
  readDate: string | null,
  updateAt: number,
  tags: string[],
  rate: number,
  contents: Content[],
  dispCoverUrl: string
};
const bookshelfBooks:Ref<BookshelfBook[]> = ref([]);

const pagination = ref({
  number: 1,

  dispMax: 99
});
const paginationMax = computed(() => {
  return Math.ceil(filteredSortedBookshelfBooks.value.length / pagination.value.dispMax)
});
const isShowPagination = computed(() => {
  return filteredSortedBookshelfBooks.value.length > pagination.value.dispMax;
});
const toTopPagenation = () => {
  pagination.value.number = 1;
};
const filteredSortedBookshelfBooks = computed({
  get: () => {
    // 条件キャッシュ
    const filterWords = util.strToTag(filterCond.value.word);
    const plusFilterWords = filterWords.filter(word => !word.startsWith("-"));
    // マイナス検索の単語を抽出　最初の1文字は事前に削除しておく
    const minusFilterWords = filterWords.filter(word => word.startsWith("-")).map(word => word.slice(1));
    const sortByUpdateAt = (a:BookshelfBook, b:BookshelfBook) => b.updateAt - a.updateAt;
    let sortFunc = sortByUpdateAt;
    // TODO: ソートあれこれ
    if(true){
      sortFunc = (a:BookshelfBook, b:BookshelfBook) => {
        const aDateTime = new Date(a.readDate || "9999/12/31").getTime();
        const bDateTime = new Date(b.readDate || "9999/12/31").getTime();
        return bDateTime - aDateTime;
      };
    }

    /////// フィルター
    return bookshelfBooks.value.filter((book:BookshelfBook) => {
      if(filterWords.length === 0){return true;}
      // 通常のワード検索
      const searchedText = [
        book.bookName,
        book.isbn,
        book.authorName,
        book.publisherName,
        book.tags
      ].join("/") // /区切りで結合することで、予想外の検索ヒットを減らす
      .replace(/[ 　,]/g, ""); // 空白など削除

      // すべてのキーワードがひっかかったらtrue
      const hasPlusFilterWords = plusFilterWords.filter(word => searchedText.includes(word)).length === plusFilterWords.length;
      // マイナス検索　マイナス検索1件でも引っかかったらダメ
      const hasMinusFilterWords = minusFilterWords.filter(word => searchedText.includes(word)).length > 0;
      return hasPlusFilterWords && !hasMinusFilterWords;
    })
    .sort(sortByUpdateAt) // 1回更新順でソートする
    .sort(sortFunc); // 選択した条件でソート

  },
  set: (value) => {
    bookshelfBooks.value = value
  }
})
const dispBookshelfBooks = computed({
  get: () => {
    /////// ページ件数で絞り込み
    return filteredSortedBookshelfBooks.value.slice(
      // start: ページ番号 - 1 * 表示件数
      (pagination.value.number - 1) * pagination.value.dispMax,
      // end: ページ番号*表示件数 or 最後
      Math.min(pagination.value.number * pagination.value.dispMax, bookshelfBooks.value.length)
    );
  },
  set: (value) => {
    bookshelfBooks.value = value
  }
});
const tagOptions:Ref<string[]> = ref([]);

// 画面初期化
const initBookshelf = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/bookshelf/init", {idToken});
  if(response){
    await setInitInfo(response.data.bookshelfBooks, response.data.tags);
  }
};
const setInitInfo = async (books:BookshelfBook[], tags: string[]) => {
  // キャッシュに保存
  const limitHours = 1;
  await cacheUtil.set(CACHE_KEY.BOOKSHELF, books, limitHours);
  await cacheUtil.set(CACHE_KEY.TAGS, tags, limitHours);

  bookshelfBooks.value = books.map((book:BookshelfBook):BookshelfBook => {
    let dispCoverUrl = IMG_PLACEHOLDER_PATH;
    if(book.coverUrl){
      dispCoverUrl = book.coverUrl;
    }else if(book.isbn){
      dispCoverUrl = util.getOpenBdCoverUrl(book.isbn);
    }
    const retBook = {
      ...book,
      dispCoverUrl
    };
    return retBook;
  });
  tagOptions.value = tags;
};
const getBook = async (isbn:string) => {
  const trimedIsbn = isbn.trim();
  if(!util.isIsbn(trimedIsbn)){return;}

  const book = await getNdlBook(trimedIsbn);
  // 本があったらフォームに設定
  if(book){
    await setBookFromNdlSearch(book);
  }else{
    // なかったらエラーダイアログ
    emitError("エラー", "国立国会図書館サーチからデータを取得できませんでした");
  }
};
const setBookFromNdlSearch = async (book:NdlBook) => {
  if(book.isbn){
    bookDialog.value.form.isbn = book.isbn;
  }
  if(book.bookName){
    bookDialog.value.form.bookName = book.bookName;
  }
  if(book.authorName){
    bookDialog.value.form.authorName = book.authorName;
  }
  if(book.coverUrl){
    bookDialog.value.form.coverUrl = book.coverUrl;
  }
  if(book.publisherName){
    bookDialog.value.form.publisherName = book.publisherName;
  }
  if(!book.isbn || !util.isIsbn(book.isbn)){return;}

  const shortStorys = await searchNdlShortStorys(book.isbn);
  setShortStorysToContents(shortStorys);
};

const bookDialogForm:Ref<QForm | undefined> = ref();
const createBook = () => {
  // フォームのバリデーション処理
  if(!bookDialogForm.value){return;}
  bookDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // ダイアログ消す
    bookDialog.value.isShow = false;
    // formを送る
    const params = await createCreateParams(bookDialog.value.form);
    const response = await axiosUtil.post(`/bookshelf/create`, params);
    if(response){
      const message = `『${bookDialog.value.form.bookName}』を新規作成しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setInitInfo(response.data.bookshelfBooks, response.data.tags);

      // タグ履歴更新
      if(bookDialog.value.form.tags){
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
const addTagsHistories = async (tags:string) => {
  tagsHistories.value.push(tags);
  if(tagsHistories.value.length > 10){
    tagsHistories.value.shift();
  }
  await cacheUtil.set(CACHE_KEY.TAGS_HISTORIES, [...tagsHistories.value]);
};
const editBook = () => {
  // フォームのバリデーション処理
  if(!bookDialogForm.value){return;}
  bookDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // formを送る
    const updateAt = bookDialog.value.updateAt || 0;
    // ダイアログ消す
    bookDialog.value.isShow = false;
    const response = await updateBook(bookDialog.value.documentId, updateAt, bookDialog.value.form);
    if(response){
      const message = `『${bookDialog.value.form.bookName}』を更新しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setInitInfo(response.data.bookshelfBooks, response.data.tags);
      // タグ履歴更新
      if(bookDialog.value.form.tags){
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
const updateBook = async (documentId:string, updateAt:number, form:BookshelfBookForm) => {
  const params = await createUpdateParams(documentId, updateAt, form);
  const response = await axiosUtil.post(`/bookshelf/update`, params);
  return response;
};
type BookshelfBookForm = {
  bookName: string,
  isbn: string,
  authorName: string,
  publisherName: string,
  coverUrl: string,
  tags: string,
  rate: number,
  contents: Content[],
  readDate: string
};
type BookshelfBookParams = BookshelfBook & {
  idToken: string | null,
  user: string
};
const createCreateParams = async (form:BookshelfBookForm) => {
  const params = await createBookParams(form);

  return params;
};
const createUpdateParams = async (documentId:string, updateAt:number, form:BookshelfBookForm) => {
  const params = await createBookParams(form);
  params.documentId = documentId;
  params.updateAt = updateAt;
  return params;
};
const createBookParams = async (form:BookshelfBookForm) => {
  const idToken = await authUtil.getIdToken();
  const user = authUtil.getUserInfo();
  const email = user.email || "No User Data";
  const params:BookshelfBookParams = {
    documentId: null,
    updateAt: 0,
    user: email,

    // フォームのパラメータ
    bookName: form.bookName.trim(),
    isbn: form.isbn ? form.isbn.trim() : null,
    authorName: form.authorName ? form.authorName.trim() : null,
    publisherName: form.publisherName ? form.publisherName.trim() : null,
    tags: form.tags ? util.strToTag(form.tags.trim()) : [],
    coverUrl: form.coverUrl ? form.coverUrl.trim() : "",
    rate: form.rate ? form.rate : 0,
    contents: form.contents ? form.contents : [],
    readDate: form.readDate ? form.readDate.trim() : null,

    // dispCoverUrl型の関係で入れとく
    dispCoverUrl: "",

    // アクセストークン
    idToken,
  };
  
  return params;
};
type SimpleBookshelfBooksParams = {
  documentId: string;
  updateAt: number;
  user: string;
  idToken: string | null;
};
const deleteBook = async (book:BookshelfBook) => {
  // 確認ダイアログ
  emits(EMIT_NAME_CONFIRM, "確認", `『${book.bookName}』を削除します。`, true, async () => {
    const idToken = await authUtil.getIdToken()
    const user = authUtil.getUserInfo();
    const params:SimpleBookshelfBooksParams = {
      documentId: book.documentId || "",
      updateAt: book.updateAt || 0,
      user: user.email || "No User Data",
      idToken
    };
    const response = await axiosUtil.post(`/bookshelf/delete`, params);
    if(response){
      const message = `『${book.bookName}』を削除しました`;
      // TODO: 削除した本を戻す処理
      notifyUtil.notify(message, [], true);
      // 画面情報再設定
      await setInitInfo(response.data.bookshelfBooks, response.data.tags);
    }
  });

};
type BookDialog = {
  isShow: boolean,
  documentId: string,
  updateAt: number | null,
  headerText: string,
  showDatePopup: boolean,
  okLabel: string,
  okFunction: Function,
  form: BookshelfBookForm
};
const bookDialog:Ref<BookDialog> = ref({
  isShow: false,
  documentId: "",
  updateAt: null,
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  showDatePopup: false,
  form: {
    bookName: "",
    isbn: "",
    authorName: "",
    publisherName: "",
    coverUrl: "",
    tags: "",
    rate: 0,
    contents: [],
    readDate: ""
  }
});
const isCreateUniqueIsbn = (val:string) => {
  if(!util.isExist(val)){return true;}

  let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
  let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

  const isbns = bookshelfBooks.value.map(book => book.isbn);

  return (!isbns.includes(isbn13) && !isbns.includes(isbn10)) || "同じISBNの本があります";
};
const isUpdateUniqueIsbn = (documentId:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
    let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

    const sameIsbnBook = bookshelfBooks.value.find(book => {
      return (book.isbn === isbn13 || book.isbn === isbn10) && book.documentId === documentId;
    });

    return util.isExist(sameIsbnBook) || "同じISBNの本があります";
  }
};
const showCreateBookDialog = () => {
  bookDialog.value.documentId = "";
  bookDialog.value.headerText = "新規作成";
  bookDialog.value.okLabel = "新規作成";
  bookDialog.value.okFunction = createBook;
  bookDialog.value.form = {
    bookName: "",
    isbn: "",
    authorName: "",
    publisherName: "",
    coverUrl: "",
    tags: "",
    rate: 0,
    contents: [],
    readDate: ""
  };
  bookDialog.value.isShow = true;

  validationRules.isbn = [
    validationUtil.isIsbn(labels.isbn),
    isCreateUniqueIsbn
  ];
};
// 編集ダイアログ表示
const showEditBookDialog = (book:BookshelfBook) => {
  if(!book.documentId)return;
  bookDialog.value.documentId = book.documentId;
  bookDialog.value.headerText = "編集";
  bookDialog.value.okLabel = "更新";
  bookDialog.value.okFunction = editBook;
  bookDialog.value.updateAt = book.updateAt;
  bookDialog.value.form = {
    bookName: book.bookName,
    isbn: book.isbn || "",
    authorName: book.authorName || "",
    publisherName: book.publisherName || "",
    coverUrl: book.coverUrl,
    tags: book.tags.join("/"),
    rate: book.rate,
    contents: [...book.contents],
    readDate: book.readDate || ""
  };
  bookDialog.value.isShow = true;

  validationRules.isbn = [
    validationUtil.isIsbn(labels.isbn),
    isUpdateUniqueIsbn(book.documentId)
  ];
};
// isbnの入力補完
const onUpdateIsbn = (inputIsbn: string) => {
  let isbn = inputIsbn.replace(/-/g, "");
  if(isbn.length === 9){
    isbn = util.isbn9To10(isbn);
  }else if(isbn.length === 12){
    isbn = util.isbn12To13(isbn);
  }
  
  if(util.isIsbn(isbn)){
    bookDialog.value.form.isbn = isbn;
  }
};
// ローカルストレージのタグ履歴取得
const tagsHistories:Ref<string[]> = ref([]);
const setLatestTagsFromTagsHistories = async () => {
  const latestTags = tagsHistories.value.pop();
  if(latestTags){
    // 最新タグ設定
    bookDialog.value.form.tags = latestTags;
    // キャッシュ更新
    await cacheUtil.set(CACHE_KEY.TAGS_HISTORIES, [...tagsHistories.value]);
  }
};

const isShowFilterCond = ref(false);
const labels = {
  bookName: "書籍名",
  isbn: "ISBN",
  authorName: "著者名",
  publisherName: "出版社名",
  coverUrl: "書影URL",
  tags: "タグ",
  readDate: "読了日",
  rate: "評価",
  contents: {
    contentName: "内容名",
    authorName: "著者名",
    rate: "評価"
  }
};
const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  coverUrl: [validationUtil.isUrl(labels.coverUrl)],
  contents: {
    readDate: [
      validationUtil.isDateStr(labels.readDate),
      validationUtil.isValidDate(labels.readDate)
    ],
    contentName: [validationUtil.isExist(labels.contents.contentName)]
  }
};
const searchShortStorys = async (isbn:string) => {
  if(!isbn || !util.isIsbn(isbn)){return;}

  const shortStorys = await searchNdlShortStorys(isbn);

  if(shortStorys.length === 0){
    emitError("エラー", "書籍内容がありません");
    return;
  }

  setShortStorysToContents(shortStorys);
};
const setShortStorysToContents = (shortStorys: ShortStory[]) => {
  // shortStorysをcontentsとして設定
  shortStorys.map(shortStory => {
    return {
      contentName: shortStory.title,
      authorName: shortStory.author,
      rate: 0
    }
  }).forEach(shortStory => bookDialog.value.form.contents.push(shortStory));
};

const booksSearchDialog = ref({
  isShow: false,
  okFunction: (ndlBook:NdlBook) => {console.log(ndlBook)},
  searchWord: ""
});
const showBooksSearchDialog = (searchWord:string) => {
  if(!util.isExist(searchWord)){
    emitError("エラー", "書籍名を入力してください");
    return;
  }

  booksSearchDialog.value = {
    isShow: true,
    okFunction: setBookFromNdlSearch,
    searchWord
  };
};

const filterCond = ref({
  word: "",
  isOnlyNewBook: false
});

const contentsTable = {
  columns: [
    {name: "authorName" , label: "", field: "authorName" , classes: "contents-table-author-name"},
    {name: "contentName", label: "", field: "contentName"},
    {name: "rate"       , label: "", field: "rate"       , classes: "contents-table-rate"},
    {name: "deleteBtn"  , label: "", field: ""           , classes: "contents-table-delete-btn"}
  ]
};

const {isAppLoaded} = toRefs(props);
onMounted(util.waitParentMount(isAppLoaded, async () => {
  // キャッシュからリスト取得してみる
  const cachedBookshelfBooks:BookshelfBook[] | null = await cacheUtil.get(CACHE_KEY.BOOKSHELF);
  const cachedToreadTags:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS);
  if(cachedBookshelfBooks && cachedToreadTags) {
    await setInitInfo(cachedBookshelfBooks, cachedToreadTags);
  }else{
    await initBookshelf();
  }
  
  // タグ履歴キャッシュ
  const cachedTagsHistories:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS_HISTORIES);
  if(cachedTagsHistories){
    tagsHistories.value = cachedTagsHistories;
  }

  console.log("mounted bookshelf");
}))
</script>

<template>
  <div>
    
    <q-page-container @click="isShowFilterCond = false">
      <q-page>
        <div class="row lt-md items-center">
          <q-space></q-space>
          <div class="q-pa-sm">
            <c-pagination
              v-if="isShowPagination"
              v-model="pagination.number"
              :max="paginationMax"
            ></c-pagination>
          </div>
          <div class="col-aut q-pa-sm text-primary">{{ filteredSortedBookshelfBooks.length }}冊</div>
          <q-space></q-space>
        </div>
        <div class="row justify-center q-pa-md">
          <div v-for="book in dispBookshelfBooks" class="col book-cover-wrapper q-my-sm">
            <c-book-card
              :book-name="book.bookName"
              :isbn="book.isbn || ''"
              :author-name="book.authorName || ''"
              :tags="book.tags"
              :disp-cover-url="book.dispCoverUrl"
              hide-book-links
            >
              <template v-slot:menu-footer>
                <div class="row">
                  <div class="col-12">
                    読了日：{{ book.readDate }}
                  </div>
                  <div class="col-auto">
                    <c-round-btn
                      title="削除"
                      icon="delete"
                      color="negative"
                      @click="deleteBook(book)"
                    ></c-round-btn>
                  </div>
                  <div class="col"></div>
                  <div class="col-auto">
                    <c-round-btn
                      title="編集"
                      icon="edit"
                      color="primary"
                      @click="showEditBookDialog(book)"
                    ></c-round-btn>
                  </div>
                </div>
              </template>
            </c-book-card>
          </div>
        </div>
        <div class="row items-center">
          <q-space></q-space>
          <div class="q-pa-sm">
            <c-pagination
              v-if="isShowPagination"
              v-model="pagination.number"
              :max="paginationMax"
            ></c-pagination>
          </div>
          <div class="col-aut q-pa-sm text-primary">{{ filteredSortedBookshelfBooks.length }}冊</div>
          <q-space></q-space>
        </div>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <div class="row justify-end items-end">
        <c-transition
          appear
          enter="fadeIn"
          leave="fadeOut"
        >
          <div ref="filtercond" v-if="isShowFilterCond" class="col-12 col-sm-6 col-md-auto q-pa-sm">
            <div class="row filter-cond shadow-up-12" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-3 text-black'">
              <div class="col q-pa-sm">
                <c-input-tag
                  v-model="filterCond.word"
                  label="検索"
                  dense
                  hint=",/スペースで区切られます"
                  :options="tagOptions"
                  @update:model-value="toTopPagenation"
                ></c-input-tag>
              </div>
            </div>
          </div>
        </c-transition>
        <div class="col-auto q-pa-xs">
          <c-round-btn
            ref="showfiltercondbtn"
            title="検索"  
            icon="search"
            color="secondary"
            :flat="false"
            @click="isShowFilterCond =!isShowFilterCond"
          ></c-round-btn>
        </div>
        <!-- TODO:ソート -->
        <div class="col-auto q-pa-xs">
          <c-round-btn
            title="新規作成"  
            icon="add"
            color="primary"
            :flat="false"
            @click="showCreateBookDialog"
          ></c-round-btn>
        </div>
      </div>
    </q-footer>
    <!-- 新規作成・編集ダイアログ -->
    <c-dialog
      v-model="bookDialog.isShow"
      :header-text="bookDialog.headerText"
      :okLabel="bookDialog.okLabel"
      @ok="bookDialog.okFunction"
    >
      <q-form ref="bookDialogForm">
        <div class="row">
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="bookDialog.form.bookName"
              clearable
              :label="labels.bookName"
              :rules="validationRules.bookName"
              
            >
              <template v-slot:append>
                <q-btn 
                  round 
                  dense 
                  flat 
                  icon="search"
                  @click="showBooksSearchDialog(bookDialog.form.bookName)"
                ></q-btn>
              </template>
            
            </q-input>
          </div>
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="bookDialog.form.isbn"
              clearable
              :label="labels.isbn"
              :rules="validationRules.isbn"
              @update:model-value="onUpdateIsbn(bookDialog.form.isbn)"
            >
              <template v-slot:append>
                <q-btn 
                  round 
                  dense 
                  flat 
                  icon="search"
                  @click="getBook(bookDialog.form.isbn)"
                ></q-btn>
              </template>
            </q-input>
          </div>
          
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-input
              clearable
              v-model="bookDialog.form.authorName"
              :label="labels.authorName"
            ></q-input>
          </div>
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-input
              v-model="bookDialog.form.publisherName"
              clearable
              :label="labels.publisherName"
            ></q-input>
          </div>
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="bookDialog.form.coverUrl"
              clearable
              :label="labels.coverUrl"
              :rules="validationRules.coverUrl"
            ></q-input>
          </div>
          <div class="col-12 q-pa-xs">
            <c-input-tag
              v-model="bookDialog.form.tags"
              :label="labels.tags"
              hint=",/スペースで区切られます"
              :options="tagOptions"
            ></c-input-tag>
          </div>
        </div>

        <div class="row">
          <q-space></q-space>
          <div class="col-auto q-pa-xs">
            <q-btn 
              :disable="tagsHistories.length <= 0" 
              @click="setLatestTagsFromTagsHistories" 
              flat 
              label="タグ履歴" 
              color="primary" 
            />
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-input
              v-model="bookDialog.form.readDate"
              clearable
              :label="labels.readDate"
              :rules="validationRules.contents.readDate"
              mask="XXXX/XX/XX"
            >
              <template v-slot:append>
                <q-btn 
                  round 
                  dense 
                  flat 
                  icon="event"
                >
                  <q-popup-proxy v-model="bookDialog.showDatePopup">
                    <q-date v-model="bookDialog.form.readDate" today-btn @update:model-value="bookDialog.showDatePopup = false" />
                  </q-popup-proxy>
                </q-btn>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-rating
              v-model="bookDialog.form.rate"
              size="3.3em"
              max="5"
              color="primary"
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn 
              @click="bookDialog.form.contents.push({authorName: '', contentName: '', rate: 0})" 
              flat 
              label="1行追加" 
              color="primary" 
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn 
              :disable="!util.isExist(bookDialog.form.isbn)|| !util.isIsbn(bookDialog.form.isbn)"
              @click="searchShortStorys(bookDialog.form.isbn)" 
              flat 
              label="書籍内容検索" 
              color="primary" 
            />
          </div>
          <div v-if="bookDialog.form.contents.length > 0" class="col-12 q-pa-xs">
            <q-table
              bordered
              hide-header
              hide-bottom
              :rows="bookDialog.form.contents"
              :columns="contentsTable.columns"
              row-key="contentName"
              dense
              :rows-per-page-options="[0]"
              :card-class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-2' "
            >
              <template v-slot:body="props">
                <q-tr :props=props>
                  <q-td key="authorName" :props="props">
                    <q-input
                      v-model="props.row.authorName"
                      dense
                      :label="labels.contents.authorName"
                    ></q-input>
                  </q-td>
                  <q-td key="contentName" :props="props">
                    <q-input
                      v-model="props.row.contentName"
                      dense
                      :label="labels.contents.contentName"
                      :rules="validationRules.contents.contentName"
                    ></q-input>
                  </q-td>
                  <q-td key="rate" :props="props">
                    <q-rating
                      v-model="props.row.rate"
                      max="5"
                      color="primary"
                    ></q-rating>
                  </q-td>
                  <q-td key="deleteBtn" :props="props">
                    <c-round-btn
                      title="削除"
                      icon="delete"
                      is-flat
                      color="primary"
                      dense
                      @click="bookDialog.form.contents.splice(props.rowIndex, 1)"
                    >

                    </c-round-btn>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
        
        
      </q-form>
    </c-dialog>

    <!-- 書籍検索ダイアログ -->
    <c-books-search-dialog
      v-model="booksSearchDialog.isShow"
      :search-word="booksSearchDialog.searchWord"
      @ok="booksSearchDialog.okFunction"
      @error="emitError('エラー', '国会図書館サーチからデータを取得できませんでした')"
    ></c-books-search-dialog>
  </div>
</template>

<style scoped>
.book-cover-wrapper{
  max-width: 120px;
  min-width: 120px;
}

@media (min-width: 600px){
  .book-cover-wrapper{
    max-width: 150px;
    min-width: 150px;
  }
}

.filter-cond{
  border-radius: 15px;
}

.set-tag-dialog-form-tags{
  width: 300px;
}

.contents-table-author-name{
  width: 100px;
}
@media(min-width: 600px){
  .contents-table-author-name{
    width: 150px;
  }
}
.contents-table-rate{
  width: 89px;
}
.contents-table-delete-btn{
  width: 58px;
}
</style>