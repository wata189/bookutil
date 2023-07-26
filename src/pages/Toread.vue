<script setup lang="ts">
import { onMounted, Ref } from '@vue/runtime-core';
import { computed, ref } from 'vue';
import { QForm} from "quasar";

import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import openBdUtil from "@/modules/openBdUtil";
import AxiosUtil from '@/modules/axiosUtil';

import cBooksSearchDialog from '@/components/c-books-search-dialog.vue';
import CRoundBtn from '@/components/c-round-btn.vue';
import CDialog from "@/components/c-dialog.vue";
import CInputTag from "@/components/c-input-tag.vue";
import CPagination from '@/components/c-pagination.vue';

// axiosUtilのインスタンス作成
const EMIT_NAME_ERROR = "show-error-dialog";
const EMIT_NAME_CONFIRM = "show-confirm-dialog";
const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);

const emitError = (statusText:string, msg:string, status?:number) => {
  emits(EMIT_NAME_ERROR, status, statusText, msg);
};

type Book = {
  id: string,
  bookName: string,
  isbn: string | null,
  coverUrl: string,
  authorName: string | null,
  publisherName: string | null,
  page: number | null,
  otherUrl: string | null,
  newBookCheckFlg: number,
  updateAt: number,
  tags: string,
  isChecked: Ref<boolean>
};

const toreadBooks: Ref<Book[]> = ref([]);

const filterCond = ref({
  word: "",
  tags: "",
  isOnlyNewBook: false
});
const isShowFilterCond = ref(!util.isSmartPhone());

