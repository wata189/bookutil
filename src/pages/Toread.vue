<script setup lang="ts">
import { onMounted, Ref } from '@vue/runtime-core';
import { computed, ref, toRefs, watch } from 'vue';
import { QForm} from "quasar";

import { onClickOutside } from '@vueuse/core'

import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import AxiosUtil from '@/modules/axiosUtil';
import googleBooksUtil from '@/modules/googleBooksUtil';
import ndlSearchUtil from '@/modules/ndlSearchUtil';
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  BOOKS: "cache-toreadBooks",
  TAGS: "cache-toreadTags",
  TAGS_HISTORIES: "cache-tagsHistories"
};

import cBooksSearchDialog from '@/components/c-books-search-dialog.vue';
import CRoundBtn from '@/components/c-round-btn.vue';
import CDialog from "@/components/c-dialog.vue";
import CInputTag from "@/components/c-input-tag.vue";
import CPagination from '@/components/c-pagination.vue';
import CBookCard from '@/components/c-book-card.vue';
import CBookLinks from "@/components/c-book-links.vue";
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

type Book = {
  documentId: string,
  bookName: string,
  isbn: string | null,
  coverUrl: string,
  authorName: string | null,
  publisherName: string | null,
  page: number | null,
  newBookCheckFlg: number,
  updateAt: number,
  tags: string[],
  isChecked: Ref<boolean>,
  dispCoverUrl: string,
  memo: string | null
};

const toreadBooks: Ref<Book[]> = ref([]);

const filterCond = ref({
  word: "",
  isOnlyNewBook: false
});
const isShowFilterCond = ref(false);
const filtercond = ref(null);
const showfiltercondbtn = ref(null);
onClickOutside(filtercond, () => {
  isShowFilterCond.value = false;
}, {ignore: [showfiltercondbtn]}); // filtercond表示ボタン押したときは対象外

const labels = {
  bookName: "書籍名",
  isbn: "ISBN",
  page: "ページ数",
  authorName: "著者名",
  publisherName: "出版社名",
  memo: "メモ",
  coverUrl: "書影URL",
  tags: "タグ",
  newBookCheckFlg: "図書館チェック",
};

const pagination = ref({
  number: 1,

  dispMax: 99
});
const paginationMax = computed(() => {
  return Math.ceil(filteredSortedToreadBooks.value.length / pagination.value.dispMax)
});
const isShowPagination = computed(() => {
  return filteredSortedToreadBooks.value.length > pagination.value.dispMax;
});
const toTopPagenation = () => {
  pagination.value.number = 1;
}

const filteredSortedToreadBooks = computed({
  get: () => {
    // 条件キャッシュ
    const filterWords = util.strToTag(filterCond.value.word);
    const plusFilterWords = filterWords.filter(word => !word.startsWith("-"));
    // マイナス検索の単語を抽出　最初の1文字は事前に削除しておく
    const minusFilterWords = filterWords.filter(word => word.startsWith("-")).map(word => word.slice(1));
    const filterIsOnlyNewBook = filterCond.value.isOnlyNewBook;

    /////// フィルター
    return toreadBooks.value.filter((book:Book) => {
      if(filterWords.length === 0){return true;}
      // 通常のワード検索
      const searchedText = [
        book.bookName,
        book.isbn,
        book.authorName,
        book.publisherName,
        book.tags,
        book.memo
      ].join("/") // /区切りで結合することで、予想外の検索ヒットを減らす
      .replace(/[ 　,]/g, ""); // 空白など削除

      // すべてのキーワードがひっかかったらtrue
      const hasPlusFilterWords = plusFilterWords.filter(word => searchedText.includes(word)).length === plusFilterWords.length;
      // マイナス検索　マイナス検索1件でも引っかかったらダメ
      const hasMinusFilterWords = minusFilterWords.filter(word => searchedText.includes(word)).length > 0;
      return hasPlusFilterWords && !hasMinusFilterWords;
    }).filter((book:Book) => {
      // 図書館チェックのみでのフィルター
      return !filterIsOnlyNewBook || book.newBookCheckFlg;
    }).sort((aBook, bBook) => bBook.updateAt - aBook.updateAt);

  },
  set: (value) => {
    toreadBooks.value = value
  }
})
const dispToreadBooks = computed({
  get: () => {
    /////// ページ件数で絞り込み
    return filteredSortedToreadBooks.value.slice(
      // start: ページ番号 - 1 * 表示件数
      (pagination.value.number - 1) * pagination.value.dispMax,
      // end: ページ番号*表示件数 or 最後
      Math.min(pagination.value.number * pagination.value.dispMax, toreadBooks.value.length)
    );
  },
  set: (value) => {
    toreadBooks.value = value
  }
});

