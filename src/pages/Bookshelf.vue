<script setup lang="ts">
import { onMounted, Ref } from '@vue/runtime-core';
import { computed, ComputedRef, ref, toRefs } from "vue";
import { QForm, useQuasar } from "quasar";
import VueApexCharts from "vue3-apexcharts";

import { NotifyUtil } from "@/modules/notifyUtil";
const notifyUtil = new NotifyUtil(useQuasar());
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import AxiosUtil from '@/modules/axiosUtil';
import * as bookApiUtil from '@/modules/bookApiUtil';
import {searchNdlShortStorys, getCoverUrl} from '@/modules/ndlSearchUtil';
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

const sortByReadDate = (a:BookshelfBook, b:BookshelfBook) => {
  const aDateTime = new Date(a.readDate || "9999/12/31").getTime();
  const bDateTime = new Date(b.readDate || "9999/12/31").getTime();
  return bDateTime - aDateTime;
};
const filteredSortedBookshelfBooks = computed({
  get: () => {
    // 条件キャッシュ
    const filterWords = util.strToTag(filterCond.value.word);
    const plusFilterWords = filterWords.filter(word => !word.startsWith("-"));
    //評価フィルターは1~5の選択時は無効
    const useRateFilter = filterCond.value.rate.min !== 1 || filterCond.value.rate.max !== 5;
    const filterDateRangeMin = (new Date(filterCond.value.readDate.min)).getTime();
    const filterDateRangeMax = (new Date(filterCond.value.readDate.max)).getTime();
    //読了日フィルターは読了日範囲最小値～最大値の選択時は無効
    const useDateFilter = filterCond.value.readDate.min !== filterCondReadDateLimit.value.min || filterCond.value.readDate.max !== filterCondReadDateLimit.value.max;
    // マイナス検索の単語を抽出　最初の1文字は事前に削除しておく
    const minusFilterWords = filterWords.filter(word => word.startsWith("-")).map(word => word.slice(1));
    const sortByUpdateAt = (a:BookshelfBook, b:BookshelfBook) => b.updateAt - a.updateAt;
    let sortFunc = sortByUpdateAt;
    // TODO: ソートあれこれ
    if(true){
      sortFunc = sortByReadDate;
    }

    /////// フィルター
    return bookshelfBooks.value.filter(book => {
      // 評価によるフィルタリング
      return !useRateFilter || (filterCond.value.rate.min <= book.rate && book.rate <= filterCond.value.rate.max);
    }).filter(book => {
      // 日付でフィルタリング
      const dateTime = (new Date(book.readDate || "1970/01/01")).getTime();
      return !useDateFilter || (filterDateRangeMin <= dateTime && dateTime <= filterDateRangeMax);
    }).filter((book:BookshelfBook) => {
      // 既読のみチェックボックス入れている場合は、readDateなかったらダメ
      if(filterCond.value.isOnlyReadBook && !book.readDate){return false;}
      if(filterWords.length === 0){return true;}
      // 通常のワード検索
      const searchedText = [
        book.bookName,
        book.isbn,
        book.authorName,
        book.publisherName,
        book.tags,
        ...book.contents.map(content => content.authorName),
        ...book.contents.map(content => content.contentName)
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
const fetchTags = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/tag/fetch", {idToken});
  if(response){
    await setTags(response.data.tags);
  }
};
const setTags = async (tags: string[]) => {
  // キャッシュに保存
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.TAGS, tags, limitHours);
  tagOptions.value = tags;
};
const fetchBookshelfBooks = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/bookshelf/fetch", {idToken});
  if(response){
    await setBookshelfBooks(response.data.bookshelfBooks);
  }
};
const setBookshelfBooks = async (books:BookshelfBook[]) => {
  // キャッシュに保存
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.BOOKSHELF, books, limitHours);

  bookshelfBooks.value = books.map((book:BookshelfBook):BookshelfBook => {
    let dispCoverUrl = IMG_PLACEHOLDER_PATH;
    if(book.coverUrl){
      dispCoverUrl = book.coverUrl;
    }else if(book.isbn){
      dispCoverUrl = getCoverUrl(book.isbn) || IMG_PLACEHOLDER_PATH;
    }
    const retBook = {
      ...book,
      dispCoverUrl
    };
    return retBook;
  });

  // フィルターの日付の値いじる
  filterCond.value.readDate.min = filterCondReadDateLimit.value.min;
  filterCond.value.readDate.max = filterCondReadDateLimit.value.max;
};

const getBook = async (isbn:string) => {
  const trimedIsbn = isbn.trim();
  if(!util.isIsbn(trimedIsbn)){return;}

  const book = await bookApiUtil.getApiBook(trimedIsbn);
  // 本があったらフォームに設定
  if(book){
    await setBookFromApiBook(book);
  }else{
    // なかったらエラーダイアログ
    emitError("エラー", "APIからデータを取得できませんでした");
  }
};
const setBookFromApiBook = async (apiBook:bookApiUtil.ApiBook) => {
  if(apiBook){
    if(apiBook.isbn){
      bookDialog.value.form.isbn = apiBook.isbn;
    }
    if(apiBook.bookName){
      bookDialog.value.form.bookName = apiBook.bookName;
    }
    if(apiBook.authorName){
      bookDialog.value.form.authorName = apiBook.authorName;
    }
    if(apiBook.coverUrl){
      bookDialog.value.form.coverUrl = apiBook.coverUrl;
    }
    if(apiBook.publisherName){
      bookDialog.value.form.publisherName = apiBook.publisherName;
    }

  }

  // isbnない場合やcontentsすでにある場合は終わり
  if(!apiBook || !apiBook.isbn || !util.isIsbn(apiBook.isbn)){return;}
  if(bookDialog.value.form.contents.length > 0){return;}

  const shortStorys = await searchNdlShortStorys(apiBook.isbn);
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
      await setBookshelfBooks(response.data.bookshelfBooks);

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
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.TAGS_HISTORIES, [...tagsHistories.value], limitHours);
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
      await setBookshelfBooks(response.data.bookshelfBooks);
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
      await setBookshelfBooks(response.data.bookshelfBooks);
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
    const limitHours = 24;
    await cacheUtil.set(CACHE_KEY.TAGS_HISTORIES, [...tagsHistories.value], limitHours);
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
const setShortStorysToContents = (contents: Content[]) => {
  bookDialog.value.form.contents = contents;
};

const calcRate = (contents: Content[]) => {
  const calcedContents = contents.filter(content => content.rate > 0) // 点数つけたもののみで計算
  const avg = calcedContents.map(content => content.rate)
                .reduce((a, b) => {return a + b;}, 0) / calcedContents.length;
  bookDialog.value.form.rate = Math.round(avg);
};

const booksSearchDialog = ref({
  isShow: false,
  okFunction: setBookFromApiBook,
  searchWord: ""
});
const showBooksSearchDialog = (searchWord:string) => {
  if(!util.isExist(searchWord)){
    emitError("エラー", "書籍名を入力してください");
    return;
  }

  booksSearchDialog.value = {
    isShow: true,
    okFunction: setBookFromApiBook,
    searchWord
  };
};

const filterCondReadDateLimit = computed(() => {
  const dates = bookshelfBooks.value.filter((book) => { // readDateあるやつのみ対象
    return !!book.readDate;
  }).sort(sortByReadDate) // sort
  .map(book => book.readDate || "9999/12/31");

  return {
    max: dates[0] || "2100/12/31", // 降順なので先頭が最大
    min: dates[dates.length - 1] || "2000/01/01"
  }
});
const filterCond = ref({
  word: "",
  isOnlyReadBook: false,
  rate: {min: 1, max: 5},
  readDate: {min: "2000/01/01", max: "2100/12/31"}
});


const content2str = (contents:Content[]) => {
  if(contents.length === 0){return undefined;}
  return contents.map(content => `${content.authorName ? content.authorName : ""}「${content.contentName}」${"★".repeat(content.rate)}`)
                .join("\n");
};

type ChartData = {
  name: string,
  data: number[]
}
type Chart = {
  type: string,
  data: ChartData[],
  options: {
    chart: {
      id: string
    },
    xaxis: {
      categories: string[]
    }
  }
};
const chart:ComputedRef<Chart> = computed(() => {
  const books:BookshelfBook[] = filteredSortedBookshelfBooks.value.filter(b => b.readDate); // 読了日あるものだけ対象
  // 設定した条件を元にaxisとdataを作る
  let data:ChartData[] = [];
  let categories:string[] = [];
  let type = "bar";
  if(chartType.value === "barByMonth"){
    // 月別に分解して件数計算
    const months = util.removeDuplicateElements<string>(books.map(b => b.readDate || "").map(readDate => readDate.substring(0, 7)))
      .reverse(); // もともとreadDate降順になってるので、昇順に戻す
    categories = months;
    data = [{
      name: "",
      data: months.map(month => books.filter(b => b.readDate && b.readDate.startsWith(month)).length)
    }]
  }else if(chartType.value === "barByYear"){
    const months = util.removeDuplicateElements<string>(books.map(b => b.readDate || "").map(readDate => readDate.substring(0, 5)))
      .reverse(); // もともとreadDate降順になってるので、昇順に戻す
    categories = months;
    data = [{
      name: "",
      data: months.map(month => books.filter(b => b.readDate && b.readDate.startsWith(month)).length)
    }]
  }

  return {
    type,
    data,
    options: {
      chart: {
        id: "chart"
      },
      xaxis: {
        categories
      }
    }
  }

});
type ChartType = "barByMonth" | "barByYear";
const chartType:Ref<ChartType> = ref("barByMonth");
const chartTypeOptions = [
  {label: "", value: "barByMonth", slot: "barByMonth"},
  {label: "", value: "barByYear", slot: "barByYear"}
  //TODO: 平均評価を年別グラフに出す
];
const isShowChart = ref(false);
const chartHeight = ref(0);
const showChart = () => {
  // 高さ設定　resizeイベントにこれ設定するとリサイズで消えちゃうので、チャート表示時に1回だけ行う
  chartHeight.value = window.innerHeight - 52 - 50 - 50 - 50;
  isShowChart.value = true;
}


const {isAppLoaded} = toRefs(props);
onMounted(util.waitParentMount(isAppLoaded, async () => {
  // タグ履歴キャッシュ
  const cachedTagsHistories:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS_HISTORIES);
  if(cachedTagsHistories){
    tagsHistories.value = cachedTagsHistories;
  }

  // キャッシュからリスト取得してみる
  const cachedBookshelfBooks:BookshelfBook[] | null = await cacheUtil.get(CACHE_KEY.BOOKSHELF);
  if(cachedBookshelfBooks) {
    await setBookshelfBooks(cachedBookshelfBooks);
  }else{
    await fetchBookshelfBooks();
  }
  const cachedTags:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS);
  if(cachedTags) {
    await setTags(cachedTags);
  }else{
    fetchTags(); // tagOptions処理は完全に非同期で回す
  }
  

  console.log("mounted bookshelf");
}))
</script>