const SORT_KEY = {
  ID: "更新日",
  PAGE: "ページ数",
  WANT: "よみたい度"
};
const sortKeyOptions = Object.values(SORT_KEY)
const sortCond = ref({
  isDesc: true,
  key: SORT_KEY.ID
});
const isDescIcon = computed(() => {
  return sortCond.value.isDesc ? "keyboard_double_arrow_down" : "keyboard_double_arrow_up"
});
const isDescTitle = computed(() => {
  return sortCond.value.isDesc ? "昇順にする" : "降順にする"
});
// ソートキー変更時の降順昇順変更
// 追加日→Desc、ページ数→Asc、よみたい順→desc
const onChangeSortCondKey = (value:string) => {
  if(value === SORT_KEY.ID){
    sortCond.value.isDesc = true;
  }else if(value === SORT_KEY.PAGE){
    sortCond.value.isDesc = false;
  }else{
    sortCond.value.isDesc = true
  }
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

const pagination = ref({
  number: 1,

  dispMax: 50
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
    const filterWord = filterCond.value.word;
    const filterTags = util.strToTag(filterCond.value.tags);
    const filterIsOnlyNewBook = filterCond.value.isOnlyNewBook;
    const sortKey = sortCond.value.key;
    const isDesc = sortCond.value.isDesc;

    /////// フィルター
    return toreadBooks.value.filter((book:Book) => {
      // 検索ワードでの検索
      const searchedText = [
        book.bookName,
        book.isbn,
        book.authorName,
        book.publisherName,
        book.tags
      ].join("/") // /区切りで結合することで、予想外の検索ヒットを減らす
      .replace(/[ 　,]/g, ""); // 空白など削除
      return searchedText.includes(filterWord);
    }).filter((book:Book) => {
      // タグでの検索
      const bookTags = util.strToTag(book.tags);
      return filterTags
            .filter(filterTag => bookTags.includes(filterTag))
            .length === filterTags.length;
    }).filter((book:Book) => {
      // 新刊のみでのフィルター
      return !filterIsOnlyNewBook || book.newBookCheckFlg;
    }).sort((aBook:Book, bBook:Book) => {
      if(sortKey === SORT_KEY.ID){
        // ID(追加順)でソート
        return isDesc ? bBook.updateAt - aBook.updateAt : aBook.updateAt - bBook.updateAt
      }else if(sortKey === SORT_KEY.PAGE){
        // ページ数順でソート
        if(isDesc){
          const aPage = aBook.page || 0;
          const bPage = bBook.page || 0;
          return bPage - aPage;
        }else{
          const aPage = aBook.page || Infinity;
          const bPage = bBook.page || Infinity;
          return aPage - bPage;
        }
      }else{
        // よみたい順でソート よみたい順の場合はisDesc無視ですべて降順
        return getWantPoint(bBook.tags) - getWantPoint(aBook.tags);
      }
    });

  },
  set: (value) => {
    toreadBooks.value = value
  }
})
const dispToreadBooks = computed({
  get: () => {
    /////// ソート
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

// よみたい度算出
// すごくよみたい→2ポイント　よみたい→1ポイント
const getWantPoint = (tagsStr:string):number => {
  const tags = util.strToTag(tagsStr);

  let wantPoint = 0;
  if(tags.includes("すごくよみたい")){
    wantPoint = 2;
  }else if(tags.includes("よみたい")){
    wantPoint = 1;
  }
  return wantPoint;
};

const toreadTagOptions:Ref<string[]> = ref([]);

// toread画面初期化処理
const initToread = async () => {
  const accessToken = authUtil.getLocalStorageAccessToken();
  const response = await axiosUtil.get(`/toread/init?access_token=${accessToken}`);
  if(response){
    setInitInfo(response.data.toreadRows, response.data.toreadTags);
  }
};

const setInitInfo = (toreadRows:Book[], toreadTags: string[]) => {
  toreadBooks.value = toreadRows.map((book:Book):Book => {
    const retBook = {
      ...book,
      isChecked: ref(false)
    };
    return retBook;
  });
  toreadTagOptions.value = toreadTags;
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
    searchUrl = link.searchUrl.isbn.replace(SEARCH_PLACEHOLDER, isbn);
  }else{
    searchUrl = link.searchUrl.bookName.replace(SEARCH_PLACEHOLDER, bookName);
  }

  util.openPageAsNewTab(searchUrl);
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
  }else{
    // なかったらエラーダイアログ
    emitError("エラー", "OpenBDからデータを取得できませんでした");
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
      // 画面情報再設定
      setInitInfo(response.data.toreadRows, response.data.toreadTags);
      // ダイアログ消す
      bookDialog.value.isShow = false;
    }
  });
};
const editBook = () => {
  // フォームのバリデーション処理
  if(!bookDialogForm.value){return;}
  bookDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // formを送る
    const updateAt = bookDialog.value.updateAt || 0;
    const response = await updateBook(bookDialog.value.bookId, updateAt, bookDialog.value.form);
    if(response){
      // 画面情報再設定
      setInitInfo(response.data.toreadRows, response.data.toreadTags);
      // ダイアログ消す
      bookDialog.value.isShow = false;
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
    otherUrl: book.otherUrl || "",
    newBookCheckFlg: book.newBookCheckFlg,
    tags: book.tags
  };
  const response = await updateBook(book.id, book.updateAt, form);
  if(response){
    // 画面情報再設定
    setInitInfo(response.data.toreadRows, response.data.toreadTags);
  }
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
type BookParams = {
    id: string | null;
    update_at: number | null;
    user: string;
    book_name: string;
    isbn: string | null;
    page: number | null;
    author_name: string | null;
    publisher_name: string | null;
    other_url: string | null;
    new_book_check_flg: number;
    tags: string;
    access_token: string;
    is_external_cooperation: boolean;
}
const createCreateParams = async (form:BookForm) => {
  const params = await createBookParams(form);

  return params;
};
const createUpdateParams = async (bookId:string, updateAt:number, form:BookForm) => {
  const params = await createBookParams(form);
  params.id = bookId;
  params.update_at = updateAt;
  return params;
};
const createBookParams = async (form:BookForm) => {
  const accessToken = authUtil.getLocalStorageAccessToken();
  const user = await authUtil.getUserInfo(accessToken);
  const email = user.email || "No User Data";
  const params:BookParams = {
    id: null,
    update_at: null,
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
    access_token: accessToken,
    // 外部連携フラグ
    is_external_cooperation: isExternalCooperation
  };
  
  return params;
};

type SimpleBook = {
  id: string,
  update_at: number
}
type BooksParams = {
  books: SimpleBook[];
  tags?: string;
  user: string;
  access_token: string;
}
const selectedBooks = computed(() => {
  return toreadBooks.value.filter(book => book.isChecked);
})

const deleteBooks = async () => {
  const books = selectedBooks.value;
  const simpleBooks:SimpleBook[] = books.map(book => {
    return {id:book.id, update_at:book.updateAt}
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
    const accessToken = authUtil.getLocalStorageAccessToken()
    const user = await authUtil.getUserInfo(accessToken);
    const params:BooksParams = {
      books: simpleBooks,
      user: user.email || "No User Data",
      access_token: accessToken
    };
    const response = await axiosUtil.post(`/toread/delete`, params);
    if(response){
      // 画面情報再設定
      setInitInfo(response.data.toreadRows, response.data.toreadTags);
    }
  });

};

type BookDialog = {
  isShow: boolean,
  bookId: string,
  updateAt: number | null,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  form: BookForm
}
const bookDialog:Ref<BookDialog> = ref({
  isShow: false,
  bookId: "",
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
    otherUrl: "",
    newBookCheckFlg: 0,
    tags: ""
  }
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

// 編集ダイアログ表示
const showEditBookDialog = (book:Book) => {
  bookDialog.value.bookId = book.id;
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
    otherUrl: book.otherUrl || "",
    newBookCheckFlg: book.newBookCheckFlg,
    tags: book.tags
  };
  bookDialog.value.isShow = true;

};

type AddTagForm = {
  tags: string
}
type AddTagDialog = {
  isShow: boolean,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  form: AddTagForm
}
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
    const tags = addTagDialog.value.form.tags

    const response = await addTags(books, tags);
    // const params = await createAddTagParams(addTagDialog.value.form);
    // const response = await axiosUtil.post(`/toread/tag/add`, params);
    if(response){
      // 画面情報再設定
      setInitInfo(response.data.toreadRows, response.data.toreadTags);
      // ダイアログ消す
      addTagDialog.value.isShow = false;
    }
  });
};
const addWantTag = (book:Book, tag:string) => {
  // TODO: カーリル経由で図書館タグ取得
  const libraryTag = "";

  const tags = [tag, libraryTag].join("/")
  addTag(book, tags);
};
const addMultiTag = async () => {
  if(!util.isExist(addTagDialog.value.form.tags)){
    emitError("エラー", "タグを入力してください");
    return;
  }

  const response = await addTags(selectedBooks.value, addTagDialog.value.form.tags)
  if(response){
    // 画面情報再設定
    setInitInfo(response.data.toreadRows, response.data.toreadTags);
    // ダイアログ消す
    addTagDialog.value.isShow = false;
  }
};
const addTag = async (book:Book, tags:string) => {
  const response = await addTags([book], tags);
  if(response){
    // 画面情報再設定
    setInitInfo(response.data.toreadRows, response.data.toreadTags);
  }
};