const toreadTagOptions:Ref<string[]> = ref([]);

// toread画面初期化処理
const initToread = async () => {
  const accessToken = await authUtil.getCacheAccessToken();
  const response = await axiosUtil.get(`/toread/init?accessToken=${accessToken}`);
  if(response){
    await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
  }
};

const setInitInfo = async (books:Book[], tags: string[]) => {
  // キャッシュに保存
  const limitHours = 1;
  await cacheUtil.set(CACHE_KEY.BOOKS, books, limitHours);
  await cacheUtil.set(CACHE_KEY.TAGS, tags, limitHours);

  toreadBooks.value = books.map((book:Book):Book => {
    let dispCoverUrl = IMG_PLACEHOLDER_PATH;
    if(book.coverUrl){
      dispCoverUrl = book.coverUrl;
    }else if(book.isbn){
      dispCoverUrl = util.getOpenBdCoverUrl(book.isbn);
    }
    const retBook = {
      ...book,
      dispCoverUrl,
      isChecked: ref(false)
    };
    return retBook;
  });
  toreadTagOptions.value = tags;
};

const getBook = async (isbn:string) => {
  const trimedIsbn = isbn.trim();
  if(!util.isIsbn(trimedIsbn)){return;}

  const book = await googleBooksUtil.getBook(trimedIsbn);
  // 本があったらフォームに設定
  if(book){
    setBookFromBooksSearchDialog(book);
  }else{
    // なかったらエラーダイアログ
    emitError("エラー", "GoogleBooksからデータを取得できませんでした");
  }

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
    const response = await axiosUtil.post(`/toread/create`, params);
    if(response){
      // 画面情報再設定
      await setInitInfo(response.data.toreadBooks, response.data.toreadTags);

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
      // 画面情報再設定
      await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
      // タグ履歴更新
      if(bookDialog.value.form.tags){
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
const updateBook = async (bookId:string, updateAt:number, form:BookForm) => {
  const params = await createUpdateParams(bookId, updateAt, form);
  const response = await axiosUtil.post(`/toread/update`, params);
  return response;
};
const toggleNewBookCheckFlg = async (book:Book) => {
  const form:BookForm = {
    bookName: book.bookName,
    isbn: book.isbn || "",
    authorName: book.authorName || "",
    publisherName: book.publisherName || "",
    page: book.page,
    memo: book.memo || "",
    coverUrl: book.coverUrl || "",
    newBookCheckFlg: book.newBookCheckFlg,
    tags: book.tags.join("/")
  };
  const response = await updateBook(book.documentId, book.updateAt, form);
  if(response){
    // 画面情報再設定
    await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
  }
};

type BookForm = {
    bookName: string,
    isbn: string,
    authorName: string,
    publisherName: string,
    page: number | null,
    memo: string,
    coverUrl: string,
    newBookCheckFlg: number,
    tags: string,
}
type BookParams = {
    documentId: string | null,
    updateAt: number | null,
    user: string,
    bookName: string,
    isbn: string | null,
    page: number | null,
    authorName: string | null,
    publisherName: string | null,
    memo: string | null,
    coverUrl: string | null,
    newBookCheckFlg: number,
    tags: string[],
    accessToken: string,
    isExternalCooperation: boolean
}
const createCreateParams = async (form:BookForm) => {
  const params = await createBookParams(form);

  return params;
};
const createUpdateParams = async (documentId:string, updateAt:number, form:BookForm) => {
  const params = await createBookParams(form);
  params.documentId = documentId;
  params.updateAt = updateAt;
  return params;
};
const createBookParams = async (form:BookForm) => {
  const accessToken = await authUtil.getCacheAccessToken();
  const user = await authUtil.getUserInfo(accessToken);
  const email = user.email || "No User Data";
  const params:BookParams = {
    documentId: null,
    updateAt: null,
    user: email,

    // フォームのパラメータ
    bookName: form.bookName.trim(),
    isbn: form.isbn ? form.isbn.trim() : null,
    page: form.page || null,
    authorName: form.authorName ? form.authorName.trim() : null,
    publisherName: form.publisherName ? form.publisherName : null,
    memo: form.memo ? form.memo.trim() : null,
    newBookCheckFlg: form.newBookCheckFlg,
    tags: form.tags ? util.strToTag(form.tags.trim()) : [],
    coverUrl: form.coverUrl ? form.coverUrl.trim() : null,

    // アクセストークン
    accessToken: accessToken,
    // 外部連携フラグ
    isExternalCooperation: isExternalCooperation
  };
  
  return params;
};

type SimpleBook = {
  documentId: string,
  updateAt: number
}
type SimpleBooksParams = {
  books: SimpleBook[];
  tags?: string[];
  user: string;
  accessToken: string;
}
const selectedBooks = computed(() => {
  return toreadBooks.value.filter(book => book.isChecked);
})

const deleteBooks = async (books:Book[]) => {
  const simpleBooks:SimpleBook[] = books.map(book => {
    return {documentId:book.documentId, updateAt:book.updateAt}
  });
  // 0件選択の場合はエラーダイアログ
  if(books.length === 0){
    emitError("エラー", "削除する本を選択してください");
    return;
  }
  // 確認ダイアログ
  const dispBooks = books.map(book => `・${book.bookName}`);
  let confirmDialogMsg = `以下の本を削除します

${dispBooks.join("\n")}`;

  emits(EMIT_NAME_CONFIRM, "確認", confirmDialogMsg, true, async () => {
    const accessToken = await authUtil.getCacheAccessToken()
    const user = await authUtil.getUserInfo(accessToken);
    const params:SimpleBooksParams = {
      books: simpleBooks,
      user: user.email || "No User Data",
      accessToken: accessToken
    };
    const response = await axiosUtil.post(`/toread/delete`, params);
    if(response){
      // 画面情報再設定
      await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
    }
  });

};

type BookDialog = {
  isShow: boolean,
  documentId: string,
  updateAt: number | null,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  form: BookForm
}
const bookDialog:Ref<BookDialog> = ref({
  isShow: false,
  documentId: "",
  updateAt: null,
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  form: {
    bookName: "",
    isbn: "",
    authorName: "",
    publisherName: "",
    page: null,
    memo: "",
    coverUrl: "",
    newBookCheckFlg: 0,
    tags: ""
  }
});
const showNewBookDialog = () => {
  bookDialog.value.documentId = "";
  bookDialog.value.headerText = "新規作成";
  bookDialog.value.okLabel = "新規作成";
  bookDialog.value.okFunction = createBook;
  bookDialog.value.form = {
    bookName: "",
    isbn: "",
    authorName: "",
    publisherName: "",
    page: null,
    memo: "",
    coverUrl: "",
    newBookCheckFlg: 0,
    tags: ""
  };
  bookDialog.value.isShow = true;
};

// 編集ダイアログ表示
const showEditBookDialog = (book:Book) => {
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
    page: book.page,
    memo: book.memo || "",
    coverUrl: book.coverUrl,
    newBookCheckFlg: book.newBookCheckFlg,
    tags: book.tags.join("/")
  };
  bookDialog.value.isShow = true;

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

// よみたいタグ取得→セット
const setWantTag = async () => {
  const accessToken = await authUtil.getCacheAccessToken()
  const user = await authUtil.getUserInfo(accessToken);
  const params = {
    isbn: bookDialog.value.form.isbn,
    user: user.email || "No User Data",
    accessToken: accessToken,
  };
  const response = await axiosUtil.post(`/toread/tag/want/get`, params);
  if(response){
    const libraryTag:string | null = response.data.libraryTag;
    if(libraryTag){
      const tags = util.strToTag(bookDialog.value.form.tags);
      // 図書館タグあったら事前に排除
      const filteredTags = tags.filter(tag => !tag.includes("図書館"));
      filteredTags.push(libraryTag);
      // よみたいタグなかったら追加
      if(!filteredTags.includes("よみたい")){
        filteredTags.push("よみたい");
      }
      bookDialog.value.form.tags = filteredTags.join("/");
    }
  }
};

type AddTagForm = {
  tags: string
};
type AddTagDialog = {
  isShow: boolean,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  form: AddTagForm
};
const addTagDialog:Ref<AddTagDialog> = ref({
  isShow: false,
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  form: {
    tags: ""
  }
});
const showAddTagDialog = () => {
  const books = selectedBooks.value;
  // 0件選択の場合はエラーダイアログ
  if(books.length === 0){
    emitError("エラー", "タグを設定する本を選択してください");
    return;
  }

  addTagDialog.value = {
    isShow: true,
    headerText: "一括タグ追加",
    okLabel: "タグ追加",
    okFunction: addTagsFromDialogForm,
    form: {
      tags: ""
    }
  }
};
const addTagValidationRules = {
  tags: [validationUtil.isExist(labels.tags)]
};
const addTagDialogForm:Ref<QForm | undefined> = ref();
const addTagsFromDialogForm = () => {
  // フォームのバリデーション処理
  if(!addTagDialogForm.value){return;}
  addTagDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // formを送る
    const books = selectedBooks.value;
    const tags = util.strToTag(addTagDialog.value.form.tags)

    // ダイアログ消す
    addTagDialog.value.isShow = false;
    const response = await addTags(books, tags);
    if(response){
      // 画面情報再設定
      await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
    }
  });
};
const addWantTag = async (book:Book) => {
  const simpleBook:SimpleBook = {documentId:book.documentId, updateAt:book.updateAt};
  const accessToken = await authUtil.getCacheAccessToken()
  const user = await authUtil.getUserInfo(accessToken);
  const params = {
    book: simpleBook,
    user: user.email || "No User Data",
    accessToken: accessToken,
  };
  const response = await axiosUtil.post(`/toread/tag/want/add`, params);
  if(response){
    // 画面情報再設定
    await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
  }
};
const addMultiTag = async () => {
  if(!util.isExist(addTagDialog.value.form.tags)){
    emitError("エラー", "タグを入力してください");
    return;
  }

  // ダイアログ消す
  addTagDialog.value.isShow = false;
  const response = await addTags(selectedBooks.value, util.strToTag(addTagDialog.value.form.tags))
  if(response){
    // 画面情報再設定
    await setInitInfo(response.data.toreadBooks, response.data.toreadTags);
  }
};
const addTags = async (books:Book[], tags:string[]) => {
  const params = await createAddTagParams(books, tags);
  return await axiosUtil.post(`/toread/tag/add`, params);
};

const createAddTagParams = async (books:Book[], tags:string[]):Promise<SimpleBooksParams> => {
  const simpleBooks:SimpleBook[] = books.map(book => {
    return {documentId:book.documentId, updateAt:book.updateAt}
  });

  const accessToken = await authUtil.getCacheAccessToken()
  const user = await authUtil.getUserInfo(accessToken);
  return {
    books: simpleBooks,
    user: user.email || "No User Data",
    accessToken: accessToken,
    tags: tags
  };
};

const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  page: [validationUtil.isNumber(labels.page)],
  coverUrl: [validationUtil.isUrl(labels.coverUrl)]
};

