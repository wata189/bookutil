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
import * as bookApiUtil from '@/modules/bookApiUtil';
import {getCoverUrl} from '@/modules/ndlSearchUtil';
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  BOOKSHELF: "cache-bookshelf",
  BOOKS: "cache-toreadBooks",
  TAGS: "cache-toreadTags",
  TAGS_HISTORIES: "cache-tagsHistories"
};

import CBooksSearchDialog from '@/components/c-books-search-dialog.vue';
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
    });

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

const selectAllDispBooks = () => {
  for(const dispToreadBook of dispToreadBooks.value){
    const toreadBook = toreadBooks.value.find(toreadBook => toreadBook.documentId === dispToreadBook.documentId);
    if(toreadBook){
      toreadBook.isChecked = ref(true);
    }
  }
};

const toreadTagOptions:Ref<string[]> = ref([]);

// toread画面初期化処理
const fetchToreadBooks = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/toread/fetch", {idToken});
  if(response){
    await setToreadBooks(response.data.toreadBooks);
  }
};
const setToreadBooks = async (books:Book[]) => {
  // キャッシュに保存
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.BOOKS, books, limitHours);
  toreadBooks.value = books.map((book:Book):Book => {
    let dispCoverUrl = IMG_PLACEHOLDER_PATH;
    if(book.coverUrl){
      dispCoverUrl = book.coverUrl;
    }else if(book.isbn){
      dispCoverUrl = getCoverUrl(book.isbn) || IMG_PLACEHOLDER_PATH;;
    }
    const retBook = {
      ...book,
      dispCoverUrl,
      isChecked: ref(false)
    };
    return retBook;
  });
};

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
  toreadTagOptions.value = tags;
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
    if(apiBook.memo){
      bookDialog.value.form.memo = apiBook.memo;

    }
  }
}

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
      const message = `『${bookDialog.value.form.bookName}』を新規作成しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setToreadBooks(response.data.toreadBooks);

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
      await setToreadBooks(response.data.toreadBooks);
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
    // 図書館チェックフラグのトグルごときで通知メッセージは出さない
    // 画面情報再設定
    await setToreadBooks(response.data.toreadBooks);
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
  idToken: string | null,
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
  const idToken = await authUtil.getIdToken();
  const user = authUtil.getUserInfo();
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
    // 図書館チェックフラグはisbn入っているときのみ
    newBookCheckFlg: form.isbn ? form.newBookCheckFlg : 0, 
    tags: form.tags ? util.strToTag(form.tags.trim()) : [],
    coverUrl: form.coverUrl ? form.coverUrl.trim() : null,

    // アクセストークン
    idToken,
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
  idToken: string | null;
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
    const idToken = await authUtil.getIdToken()
    const user = authUtil.getUserInfo();
    const params:SimpleBooksParams = {
      books: simpleBooks,
      user: user.email || "No User Data",
      idToken
    };
    const response = await axiosUtil.post(`/toread/delete`, params);
    if(response){
      const message = `選択した本を削除しました`;
      // TODO: 削除した本を戻す処理
      notifyUtil.notify(message, [], true);
      // 画面情報再設定
      await setToreadBooks(response.data.toreadBooks);
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


const isCreateUniqueIsbn = (val:string) => {
  if(!util.isExist(val)){return true;}

  let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
  let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

  const isbns = toreadBooks.value.map(book => book.isbn);

  return (!isbns.includes(isbn13) && !isbns.includes(isbn10)) || "同じISBNの本があります";
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
    page: null,
    memo: "",
    coverUrl: "",
    newBookCheckFlg: 0,
    tags: ""
  };
  bookDialog.value.isShow = true;

  validationRules.isbn = [
    validationUtil.isIsbn(labels.isbn),
    isCreateUniqueIsbn
  ];
};

const isUpdateUniqueIsbn = (documentId:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
    let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

    const sameIsbnBook = toreadBooks.value.find(book => {
      return (book.isbn === isbn13 || book.isbn === isbn10) && book.documentId !== documentId;
    });

    return !util.isExist(sameIsbnBook) || "同じISBNの本があります";
  }
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

// よみたいタグ取得→セット
const setWantTag = async () => {
  const idToken = await authUtil.getIdToken()
  const user = authUtil.getUserInfo();
  const params = {
    isbn: bookDialog.value.form.isbn,
    user: user.email || "No User Data",
    idToken: idToken,
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
      await setToreadBooks(response.data.toreadBooks);
    }
  });
};
const addWantTag = async (book:Book) => {
  const simpleBook:SimpleBook = {documentId:book.documentId, updateAt:book.updateAt};
  const idToken = await authUtil.getIdToken()
  const user = authUtil.getUserInfo();
  const params = {
    book: simpleBook,
    user: user.email || "No User Data",
    idToken
  };
  const response = await axiosUtil.post(`/toread/tag/want/add`, params);
  if(response){
    // 画面情報再設定
    await setToreadBooks(response.data.toreadBooks);
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
    
    const message = `選択した本にタグ「${addTagDialog.value.form.tags}」を追加しました`;
      notifyUtil.notify(message);
    // 画面情報再設定
    await setToreadBooks(response.data.toreadBooks);
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

  const idToken = await authUtil.getIdToken()
  const user = authUtil.getUserInfo();
  return {
    books: simpleBooks,
    user: user.email || "No User Data",
    idToken,
    tags: tags
  };
};

const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  page: [validationUtil.isNumber(labels.page)],
  coverUrl: [validationUtil.isUrl(labels.coverUrl)]
};

type MsgDialog = {
  isShow: boolean,
  headerText: string,
  okLabel: string,
  okFunction: Function | undefined,
  href: string | undefined,
  content: string
};
const msgDialog:Ref<MsgDialog> = ref({
  isShow: false,
  headerText: "",
  okLabel: "",
  okFunction: undefined,
  href: undefined,
  content: ""
});

// 外部連携フラグ
let isExternalCooperation = false;

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

const newBooksDialogForm:Ref<QForm | undefined> = ref();
const addNewBooks = () => {
  // フォームのバリデーション処理
  if(!newBooksDialogForm.value){return;}
  newBooksDialogForm.value.validate().then(async (success:boolean) => {
    if(!success){return;}

    // ダイアログ消す
    newBooksDialog.value.isShow = false;
    // formを送る
    const idToken = await authUtil.getIdToken();
    const user = authUtil.getUserInfo();
    const params = {
      newBooks: newBooksDialog.value.forms,
      idToken,
      user: user.email || "No User Data"
    };
    const response = await axiosUtil.post(`/toread/newbooks/add`, params);
    if(response){
      const message = `新刊を一括追加しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setToreadBooks(response.data.toreadBooks);

      // タグ履歴更新
      if(bookDialog.value.form.tags){
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
type NewBookForm = {
  documentId: string;
  bookName: string;
  isbn: string;
  authorName: string;
  publisherName: string;
  newBookCheckFlg: number;
  tags: string;
  isAdd: boolean;
  updateAt: number;
}
type NewBooksDialog = {
  isShow: boolean,
  headerText: string,
  okLabel: string,
  okFunction: Function,
  forms: NewBookForm[]
};
const newBooksDialog:Ref<NewBooksDialog> = ref({
  isShow: false,
  headerText: "新刊一括追加",
  okLabel: "一括追加",
  okFunction: addNewBooks,
  forms: []
});
// 新刊一括追加ダイアログ
const showNewBooksDialog = async () => {
  newBooksDialog.value.isShow = true;

  // 新刊取得処理
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/toread/newbooks/fetch", {idToken});
  if(response && response.data.newBooks.length > 0){
    newBooksDialog.value.forms = response.data.newBooks;
  }else{
  newBooksDialog.value.isShow = false;
    emitError("エラー", "追加していない新刊はありません");
  }
};

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
type BookshelfBookParams = BookshelfBook & {
  idToken: string | null,
  user: string
};
const addBookshelf = async (book:Book) => {
  // bookshelfに変形して登録
  const idToken = await authUtil.getIdToken();
  const user = authUtil.getUserInfo();
  const email = user.email || "No User Data";
  const tags = book.tags.filter(tag => {
    // 一部タグをフィルタリング
    return !["よみたい", "よんでいる", "図書館未定", "かいたい"].includes(tag);
  }).filter(tag => {
    // 図書館タグも除外
    return !/.{1,}図書館$/.test(tag);
  });
  const params:BookshelfBookParams = {
    documentId: null,
    updateAt: 0,
    user: email,
    idToken,

    bookName: book.bookName,
    isbn: book.isbn,
    authorName: book.authorName,
    coverUrl: book.coverUrl,
    publisherName: book.publisherName,
    tags,
    // bookshelf固有の情報
    readDate: null,
    rate: 0,
    contents:[],
    // dispCoverUrl型の関係で入れとく
    dispCoverUrl: ""
  };
  const response = await axiosUtil.post(`/bookshelf/create`, params);
  if(response){
    // キャッシュに保存
    const limitHours = 24;
    await cacheUtil.set(CACHE_KEY.BOOKSHELF, response.data.books, limitHours);
    
    const message = `『${params.bookName}』を本棚に新規作成しました`;
    
    notifyUtil.notify(message, [{
      icon: "delete",
      handler: () => {  // notifyコンポーネントがPromiseに対応していないためラップする
        deleteBooks([book])
      }
    }]);

  }
};

const {isAppLoaded} = toRefs(props);
onMounted(util.waitParentMount(isAppLoaded, async () => {
  // パラメータにisbnがあったらいきなりダイアログ表示
  const urlParams = (new URL(window.location.href)).searchParams;
  const urlParamIsbn = urlParams.get('isbn');
  const urlParamAlertNewBooksFlg = urlParams.get("alertNewBooksFlg");
  if(urlParamIsbn){

    if(util.isIsbn(urlParamIsbn)){
      isExternalCooperation = true;
      showCreateBookDialog();

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
  }else if(util.isExist(urlParamAlertNewBooksFlg)){
    // alertNewBooksから遷移してきた場合newBooks
    await showNewBooksDialog();
  }
  
  const urlParamWord = urlParams.get("filterCondWord");
  if(urlParamWord){
    filterCond.value.word = urlParamWord;
  }
  
  // タグ履歴キャッシュ
  const cachedTagsHistories:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS_HISTORIES);
  if(cachedTagsHistories){
    tagsHistories.value = cachedTagsHistories;
  }

  // キャッシュからリスト取得してみる
  const cachedToreadBooks:Book[] | null = await cacheUtil.get(CACHE_KEY.BOOKS);
  if(cachedToreadBooks){
    await setToreadBooks(cachedToreadBooks);
  }else{
    await fetchToreadBooks();
  }
  const cachedToreadTags:string[] | null = await cacheUtil.get(CACHE_KEY.TAGS);
  if(cachedToreadTags) {
    await setTags(cachedToreadTags);
  }else{
    fetchTags(); // tagOptions処理は完全に非同期で回す
  }

  console.log("mounted toread");
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
          <div class="col-aut q-pa-sm text-primary">{{ filteredSortedToreadBooks.length }}冊</div>
          <q-space></q-space>
        </div>
        <div class="row justify-center q-pa-md">
          <div v-for="book in dispToreadBooks" class="col book-cover-wrapper q-my-sm">
            <c-book-card
              :book-name="book.bookName"
              :isbn="book.isbn || ''"
              :author-name="book.authorName || ''"
              :tags="book.tags"
              :disp-cover-url="book.dispCoverUrl"
              :memo="book.memo || ''"
            >
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
                      title="本棚登録"
                      icon="menu_book"
                      color="secondary"
                      @click="addBookshelf(book)"
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
          <div ref="filtercond" v-if="isShowFilterCond" class="col-12 col-sm-6 col-md-auto q-pa-sm">
            <div class="row filter-cond shadow-up-12" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-3 text-black'">
              <div class="col q-pa-sm">
                <c-input-tag
                  id="filter-tag"
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
            title="全選択"  
            icon="done_all"
            color="secondary"
            :flat="false"
            @click="selectAllDispBooks"
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
            @click="showCreateBookDialog"
          ></c-round-btn>
        </div>
        <div class="col-auto q-pa-xs">
          <c-round-btn
            title="新刊一括追加"  
            icon="notifications_active"
            color="secondary"
            :flat="false"
            @click="showNewBooksDialog"
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
              id="book-dialog-tag"
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
              :disable="!(util.isExist(bookDialog.form.isbn) && util.isIsbn(bookDialog.form.isbn))"
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
              autogrow
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
      @error="emitError('エラー', '国会図書館サーチからデータを取得できませんでした')"
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
          id="add-tag-dialog-tag"
          v-model="addTagDialog.form.tags"
          :label="labels.tags"
          hint=",/スペースで区切られます"
          :options="toreadTagOptions"
          :rules="addTagValidationRules.tags"
          class="set-tag-dialog-form-tags"
        ></c-input-tag>
      </q-form>
    </c-dialog>

    <!-- 新刊一括追加ダイアログ -->
    <c-dialog
      v-model="newBooksDialog.isShow"
      :header-text="newBooksDialog.headerText"
      @hide="newBooksDialog.forms = []"
      no-padding
      @ok="newBooksDialog.okFunction"
      :ok-label="newBooksDialog.okLabel"
    >
      <q-form v-if="newBooksDialog.forms.length > 0" ref="newBooksDialogForm">
        <q-card v-for="form in newBooksDialog.forms" class="q-pa-sm q-ma-sm" :class="util.isDarkMode() ? 'bg-dark' : 'bg-pink-2' ">
          <div>
            {{ form.authorName }}『{{ form.bookName }}』
          </div>
          <q-checkbox
            v-model="form.isAdd"
            label="追加する"
          ></q-checkbox>
            <q-expansion-item
              v-model="form.isAdd"
              header-style="display:none;"
            >
            
            <div class="row">
              <div class="col-12 col-sm-5 q-pa-xs">
                <q-input
                  v-model="form.bookName"
                  clearable
                  :label="labels.bookName"
                  :rules="form.isAdd ? validationRules.bookName : []"
                ></q-input>
              </div>
              <div class="col-6 col-sm-4 q-pa-xs">
                <q-input
                  clearable
                  v-model="form.authorName"
                  :label="labels.authorName"
                ></q-input>
              </div>
              <div class="col-6 col-sm-3 q-pa-xs">
                <q-input
                  clearable
                  v-model="form.publisherName"
                  :label="labels.publisherName"
                ></q-input>
              </div>
              <div class="col-12 q-pa-xs">
                <c-input-tag
                  id="new-books-dialog-tag"
                  v-model="form.tags"
                  :label="labels.tags"
                  hint=",/スペースで区切られます"
                  :options="toreadTagOptions"
                ></c-input-tag>
              </div>
              <div class="col-12 col-sm-auto q-pa-xs">
                <q-toggle
                  v-model="form.newBookCheckFlg"
                  :disable="!(util.isExist(form.isbn) && util.isIsbn(form.isbn))"
                  size="md"
                  :true-value="1"
                  :false-value="0"
                  :label="labels.newBookCheckFlg"
                ></q-toggle>
              </div>
            </div>
          </q-expansion-item>
        </q-card>
      </q-form>
      <div v-else class="row justify-center q-pa-md">
        <q-spinner-ios size="36px" class="text-primary" />
      </div>
    </c-dialog>
    
    <!-- 汎用ダイアログ -->
    <c-dialog
      v-model="msgDialog.isShow"
      :header-text="msgDialog.headerText"
      :okLabel="msgDialog.okLabel"
      :href="msgDialog.href"
    >
      {{ msgDialog.content }}
    </c-dialog>
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
</style>