const addTags = async (books:Book[], tags:string) => {
  const params = await createAddTagParams(books, tags);
  return await axiosUtil.post(`/toread/tag/add`, params);
};

const createAddTagParams = async (books:Book[], tags:string):Promise<BooksParams> => {
  const simpleBooks:SimpleBook[] = books.map(book => {
    return {id:book.id, update_at:book.updateAt}
  });

  const accessToken = authUtil.getLocalStorageAccessToken()
  const user = await authUtil.getUserInfo(accessToken);
  return {
    books: simpleBooks,
    user: user.email || "No User Data",
    access_token: accessToken,
    tags: tags
  };
};

const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  page: [validationUtil.isNumber(labels.page)],
  otherUrl: [validationUtil.isUrl(labels.otherUrl)]
};
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
    okFunction: setIsbnFromBooksSearchDialog,
    searchWord
  };
};
type GoogleBook = {
  bookName: string,
  isbn: string,
  authorName: string
};
const setIsbnFromBooksSearchDialog = async (googleBook:GoogleBook) => {
  bookDialog.value.form.isbn = googleBook.isbn;
  bookDialog.value.form.bookName = googleBook.bookName;
  bookDialog.value.form.authorName = googleBook.authorName;

  if(bookDialog.value.form.isbn){
    await getBookInfo(bookDialog.value.form.isbn);
  }
};