const searchShortStorys = async (book:Book) => {
  if(!book.isbn || !util.isIsbn(book.isbn)){return;}

  const shortStorys = await ndlSearchUtil.searchShortStorys(book.isbn);

  if(shortStorys.length === 0){
    emitError("エラー", "書籍内容がありません");
    return;
  }

  // shortStorysをコピー
  const copyText = shortStorys.map(shortStory => `${shortStory.author || ""}「${shortStory.title}」`).join("\n");
  navigator.clipboard.writeText(copyText);
  // ブクログへのリンクを表示するダイアログ表示
  msgDialog.value = {
    isShow: true,
    headerText: "書籍内容をコピーしました",
    okLabel: "ブクログを表示",
    okFunction: () => {
      const url = "https://booklog.jp/item/1/" + book.isbn;
      util.openPageAsNewTab(url);
    },
    content: copyText
  }
};


type MsgDialog = {
  isShow: boolean,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  content: string
};
const msgDialog:Ref<MsgDialog> = ref({
  isShow: false,
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  content: ""
});

// 外部連携フラグ
let isExternalCooperation = false;

const booksSearchDialog = ref({
  isShow: false,
  okFunction: (book:GoogleBook) => {console.log(book)},
  searchWord: ""
});
const showBooksSearchDialog = (searchWord:string) => {
  if(!util.isExist(searchWord)){
    emitError("エラー", "書籍名を入力してください");
    return;
  }

  booksSearchDialog.value = {
    isShow: true,
    okFunction: setBookFromBooksSearchDialog,
    searchWord
  };
};
type GoogleBook = {
  bookName: string | undefined,
  isbn: string | undefined,
  authorName: string,
  page: number | undefined,
  coverUrl: string | undefined,
  description: string | undefined
};
const setBookFromBooksSearchDialog = (googleBook:GoogleBook) => {
  if(googleBook.isbn){
    bookDialog.value.form.isbn = googleBook.isbn;
  }
  if(googleBook.bookName){
    bookDialog.value.form.bookName = googleBook.bookName;
  }
  if(googleBook.authorName){
    bookDialog.value.form.authorName = googleBook.authorName;
  }
  if(googleBook.page){
    bookDialog.value.form.page = googleBook.page;
  }
  if(googleBook.coverUrl){
    bookDialog.value.form.coverUrl = googleBook.coverUrl;
  }
  if(googleBook.description){
    bookDialog.value.form.memo = googleBook.description;
  }
};