<template>
  <div>
    
    <q-page-container @click="isShowFilterCond = false">
      <q-page v-if="isShowChart">
        <div class="row">
          <div class="col-4 q-pa-sm">
            <q-btn-toggle
              v-model="chartType"
              :options="chartTypeOptions"
            >
              <template v-slot:barByMonth>
                <q-icon title="月グラフ" name="bar_chart" />
              </template>
              <template v-slot:barByYear>
                <q-icon title="年グラフ" name="leaderboard" />
              </template>
            </q-btn-toggle>
          </div>
          <div class="col-12 q-pa-sm">
            <vue-apex-charts
              :type="chart.type"
              :series="chart.data"
              :options="chart.options"
              width="100%"
              :height="chartHeight"
            ></vue-apex-charts>

          </div>
        </div>
      </q-page>
      <q-page v-else>
        
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
              :memo="content2str(book.contents)"
              hide-book-links
            >
              <template v-slot:header>
                  <div class="book-card-rate q-pl-sm">
                    {{ "★".repeat(book.rate) }}
                  </div>

              </template>
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
          <div ref="filtercond" v-if="isShowFilterCond" class="col-12 col-sm-8 col-md-6 col-lg-auto q-pa-sm">
            <div class="row filter-cond shadow-up-12 items-center" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-3 text-black'">
              <div class="col-2 q-pa-sm">
                読了日
              </div>
              <div class="col-5 q-pa-sm">
                <q-input
                  v-model="filterCond.readDate.min"
                  label="開始"
                  :rules="validationRules.contents.readDate"
                  mask="XXXX/XX/XX"
                  dense
                >
                  <template v-slot:append>
                    <q-btn 
                      round 
                      dense 
                      flat 
                      icon="event"
                    >
                      <q-popup-proxy v-model="bookDialog.showDatePopup">
                        <q-date v-model="filterCond.readDate.min" today-btn @update:model-value="bookDialog.showDatePopup = false" />
                      </q-popup-proxy>
                    </q-btn>
                  </template>
                </q-input>
              </div>
              <div class="col-5 q-pa-sm">
                <q-input
                  v-model="filterCond.readDate.max"
                  label="終了"
                  :rules="validationRules.contents.readDate"
                  mask="XXXX/XX/XX"
                  dense
                >
                  <template v-slot:append>
                    <q-btn 
                      round 
                      dense 
                      flat 
                      icon="event"
                    >
                      <q-popup-proxy v-model="bookDialog.showDatePopup">
                        <q-date v-model="filterCond.readDate.max" today-btn @update:model-value="bookDialog.showDatePopup = false" />
                      </q-popup-proxy>
                    </q-btn>
                  </template>
                </q-input>
              </div>

              <div class="col-2 q-pa-sm">
                評価
              </div>
              <div class="col-10 q-pa-sm">
                <q-range
                  v-model="filterCond.rate"
                  :min="1"
                  :max="5"
                  :step="1"
                  color="primary"
                  label-always
                  markers
                ></q-range>
              </div>
              <div class="col q-pa-sm">
                <c-input-tag
                  id="filter-tag"
                  v-model="filterCond.word"
                  label="検索"
                  dense
                  hint=",/スペースで区切られます"
                  :options="tagOptions"
                  @update:model-value="toTopPagenation"
                ></c-input-tag>
              </div>
              <div class="col-auto q-pa-sm">
                <q-toggle
                  v-model="filterCond.isOnlyReadBook"
                  label="既読のみ"
                  @update:model-value="toTopPagenation"
                ></q-toggle>
              </div>
            </div>
          </div>
        </c-transition>
        <div class="col-auto q-pa-xs">
          <c-round-btn
            ref="showfiltercondbtn"
            title="フィルター"  
            icon="search"
            color="secondary"
            :flat="false"
            @click="isShowFilterCond =!isShowFilterCond"
          ></c-round-btn>
        </div>
        <template v-if="isShowChart">
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="本棚表示"  
              icon="menu_book"
              color="secondary"
              :flat="false"
              @click="isShowChart = false"
            ></c-round-btn>
          </div>
        </template>
        <template v-else>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="グラフ表示"  
              icon="bar_chart"
              color="secondary"
              :flat="false"
              @click="showChart"
            ></c-round-btn>
          </div>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="新規作成"  
              icon="add"
              color="primary"
              :flat="false"
              @click="showCreateBookDialog"
            ></c-round-btn>
          </div>

        </template>
        
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
              @keydown.enter="showBooksSearchDialog(bookDialog.form.bookName)"
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
              @keydown.enter="getBook(bookDialog.form.isbn)"
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
              id="book-dialog-tag"
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
              size="3em"
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
          <div class="col-auto q-pa-xs">
            <q-btn 
              :disable="bookDialog.form.contents.length === 0"
              @click="calcRate(bookDialog.form.contents)" 
              flat 
              label="点数計算" 
              color="primary" 
            />
          </div>
          <div v-if="bookDialog.form.contents.length > 0" class="col-12 q-pa-xs">
            <q-card v-for="content, i in bookDialog.form.contents" class="q-my-sm" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-2'">
              <div class="row items-center">
                <div class="col-12 q-pa-xs">
                  <q-input
                    v-model="content.contentName"
                    dense
                    :label="labels.contents.contentName"
                    :rules="validationRules.contents.contentName"
                  ></q-input>
                </div>
                <div class="col q-pa-xs">
                  <q-input
                    v-model="content.authorName"
                    dense
                    :label="labels.contents.authorName"
                  ></q-input>
                </div>
                <div class="col-auto q-pa-xs">
                  <q-rating
                    v-model="content.rate"
                    max="5"
                    color="primary"
                  ></q-rating>
                </div>
                <div class="col-auto q-pa-xs">
                  <c-round-btn
                    title="削除"
                    icon="delete"
                    is-flat
                    color="primary"
                    dense
                    @click="bookDialog.form.contents.splice(i, 1)"
                  ></c-round-btn>
                </div>
              </div>
            </q-card>
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

.book-card-rate{
  height: 21px;
}
</style>