onMounted(async () => {
  // パラメータにisbnがあったらいきなりダイアログ表示
  const urlParams = (new URL(window.location.href)).searchParams;
  const urlParamIsbn = urlParams.get('isbn');
  if(urlParamIsbn){

    if(util.isIsbn(urlParamIsbn)){
      isExternalCooperation = true;
      showNewBookDialog();

      bookDialog.value.form.isbn = urlParamIsbn;
      await getBookInfo(urlParamIsbn);
    }else{
      // ISBNが取得できなかったことをアラートで表示
      emitError("エラー", "ISBNを取得できませんでした");
    }
  }
  
  const urlParamTags = urlParams.get("filterCondTags");
  if(urlParamTags){
    filterCond.value.tags = urlParamTags
  }

  await initToread();
  
});
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
      <q-page>
        <div class="row lt-md">
          <q-space></q-space>
          <div class="q-pa-sm">
            <c-pagination
              v-if="isShowPagination"
              v-model="pagination.number"
              :max="paginationMax"
            ></c-pagination>
          </div>
          <q-space></q-space>
        </div>
        <div class="row justify-center q-pa-md">
          <div v-for="book in dispToreadBooks" class="col book-cover-wrapper q-my-sm">
            <q-card class="q-pb-sm q-mx-sm" :flat="!util.isDarkMode()" :class="util.isDarkMode() ? 'bg-dark' : 'bg-transparent' " :title="book.bookName">
              <q-checkbox
                v-model="book.isChecked"
                dense
              >
              </q-checkbox>
              <q-img
                :src="book.coverUrl"
                class="book-img book-card-item"
                fit="contain"
              ></q-img>
              <div class="ellipsis q-px-sm book-card-item">
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
                  <q-chip v-for="tag in util.strToTag(book.tags)" dense color="teal" text-color="white">{{ tag }}</q-chip>
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
                  @click="util.openPageAsNewTab(book.otherUrl)"
                >
                </q-btn>
                <div class="row">
                  <div class="col-auto">
                    <q-toggle
                      v-model="book.newBookCheckFlg"
                      :true-value="1"
                      :false-value="0"
                      color="teal"
                      @update:model-value="toggleNewBookCheckFlg(book)"
                    >
                      新刊チェック
                    </q-toggle>
                  </div>
                </div>
                <div class="row">
                  <div class="col-auto">
                    <c-round-btn
                      v-if="!util.strToTag(book.tags).includes('よみたい')"
                      title="よみたい"
                      icon="star_border"
                      color="primary"
                      @click="addWantTag(book, 'よみたい')"
                    ></c-round-btn>
                    <c-round-btn
                      v-if="!util.strToTag(book.tags).includes('すごくよみたい')"
                      title="すごくよみたい"
                      icon="hotel_class"
                      color="primary"
                      @click="addWantTag(book, 'よみたい/すごくよみたい')"
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
              </q-menu>
            </q-card>
          </div>
        </div>
        <div class="row lt-md">
          <q-space></q-space>
          <div class="q-pa-sm">
            <c-pagination
              v-if="isShowPagination"
              v-model="pagination.number"
              :max="paginationMax"
            ></c-pagination>
          </div>
          <q-space></q-space>
        </div>
      </q-page>
    </q-page-container>
    <q-footer elevated :class="util.isDarkMode() ? 'bg-dark' : 'bg-white text-black'">
      <q-expansion-item
        expand-icon-toggle
        expand-separator
        v-model="isShowFilterCond"
      >
        <template v-slot:header>
          <q-item-section>
            <div class="row">
              <div class="col-auto q-pa-sm">
                <q-select 
                  label="ソート"
                  v-model="sortCond.key" 
                  dense 
                  :options="sortKeyOptions"
                  class="select-sort-key"
                  @update:model-value="onChangeSortCondKey"
                >
                  <template v-slot:before>

                    <c-round-btn
                      :title="isDescTitle"  
                      :icon="isDescIcon"
                      dense
                      @click="sortCond.isDesc = !sortCond.isDesc"
                    ></c-round-btn>
                  </template>
                </q-select>
              </div>
              <div class="col-auto q-pa-sm row">
                <c-round-btn
                  title="一括削除"  
                  icon="delete"
                  color="negative"
                  dense
                  @click="deleteBooks"
                ></c-round-btn>
                <c-round-btn
                  title="一括タグ"  
                  icon="local_offer"
                  color="secondary"
                  dense
                  @click="showAddTagDialog"
                ></c-round-btn>
                <c-round-btn
                  title="新規作成"  
                  icon="add"
                  color="primary"
                  dense
                  @click="showNewBookDialog"
                ></c-round-btn>
              </div>
              <q-space></q-space>
              <c-pagination
                v-if="isShowPagination"
                v-model="pagination.number"
                :max="paginationMax"
                class="gt-sm"
              ></c-pagination>
            </div>
          </q-item-section>
        </template>
        <q-card>

          <q-separator inset></q-separator>
          <div class="row">
            <div class="col-12 col-sm-4 q-pa-sm">
              <q-input 
                dense 
                v-model="filterCond.word" 
                label="検索"
                @update:model-value="toTopPagenation"
              ></q-input>
            </div>
            <div class="col q-pa-sm">
              <c-input-tag
                v-model="filterCond.tags"
                label="タグ"
                dense
                hint=",/スペースで区切られます"
                :options="toreadTagOptions"
              ></c-input-tag>
            </div>
            <div class="col-auto q-pa-sm">
              <q-toggle
                v-model="filterCond.isOnlyNewBook"
                label="新刊のみ"
              ></q-toggle>
            </div>
          </div>
        </q-card>
      </q-expansion-item>
    </q-footer>



    
    <!-- 新規作成・編集ダイアログ -->
    <c-dialog
      v-model="bookDialog.isShow"
      :header-text="bookDialog.headerText"
      :okLabel="bookDialog.okLabel"
      @ok="bookDialog.okFunction"
    >
      <q-form ref="bookDialogForm" class="row">
        <div class="col-12 q-pa-xs">
          <q-input
            v-model="bookDialog.form.bookName"
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
        <div class="col-8 q-pa-xs">
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
        <div class="col-4 q-pa-xs">
          <q-input
            v-model.number="bookDialog.form.page"
            type="number"
            min="1"
            :label="labels.page"
            :rules="validationRules.page"
          ></q-input>
        </div>
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-input
            v-model="bookDialog.form.authorName"
            :label="labels.authorName"
          ></q-input>
        </div>
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-input
            v-model="bookDialog.form.publisherName"
            :label="labels.publisherName"
          ></q-input>
        </div>
        <div class="col-12 q-pa-xs">
          <q-input
            v-model="bookDialog.form.otherUrl"
            :label="labels.otherUrl"
            :rules="validationRules.otherUrl"
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
            :disable="!bookDialog.form.isbn && !bookDialog.form.bookName"
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

    <!-- 書籍検索ダイアログ -->
    <c-books-search-dialog
      v-model="booksSearchDialog.isShow"
      :search-word="booksSearchDialog.searchWord"
      @ok="booksSearchDialog.okFunction"
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
  </q-layout>
</template>

<style scoped>
.book-cover-wrapper{
  max-width: 140px;
  min-width: 140px;
}

.book-card-item{
  cursor: pointer;
}

.book-img{
  max-height: 150px;
}

.book-info div{
  font-family: "BIZ UDPGothic";
}

.select-sort-key{
  width: 148px;
}

.set-tag-dialog-form-tags{
  width: 300px;
}

.body--light .book-cover-wrapper{
  background:
    linear-gradient(
      90deg,
      rgba(208, 147, 82, 0.6),
      rgba(192, 134, 70, 0.6) 60%,
      rgba(208, 147, 82, 0.6)
    ),
    repeating-radial-gradient(
      ellipse at 60% 500%,
      #c08646,
      #c08646 0.2%,
      #d09352 0.6%,
      #d09352 1%
    );
}

.body--light .q-page-container{
  background:
    repeating-radial-gradient(
      circle at -1000% 0%,
      rgba(116, 77, 48, 0.7),
      #573216 7.5%,
      rgba(116, 77, 48, 0.9) 10%
    ),
    repeating-radial-gradient(
      circle at -1000% 0%,
      #573216,
      #573216 0.1%,
      #744d30 0.4%,
      #744d30 0.5%
    );
}
</style>