// Appコンポーネントのロードが終わった後、子コンポーネントの処理
// 初回ロードと画面遷移の療法に対応できるようにする
const {isAppLoaded} = toRefs(props);
const init = async () => {
  if(!isAppLoaded.value){return;}

  // パラメータにisbnがあったらいきなりダイアログ表示
  const urlParams = (new URL(window.location.href)).searchParams;
  const urlParamIsbn = urlParams.get('isbn');
  if(urlParamIsbn){

    if(util.isIsbn(urlParamIsbn)){
      isExternalCooperation = true;
      showNewBookDialog();

      bookDialog.value.form.isbn = urlParamIsbn;
      await getBook(urlParamIsbn);

      const urlParamBookName = urlParams.get("bookName");
      const urlParamAuthorName = urlParams.get("authorName");
      const urlParamPublisherName = urlParams.get("publisherName");
      const urlParamNewBookCheckFlg = urlParams.get("newBookCheckFlg");
      if(urlParamBookName) bookDialog.value.form.bookName = urlParamBookName;
      if(urlParamAuthorName) bookDialog.value.form.authorName = urlParamAuthorName;
      if(urlParamPublisherName) bookDialog.value.form.publisherName = urlParamPublisherName;
      if(urlParamNewBookCheckFlg) bookDialog.value.form.newBookCheckFlg = Number(urlParamNewBookCheckFlg);
    }else{
      // ISBNが取得できなかったことをアラートで表示
      emitError("エラー", "ISBNを取得できませんでした");
    }
  }
  
  const urlParamWord = urlParams.get("filterCondWord");
  if(urlParamWord){
    filterCond.value.word = urlParamWord;
  }

  // キャッシュからリスト取得してみる
  const cachedToreadBooks:Book[] | null = await cacheUtil.get(CACHE_KEY.BOOKS);
  const cachedToreadTags:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS);
  if(cachedToreadBooks && cachedToreadTags) {
    await setInitInfo(cachedToreadBooks, cachedToreadTags);
  }else{
    await initToread();
  }
  
  // タグ履歴キャッシュ
  const cachedTagsHistories:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS_HISTORIES);
  if(cachedTagsHistories){
    tagsHistories.value = cachedTagsHistories;
  }
    
  // 初回ロード時→watchの中でinit呼ばれているのでunwatchして2回め動かないようにする
  // VueRouterで遷移時→onMountedの中でinit呼ばれて、未使用のwatchをunwatch
  unwatch();

  console.log("mounted toread");
};
const unwatch = watch(isAppLoaded, init);
onMounted(init);
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
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
          <div class="col-aut q-pa-sm text-primary">{{ filteredSortedToreadBooks.length }}冊</div>
          <q-space></q-space>
        </div>
        <div class="row justify-center q-pa-md">
          <div v-for="book in dispToreadBooks" class="col book-cover-wrapper q-my-sm">
            <c-book-card :book="book">
              <template v-slot:header>
                <q-checkbox
                  v-model="book.isChecked"
                  dense
                >
                </q-checkbox>
              </template>
              <template v-slot:menu-footer>
                <div class="row">
                  <div class="col-auto">
                    <q-toggle
                      v-model="book.newBookCheckFlg"
                      :true-value="1"
                      :false-value="0"
                      color="primary"
                      @update:model-value="toggleNewBookCheckFlg(book)"
                    >
                      図書館チェック
                    </q-toggle>
                  </div>
                </div>
                <div class="row">
                  <div class="col-auto">
                    <c-round-btn
                      title="削除"
                      icon="delete"
                      color="negative"
                      @click="deleteBooks([book])"
                    ></c-round-btn>
                  </div>
                  <div class="col-auto">
                    <c-round-btn
                      v-if="book.isbn"
                      title="よみたい"
                      icon="star_border"
                      color="secondary"
                      @click="addWantTag(book)"
                    ></c-round-btn>
                  </div>
                  <div class="col-auto">
                    <c-round-btn
                      v-if="book.isbn"
                      title="書籍内容検索"
                      icon="menu_book"
                      color="secondary"
                      @click="searchShortStorys(book)"
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
          <div class="col-aut q-pa-sm text-primary">{{ filteredSortedToreadBooks.length }}冊</div>
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
          <div ref="filtercond" v-if="isShowFilterCond" class="col-12 col-sm-auto q-pa-sm">
            <div class="row filter-cond shadow-up-12" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-3 text-black'">
              <div class="col q-pa-sm">
                <c-input-tag
                  v-model="filterCond.word"
                  label="検索"
                  dense
                  hint=",/スペースで区切られます"
                  :options="toreadTagOptions"
                  @update:model-value="toTopPagenation"
                ></c-input-tag>
              </div>
              <div class="col-auto q-pa-sm">
                <q-toggle
                  v-model="filterCond.isOnlyNewBook"
                  label="新刊のみ"
                  @update:model-value="toTopPagenation"
                ></q-toggle>
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
        <div class="col-auto q-pa-xs">
          <c-round-btn
            :disabled="selectedBooks.length === 0"
            title="一括削除"  
            icon="delete"
            color="negative"
            :flat="false"
            @click="deleteBooks(selectedBooks)"
          ></c-round-btn>
        </div>
        <div class="col-auto q-pa-xs">
          <c-round-btn
            :disabled="selectedBooks.length === 0"
            title="一括タグ"  
            icon="local_offer"
            color="secondary"
            :flat="false"
            @click="showAddTagDialog"
          ></c-round-btn>
        </div>
        <div class="col-auto q-pa-xs">
          <c-round-btn
            title="新規作成"  
            icon="add"
            color="primary"
            :flat="false"
            @click="showNewBookDialog"
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
              mask="#########X###"
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
          
          <div class="col-12">
            <c-book-links
              :bookName="bookDialog.form.bookName || ''"
              :author-name="bookDialog.form.authorName"
              :isbn="bookDialog.form.isbn"
              :other-link="null"
            ></c-book-links>
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
              :options="toreadTagOptions"
            ></c-input-tag>
          </div>
        </div>

        <div class="row reverse">
          <div class="col-auto q-pa-xs">
            <q-btn 
              :disable="tagsHistories.length <= 0" 
              @click="setLatestTagsFromTagsHistories" 
              flat 
              label="タグ履歴" 
              color="primary" 
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn 
              size="md"
              :disable="!(util.isExist(bookDialog.form.isbn) && util.isIsbn(bookDialog.form.isbn))" 
              @click="setWantTag" 
              flat 
              label="よみたい" 
              color="primary"
            />
          </div>
          <q-space></q-space>
          <div class="col-12 col-sm-auto q-pa-xs">
            <q-toggle
              v-model="bookDialog.form.newBookCheckFlg"
              size="md"
              :true-value="1"
              :false-value="0"
              :label="labels.newBookCheckFlg"
            ></q-toggle>
          </div>
          
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="bookDialog.form.memo"
              :label="labels.memo"
              type="textarea"
              rows="3"
            ></q-input>
          </div>
        </div>
        
        
      </q-form>
    </c-dialog>

    <!-- 書籍検索ダイアログ -->
    <c-books-search-dialog
      v-model="booksSearchDialog.isShow"
      :search-word="booksSearchDialog.searchWord"
      @ok="booksSearchDialog.okFunction"
      @error="emitError('エラー', 'GoogleBooksからデータを取得できませんでした')"
    ></c-books-search-dialog>

    <!-- 一括タグダイアログ -->
    <c-dialog
      v-model="addTagDialog.isShow"
      :header-text="addTagDialog.headerText"
      :okLabel="addTagDialog.okLabel"
      @ok="addMultiTag"
    >
      <q-form ref="addTagDialogForm">
        <c-input-tag
          v-model="addTagDialog.form.tags"
          :label="labels.tags"
          hint=",/スペースで区切られます"
          :options="toreadTagOptions"
          :rules="addTagValidationRules.tags"
          class="set-tag-dialog-form-tags"
        ></c-input-tag>
      </q-form>
    </c-dialog>
    
    <!-- 汎用ダイアログ -->
    <c-dialog
      v-model="msgDialog.isShow"
      :header-text="msgDialog.headerText"
      :okLabel="msgDialog.okLabel"
      @ok="msgDialog.okFunction"
    >
      {{ msgDialog.content }}
    </c-dialog>
  </q-layout>
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
</style>