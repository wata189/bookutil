<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onMounted, Ref, computed, ComputedRef, ref, toRefs } from "vue";
import { QForm, useQuasar } from "quasar";
import VueApexCharts from "vue3-apexcharts";

import { NotifyUtil } from "@/modules/notifyUtil";
const notifyUtil = new NotifyUtil(useQuasar());
import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import validationUtil from "@/modules/validationUtil";
import AxiosUtil from "@/modules/axiosUtil";
import * as bookApiUtil from "@/modules/bookApiUtil";
import { searchNdlShortStorys } from "@/modules/ndlSearchUtil";
import { CacheUtil, CACHE_KEY } from "@/modules/cacheUtil";
const cacheUtil = new CacheUtil();
import CBooksSearchDialog from "@/components/c-books-search-dialog.vue";
import CRoundBtn from "@/components/c-round-btn.vue";
import CDialog from "@/components/c-dialog.vue";
import CInputTag from "@/components/c-input-tag.vue";
import CPagination from "@/components/c-pagination.vue";
import CBookCard from "@/components/c-book-card.vue";
import CTransition from "@/components/c-transition.vue";
import CInputDate from "@/components/c-input-date.vue";
import CBookLinks from "@/components/c-book-links.vue";
// axiosUtilのインスタンス作成
const EMIT_NAME_ERROR = "show-error-dialog";
const EMIT_NAME_CONFIRM = "show-confirm-dialog";
const emits = defineEmits(["show-error-dialog", "show-confirm-dialog"]);
const axiosUtil = new AxiosUtil(emits);

const emitError = (statusText: string, msg: string, status?: number) => {
  emits(EMIT_NAME_ERROR, status, statusText, msg);
};

interface Props {
  isAppLoaded: boolean;
}
const props = defineProps<Props>();

type Content = {
  authorName: string | null;
  contentName: string;
  rate: number;
};
type BookshelfBook = {
  documentId: string | undefined;
  bookName: string;
  isbn: string | null;
  coverUrl: string;
  authorName: string | null;
  publisherName: string | null;
  publishedMonth: string | null;
  readDate: string | null;
  updateAt: number;
  tags: string[];
  memo: string | null;
  rate: number;
  contents: Content[];
};
type DispBookshelfBook = BookshelfBook & {
  isChecked: Ref<boolean>;
};
const bookshelfBooks: Ref<DispBookshelfBook[]> = ref([]);

const pagination = ref({
  number: 1,

  dispMax: 99,
});
const paginationMax = computed(() => {
  return Math.ceil(
    filteredSortedBookshelfBooks.value.length / pagination.value.dispMax
  );
});
const isShowPagination = computed(() => {
  return filteredSortedBookshelfBooks.value.length > pagination.value.dispMax;
});
const toTopPagenation = () => {
  pagination.value.number = 1;
};

const sortByReadDate = (a: DispBookshelfBook, b: DispBookshelfBook) => {
  const aDateTime = new Date(a.readDate || "9999/12/31").getTime();
  const bDateTime = new Date(b.readDate || "9999/12/31").getTime();
  return bDateTime - aDateTime;
};
const filteredSortedBookshelfBooks = computed({
  get: () => {
    // 条件キャッシュ
    const filterWords = util.strToTag(filterCond.value.word);
    const plusFilterWords = filterWords.filter((word) => !word.startsWith("-"));
    //評価フィルターは1~5の選択時は無効
    const useRateFilter =
      filterCond.value.rate.min !== 1 || filterCond.value.rate.max !== 5;
    const filterDateRangeMin = new Date(
      filterCond.value.readDate.min || "1970/01/01"
    ).getTime();
    const filterDateRangeMax = new Date(
      filterCond.value.readDate.max || "9999/12/31"
    ).getTime();
    // マイナス検索の単語を抽出 最初の1文字は事前に削除しておく
    const minusFilterWords = filterWords
      .filter((word) => word.startsWith("-"))
      .map((word) => word.slice(1));
    const sortByUpdateAt = (a: DispBookshelfBook, b: DispBookshelfBook) =>
      b.updateAt - a.updateAt;
    let sortFunc = sortByReadDate;
    // TODO: ソートあれこれ
    // if(true){
    //   sortFunc = sortByReadDate;
    // }

    /////// フィルター
    return bookshelfBooks.value
      .filter((book) => {
        // 評価によるフィルタリング
        return (
          !useRateFilter ||
          (filterCond.value.rate.min <= book.rate &&
            book.rate <= filterCond.value.rate.max)
        );
      })
      .filter((book) => {
        // 日付でフィルタリング
        const dateTime = new Date(book.readDate || "9999/12/31").getTime();
        return filterDateRangeMin <= dateTime && dateTime <= filterDateRangeMax;
      })
      .filter((book: DispBookshelfBook) => {
        // 既読のみチェックボックス入れている場合は、readDateなかったらダメ
        if (filterCond.value.isOnlyReadBook && !book.readDate) {
          return false;
        }
        if (filterWords.length === 0) {
          return true;
        }
        // 通常のワード検索
        const searchedText = [
          book.bookName,
          book.isbn,
          book.authorName,
          book.publisherName,
          book.tags,
          ...book.contents.map((content) => content.authorName),
          ...book.contents.map((content) => content.contentName),
        ]
          .join("/") // /区切りで結合することで、予想外の検索ヒットを減らす
          // eslint-disable-next-line no-irregular-whitespace
          .replace(/[ 　,]/g, ""); // 空白など削除

        // すべてのキーワードがひっかかったらtrue
        const hasPlusFilterWords =
          plusFilterWords.filter((word) => searchedText.includes(word))
            .length === plusFilterWords.length;
        // マイナス検索 マイナス検索1件でも引っかかったらダメ
        const hasMinusFilterWords =
          minusFilterWords.filter((word) => searchedText.includes(word))
            .length > 0;
        return hasPlusFilterWords && !hasMinusFilterWords;
      })
      .sort(sortByUpdateAt) // 1回更新順でソートする
      .sort(sortFunc); // 選択した条件でソート
  },
  set: (value) => {
    bookshelfBooks.value = value;
  },
});
const dispBookshelfBooks = computed({
  get: () => {
    /////// ページ件数で絞り込み
    return filteredSortedBookshelfBooks.value.slice(
      // start: ページ番号 - 1 * 表示件数
      (pagination.value.number - 1) * pagination.value.dispMax,
      // end: ページ番号*表示件数 or 最後
      Math.min(
        pagination.value.number * pagination.value.dispMax,
        bookshelfBooks.value.length
      )
    );
  },
  set: (value) => {
    bookshelfBooks.value = value;
  },
});
const tagOptions: Ref<string[]> = ref([]);

// 画面初期化
const fetchTags = async () => {
  const idToken = await authUtil.getIdToken();
  const response = await axiosUtil.post("/tag/fetch", { idToken });
  if (response) {
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
  const response = await axiosUtil.post("/bookshelf/fetch", { idToken });
  if (response) {
    await setBookshelfBooks(response.data.bookshelfBooks);
  }
};
const setBookshelfBooks = async (books: BookshelfBook[]) => {
  // キャッシュに保存
  const limitHours = 24;
  await cacheUtil.set(CACHE_KEY.BOOKSHELF, books, limitHours);

  bookshelfBooks.value = books.map((book: BookshelfBook): DispBookshelfBook => {
    const retBook = {
      ...book,
      isChecked: ref(false),
    };
    return retBook;
  });
};

const getBook = async (isbn: string) => {
  const trimedIsbn = isbn.trim();
  if (!util.isIsbn(trimedIsbn)) {
    return;
  }

  const book = await bookApiUtil.getApiBook(trimedIsbn);
  // 本があったらフォームに設定
  if (book) {
    await setBookFromApiBook(book);
  } else {
    // なかったらエラーダイアログ
    emitError("エラー", "APIからデータを取得できませんでした");
  }
};
const setBookFromApiBook = async (apiBook: bookApiUtil.ApiBook) => {
  if (apiBook) {
    if (apiBook.isbn) {
      bookDialog.value.form.isbn = apiBook.isbn;
    }
    if (apiBook.bookName) {
      bookDialog.value.form.bookName = apiBook.bookName;
    }
    if (apiBook.authorName) {
      bookDialog.value.form.authorName = apiBook.authorName;
    }
    if (apiBook.coverUrl) {
      bookDialog.value.form.coverUrl = apiBook.coverUrl;
    }
    if (apiBook.publisherName) {
      bookDialog.value.form.publisherName = apiBook.publisherName;
    }
    if (apiBook.publishedMonth) {
      bookDialog.value.form.publishedMonth = apiBook.publishedMonth;
    }
  }

  // isbnない場合やcontentsすでにある場合は終わり
  if (!apiBook || !apiBook.isbn || !util.isIsbn(apiBook.isbn)) {
    return;
  }
  if (bookDialog.value.form.contents.length > 0) {
    return;
  }

  const shortStorys = await searchNdlShortStorys(apiBook.isbn);
  setShortStorysToContents(shortStorys);
};

const bookDialogForm: Ref<QForm | undefined> = ref();
const createBook = () => {
  // フォームのバリデーション処理
  if (!bookDialogForm.value) {
    return;
  }
  bookDialogForm.value.validate().then(async (success: boolean) => {
    if (!success) {
      return;
    }

    // 書籍名キャッシュ
    const bookName = bookDialog.value.form.bookName;

    // ダイアログ消す
    bookDialog.value.isShow = false;
    // formを送る
    const params = await createCreateParams(bookDialog.value.form);
    const response = await axiosUtil.post(`/bookshelf/create`, params);
    if (response) {
      const message = `『${bookName}』を新規作成しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setBookshelfBooks(response.data.bookshelfBooks);

      // タグ履歴更新
      if (bookDialog.value.form.tags) {
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
const addTagsHistories = async (tags: string) => {
  tagsHistories.value.push(tags);
  if (tagsHistories.value.length > 10) {
    tagsHistories.value.shift();
  }
  const limitHours = 24;
  await cacheUtil.set(
    CACHE_KEY.TAGS_HISTORIES,
    [...tagsHistories.value],
    limitHours
  );
};
const editBook = () => {
  // フォームのバリデーション処理
  if (!bookDialogForm.value) {
    return;
  }
  bookDialogForm.value.validate().then(async (success: boolean) => {
    if (!success) {
      return;
    }

    // 書籍名キャッシュ
    const bookName = bookDialog.value.form.bookName;

    // formを送る
    const updateAt = bookDialog.value.updateAt || 0;
    // ダイアログ消す
    bookDialog.value.isShow = false;
    const response = await updateBook(
      bookDialog.value.documentId,
      updateAt,
      bookDialog.value.form
    );
    if (response) {
      const message = `『${bookName}』を更新しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setBookshelfBooks(response.data.bookshelfBooks);
      // タグ履歴更新
      if (bookDialog.value.form.tags) {
        await addTagsHistories(bookDialog.value.form.tags);
      }
    }
  });
};
const updateBook = async (
  documentId: string,
  updateAt: number,
  form: BookshelfBookForm
) => {
  const params = await createUpdateParams(documentId, updateAt, form);
  const response = await axiosUtil.post(`/bookshelf/update`, params);
  return response;
};
type BookshelfBookForm = {
  bookName: string;
  isbn: string;
  authorName: string;
  publisherName: string;
  publishedMonth: string;
  coverUrl: string;
  tags: string;
  rate: number;
  contents: Content[];
  readDate: string;
  memo: string;
};
type BookshelfBookParams = BookshelfBook & {
  idToken: string | null;
  user: string;
};
const createCreateParams = async (form: BookshelfBookForm) => {
  const params = await createBookParams(form);

  return params;
};
const createUpdateParams = async (
  documentId: string,
  updateAt: number,
  form: BookshelfBookForm
) => {
  const params = await createBookParams(form);
  params.documentId = documentId;
  params.updateAt = updateAt;
  return params;
};
const createBookParams = async (form: BookshelfBookForm) => {
  const idToken = await authUtil.getIdToken();
  const user = authUtil.getUserInfo();
  const email = user.email || "No User Data";
  const params: BookshelfBookParams = {
    documentId: undefined,
    updateAt: 0,
    user: email,

    // フォームのパラメータ
    bookName: form.bookName.trim(),
    isbn: form.isbn ? form.isbn.trim() : null,
    authorName: form.authorName ? form.authorName.trim() : null,
    publisherName: form.publisherName ? form.publisherName.trim() : null,
    publishedMonth: form.publishedMonth ? form.publishedMonth.trim() : null,
    tags: form.tags ? util.strToTag(form.tags.trim()) : [],
    coverUrl: form.coverUrl ? form.coverUrl.trim() : "",
    rate: form.rate ? form.rate : 0,
    contents: form.contents ? form.contents : [],
    readDate: form.readDate ? form.readDate.trim() : null,

    memo: form.memo || null,

    // アクセストークン
    idToken,
  };

  return params;
};

type BookDialog = {
  isShow: boolean;
  documentId: string;
  updateAt: number | null;
  headerText: string;
  showDatePopup: boolean;
  okLabel: string;
  okFunction: () => void;
  form: BookshelfBookForm;
};
const bookDialog: Ref<BookDialog> = ref({
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
    publishedMonth: "",
    coverUrl: "",
    tags: "",
    rate: 0,
    contents: [],
    readDate: "",
    memo: "",
  },
});
const isCreateUniqueIsbn = (val: string) => {
  if (!util.isExist(val)) {
    return true;
  }

  let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
  let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

  const isbns = bookshelfBooks.value.map((book) => book.isbn);

  return (
    (!isbns.includes(isbn13) && !isbns.includes(isbn10)) ||
    "同じISBNの本があります"
  );
};
const isUpdateUniqueIsbn = (documentId: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    let isbn13 = val.length === 13 ? val : util.isbn10To13(val);
    let isbn10 = val.length === 10 ? val : util.isbn13To10(val);

    const sameIsbnBook = bookshelfBooks.value.find((book) => {
      return (
        (book.isbn === isbn13 || book.isbn === isbn10) &&
        book.documentId !== documentId
      );
    });

    return !util.isExist(sameIsbnBook) || "同じISBNの本があります";
  };
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
    publishedMonth: "",
    coverUrl: "",
    tags: "",
    rate: 0,
    contents: [],
    readDate: "",
    memo: "",
  };
  bookDialog.value.isShow = true;

  validationRules.isbn = [
    validationUtil.isIsbn(labels.isbn),
    isCreateUniqueIsbn,
  ];
};
// 編集ダイアログ表示
const showEditBookDialog = (book: BookshelfBook) => {
  if (!book.documentId) return;
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
    publishedMonth: book.publishedMonth || "",
    coverUrl: book.coverUrl,
    tags: book.tags.join("/"),
    rate: book.rate,
    contents: [...book.contents],
    readDate: book.readDate || "",
    memo: book.memo || "",
  };
  bookDialog.value.isShow = true;

  validationRules.isbn = [
    validationUtil.isIsbn(labels.isbn),
    isUpdateUniqueIsbn(book.documentId),
  ];
};
// isbnの入力補完
const onUpdateIsbn = (inputIsbn: string) => {
  let isbn = inputIsbn.replace(/-/g, "");
  if (isbn.length === 9) {
    isbn = util.isbn9To10(isbn);
  } else if (isbn.length === 12) {
    isbn = util.isbn12To13(isbn);
  }

  if (util.isIsbn(isbn)) {
    bookDialog.value.form.isbn = isbn;
  }
};
// ローカルストレージのタグ履歴取得
const tagsHistories: Ref<string[]> = ref([]);
const setLatestTagsFromTagsHistories = async () => {
  const latestTags = tagsHistories.value.pop();
  if (latestTags) {
    // 最新タグ設定
    bookDialog.value.form.tags = latestTags;
    // キャッシュ更新
    const limitHours = 24;
    await cacheUtil.set(
      CACHE_KEY.TAGS_HISTORIES,
      [...tagsHistories.value],
      limitHours
    );
  }
};

const isShowFilterCond = ref(false);
const labels = {
  bookName: "書籍名",
  isbn: "ISBN",
  authorName: "著者名",
  publisherName: "出版社名",
  publishedMonth: "出版年月",
  coverUrl: "書影URL",
  tags: "タグ",
  memo: "メモ",
  readDate: "読了日",
  rate: "評価",
  contents: {
    contentName: "内容名",
    authorName: "著者名",
    rate: "評価",
  },
};
const validationRules = {
  bookName: [validationUtil.isExist(labels.bookName)],
  isbn: [validationUtil.isIsbn(labels.isbn)],
  coverUrl: [validationUtil.isUrl(labels.coverUrl)],
  publishedMonth: [
    validationUtil.isYearMonthStr(labels.publishedMonth),
    validationUtil.isValidYearMonth(labels.publishedMonth),
  ],
  contents: {
    readDate: [
      validationUtil.isDateStr(labels.readDate),
      validationUtil.isValidDate(labels.readDate),
    ],
    contentName: [validationUtil.isExist(labels.contents.contentName)],
  },
};
const searchShortStorys = async (isbn: string) => {
  if (!isbn || !util.isIsbn(isbn)) {
    return;
  }

  const shortStorys = await searchNdlShortStorys(isbn);

  if (shortStorys.length === 0) {
    emitError("エラー", "書籍内容がありません");
    return;
  }

  setShortStorysToContents(shortStorys);
};
const setShortStorysToContents = (contents: Content[]) => {
  bookDialog.value.form.contents = contents;
};

const calcRate = (contents: Content[]) => {
  const calcedContents = contents.filter((content) => content.rate > 0); // 点数つけたもののみで計算
  const avg =
    calcedContents
      .map((content) => content.rate)
      .reduce((a, b) => {
        return a + b;
      }, 0) / calcedContents.length;
  bookDialog.value.form.rate = Math.round(avg);
};

const booksSearchDialog = ref({
  isShow: false,
  bookName: "",
  authorName: "",
  publisherName: "",
  okFunction: setBookFromApiBook,
});
const showBooksSearchDialog = () => {
  booksSearchDialog.value = {
    isShow: true,
    bookName: bookDialog.value.form.bookName || "",
    authorName: bookDialog.value.form.authorName || "",
    publisherName: bookDialog.value.form.publisherName || "",
    okFunction: setBookFromApiBook,
  };
};

const filterCond = ref({
  word: "",
  isOnlyReadBook: false,
  rate: { min: 1, max: 5 },
  readDate: { min: "", max: "" },
});

const getBookshelfMemo = (book: BookshelfBook) => {
  if (book.contents.length === 0 && !book.memo) {
    return undefined;
  }
  let memo = book.memo || "";
  memo += "\n";
  memo += book.contents
    .map(
      (content) =>
        `${content.authorName ? content.authorName : ""}「${
          content.contentName
        }」${"★".repeat(content.rate)}`
    )
    .join("\n");
  return memo.trim();
};

const PUBLIC_DOMAIN_URLS = [
  "https://www.youtube.com/results?search_query=朗読+",
  "https://bookwalker.jp/category/1/?word=青空文庫+",
  "https://www.google.com/search?q=パブリックドメイン+",
];
const searchPublicDomain = (bookName: string, authorName: string | null) => {
  const urls = PUBLIC_DOMAIN_URLS.map(
    (url) => url + `${bookName}+${authorName || ""}`
  );
  urls.forEach((url) => open(url));
};
const searchPublicDomains = (form: BookshelfBookForm) => {
  const contents = form.contents.filter((content) => content.contentName);
  if (contents.length > 0) {
    contents.forEach((content) =>
      searchPublicDomain(
        content.contentName,
        content.authorName || form.authorName
      )
    );
  } else {
    searchPublicDomain(form.bookName, form.authorName);
  }
};

const selectedBooks = computed(() => {
  return bookshelfBooks.value.filter((book) => book.isChecked);
});

type AddTagForm = {
  tags: string;
};
type AddTagDialog = {
  isShow: boolean;
  headerText: string;
  okLabel: string;
  okFunction: () => void;
  form: AddTagForm;
};
const addTagDialog: Ref<AddTagDialog> = ref({
  isShow: false,
  headerText: "",
  okLabel: "",
  okFunction: () => {},
  form: {
    tags: "",
  },
});
const showAddTagDialog = () => {
  const books = selectedBooks.value;
  // 0件選択の場合はエラーダイアログ
  if (books.length === 0) {
    emitError("エラー", "タグを設定する本を選択してください");
    return;
  }

  addTagDialog.value = {
    isShow: true,
    headerText: "一括タグ追加",
    okLabel: "タグ追加",
    okFunction: addMultiTag,
    form: {
      tags: "",
    },
  };
};
const addTagValidationRules = {
  tags: [validationUtil.isExist(labels.tags)],
};
const addTagDialogForm: Ref<QForm | undefined> = ref();
const addMultiTag = async () => {
  // フォームのバリデーション処理
  if (!addTagDialogForm.value) {
    return;
  }
  addTagDialogForm.value.validate().then(async (success: boolean) => {
    if (!success) {
      return;
    }
    const tags = addTagDialog.value.form.tags;

    // ダイアログ消す
    addTagDialog.value.isShow = false;
    const response = await addTags(selectedBooks.value, util.strToTag(tags));
    if (response) {
      const message = `選択した本にタグ「${tags}」を追加しました`;
      notifyUtil.notify(message);
      // 画面情報再設定
      await setBookshelfBooks(response.data.bookshelfBooks);
    }
  });
};
const addTags = async (books: BookshelfBook[], tags: string[]) => {
  const params = await createAddTagParams(books, tags);
  return await axiosUtil.post(`/bookshelf/tag/add`, params);
};

type SimpleBook = {
  documentId: string;
  updateAt: number;
};
type SimpleBooksParams = {
  books: SimpleBook[];
  tags?: string[];
  user: string;
  idToken: string | null;
};
const createAddTagParams = async (
  books: BookshelfBook[],
  tags: string[]
): Promise<SimpleBooksParams> => {
  const simpleBooks: SimpleBook[] = books.map((book) => {
    return { documentId: book.documentId || "", updateAt: book.updateAt };
  });

  const idToken = await authUtil.getIdToken();
  const user = authUtil.getUserInfo();
  return {
    books: simpleBooks,
    user: user.email || "No User Data",
    idToken,
    tags: tags,
  };
};

const deleteBooks = async (books: BookshelfBook[]) => {
  const simpleBooks: SimpleBook[] = books.map((book) => {
    return { documentId: book.documentId || "", updateAt: book.updateAt };
  });
  // 0件選択の場合はエラーダイアログ
  if (books.length === 0) {
    emitError("エラー", "削除する本を選択してください");
    return;
  }
  // 確認ダイアログ
  const dispBooks = books.map((book) => `・${book.bookName}`);
  let confirmDialogMsg = `以下の本を削除します

${dispBooks.join("\n")}`;
  emits(EMIT_NAME_CONFIRM, "確認", confirmDialogMsg, true, async () => {
    const idToken = await authUtil.getIdToken();
    const user = authUtil.getUserInfo();
    const params: SimpleBooksParams = {
      books: simpleBooks,
      user: user.email || "No User Data",
      idToken,
    };
    const response = await axiosUtil.post(`/bookshelf/delete`, params);
    if (response) {
      const message = `選択した本を削除しました`;
      // TODO: 削除した本を戻す処理
      notifyUtil.notify(message, [], true);
      // 画面情報再設定
      await setBookshelfBooks(response.data.bookshelfBooks);
    }
  });
};

// 一括選択
const selectAllDispBooks = () => {
  for (const dispBookshelfBook of dispBookshelfBooks.value) {
    const bookshelfBook = bookshelfBooks.value.find(
      (book) => book.documentId === dispBookshelfBook.documentId
    );
    if (bookshelfBook) {
      bookshelfBook.isChecked = ref(true);
    }
  }
};

type ChartData = {
  name: string;
  data: number[];
};
type Chart = {
  type: string;
  data: ChartData[];
  options: {
    chart: {
      id: string;
    };
    xaxis: {
      categories: string[];
    };
  };
};
const chart: ComputedRef<Chart> = computed(() => {
  const books: BookshelfBook[] = filteredSortedBookshelfBooks.value.filter(
    (b) => b.readDate
  ); // 読了日あるものだけ対象
  // 設定した条件を元にaxisとdataを作る
  let data: ChartData[] = [];
  let categories: string[] = [];
  let type = "bar";
  if (chartType.value === "barByMonth") {
    // 月別に分解して件数計算
    const months = util
      .removeDuplicateElements<string>(
        books
          .map((b) => b.readDate || "")
          .map((readDate) => readDate.substring(0, 7))
      )
      .reverse(); // もともとreadDate降順になってるので、昇順に戻す
    categories = months;
    data = [
      {
        name: "",
        data: months.map(
          (month) =>
            books.filter((b) => b.readDate && b.readDate.startsWith(month))
              .length
        ),
      },
    ];
  } else if (chartType.value === "barByYear") {
    const months = util
      .removeDuplicateElements<string>(
        books
          .map((b) => b.readDate || "")
          .map((readDate) => readDate.substring(0, 5))
      )
      .reverse(); // もともとreadDate降順になってるので、昇順に戻す
    categories = months;
    data = [
      {
        name: "",
        data: months.map(
          (month) =>
            books.filter((b) => b.readDate && b.readDate.startsWith(month))
              .length
        ),
      },
    ];
  }

  return {
    type,
    data,
    options: {
      chart: {
        id: "chart",
      },
      xaxis: {
        categories,
      },
    },
  };
});
type ChartType = "barByMonth" | "barByYear";
const chartType: Ref<ChartType> = ref("barByMonth");
const chartTypeOptions = [
  { label: "", value: "barByMonth", slot: "barByMonth" },
  { label: "", value: "barByYear", slot: "barByYear" },
  //TODO: 平均評価を年別グラフに出す
];
const isShowChart = ref(false);
const chartHeight = ref(0);
const showChart = () => {
  // 高さ設定 resizeイベントにこれ設定するとリサイズで消えちゃうので、チャート表示時に1回だけ行う
  chartHeight.value = window.innerHeight - 52 - 50 - 50 - 50;
  isShowChart.value = true;
};

const { isAppLoaded } = toRefs(props);
onMounted(
  util.waitParentMount(isAppLoaded, async () => {
    // タグ履歴キャッシュ
    const cachedTagsHistories = (await cacheUtil.get(
      CACHE_KEY.TAGS_HISTORIES
    )) as string[] | null;
    if (cachedTagsHistories) {
      tagsHistories.value = cachedTagsHistories;
    }

    // キャッシュからリスト取得してみる
    const cachedBookshelfBooks = (await cacheUtil.get(CACHE_KEY.BOOKSHELF)) as
      | BookshelfBook[]
      | null;
    if (cachedBookshelfBooks) {
      await setBookshelfBooks(cachedBookshelfBooks);
    } else {
      await fetchBookshelfBooks();
    }

    const cachedTags = (await cacheUtil.get(CACHE_KEY.TAGS)) as string[] | null;
    if (cachedTags) {
      await setTags(cachedTags);
    } else {
      fetchTags(); // tagOptions処理は完全に非同期で回す
    }

    console.log("mounted bookshelf");
  })
);
</script>

<template>
  <div>
    <q-page-container @click="isShowFilterCond = false">
      <q-page v-if="isShowChart">
        <div class="row">
          <div class="col-4 q-pa-sm">
            <q-btn-toggle v-model="chartType" :options="chartTypeOptions">
              <template #barByMonth>
                <q-icon title="月グラフ" name="bar_chart" />
              </template>
              <template #barByYear>
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
          <div class="col-aut q-pa-sm text-primary">
            {{ filteredSortedBookshelfBooks.length }}冊
          </div>
          <q-space></q-space>
        </div>
        <div class="row justify-center q-pa-md">
          <div
            v-for="book in dispBookshelfBooks"
            :key="book.documentId"
            class="col book-cover-wrapper q-my-sm"
          >
            <c-book-card
              :book-name="book.bookName"
              :isbn="book.isbn || ''"
              :author-name="book.authorName || ''"
              :publisher-name="book.publisherName || undefined"
              :tags="book.tags"
              :disp-cover-url="book.coverUrl"
              :memo="getBookshelfMemo(book)"
            >
              <template #header>
                <q-checkbox
                  v-model="book.isChecked"
                  :label="'★'.repeat(book.rate)"
                  dense
                >
                </q-checkbox>
              </template>
              <template #menu-footer>
                <div class="row">
                  <div class="col-12">読了日：{{ book.readDate }}</div>
                  <div class="col-auto">
                    <c-round-btn
                      title="削除"
                      icon="delete"
                      color="negative"
                      @click="deleteBooks([book])"
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
          <div class="col-aut q-pa-sm text-primary">
            {{ filteredSortedBookshelfBooks.length }}冊
          </div>
          <q-space></q-space>
        </div>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <div class="row justify-end items-end">
        <c-transition appear enter="fadeIn" leave="fadeOut">
          <div
            v-if="isShowFilterCond"
            ref="filtercond"
            class="col-12 col-sm-8 col-md-6 col-lg-auto q-pa-sm"
          >
            <div
              class="row filter-cond shadow-up-12 items-center"
              :class="util.accentColorClasses.value"
            >
              <div class="col-2 q-pa-sm">読了日</div>
              <div class="col-5 q-pa-sm">
                <c-input-date
                  v-model="filterCond.readDate.min"
                  label="開始"
                  :rules="validationRules.contents.readDate"
                  clearable
                  dense
                ></c-input-date>
              </div>
              <div class="col-5 q-pa-sm">
                <c-input-date
                  v-model="filterCond.readDate.max"
                  label="終了"
                  :rules="validationRules.contents.readDate"
                  clearable
                  dense
                ></c-input-date>
              </div>

              <div class="col-2 q-pa-sm">評価</div>
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
            :is-flat="false"
            @click="isShowFilterCond = !isShowFilterCond"
          ></c-round-btn>
        </div>
        <template v-if="isShowChart">
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="本棚表示"
              icon="menu_book"
              color="secondary"
              :is-flat="false"
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
              :is-flat="false"
              @click="showChart"
            ></c-round-btn>
          </div>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="全選択"
              icon="done_all"
              color="secondary"
              :is-flat="false"
              @click="selectAllDispBooks"
            ></c-round-btn>
          </div>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              :disabled="selectedBooks.length === 0"
              title="一括削除"
              icon="delete"
              color="negative"
              :is-flat="false"
              @click="deleteBooks(selectedBooks)"
            ></c-round-btn>
          </div>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              :disabled="selectedBooks.length === 0"
              title="一括タグ"
              icon="local_offer"
              color="secondary"
              :is-flat="false"
              @click="showAddTagDialog"
            ></c-round-btn>
          </div>
          <div class="col-auto q-pa-xs">
            <c-round-btn
              title="新規作成"
              icon="add"
              color="primary"
              :is-flat="false"
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
      :ok-label="bookDialog.okLabel"
      @ok="bookDialog.okFunction"
    >
      <q-form ref="bookDialogForm">
        <div class="row">
          <div class="col q-pa-xs">
            <q-input
              v-model="bookDialog.form.bookName"
              clearable
              :label="labels.bookName"
              :rules="validationRules.bookName"
            >
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              label="書籍検索"
              color="primary"
              @click="showBooksSearchDialog"
            />
          </div>
        </div>

        <div class="row">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-input
              v-model="bookDialog.form.isbn"
              clearable
              :label="labels.isbn"
              :rules="validationRules.isbn"
              @update:model-value="onUpdateIsbn(bookDialog.form.isbn)"
              @keydown.enter="getBook(bookDialog.form.isbn)"
            >
              <template #append>
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
              v-model="bookDialog.form.authorName"
              clearable
              :label="labels.authorName"
            ></q-input>
          </div>

          <div class="col-12">
            <c-book-links
              :book-name="bookDialog.form.bookName || ''"
              :author-name="bookDialog.form.authorName"
              :isbn="bookDialog.form.isbn"
              :other-link="null"
            ></c-book-links>
          </div>

          <div class="col-4 col-sm-6 q-pa-xs">
            <q-input
              v-model="bookDialog.form.publishedMonth"
              clearable
              :label="labels.publishedMonth"
              :rules="validationRules.publishedMonth"
            ></q-input>
          </div>
          <div class="col-8 col-sm-6 q-pa-xs">
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
              flat
              label="タグ履歴"
              color="primary"
              @click="setLatestTagsFromTagsHistories"
            />
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
        <div class="row">
          <div class="col-12 col-sm-6 q-pa-xs">
            <c-input-date
              v-model="bookDialog.form.readDate"
              :label="labels.readDate"
              :rules="validationRules.contents.readDate"
              clearable
            ></c-input-date>
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
              flat
              label="1行追加"
              color="primary"
              @click="
                bookDialog.form.contents.push({
                  authorName: '',
                  contentName: '',
                  rate: 0,
                })
              "
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn
              :disable="
                !util.isExist(bookDialog.form.isbn) ||
                !util.isIsbn(bookDialog.form.isbn)
              "
              flat
              label="書籍内容検索"
              color="primary"
              @click="searchShortStorys(bookDialog.form.isbn)"
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn
              :disable="bookDialog.form.contents.length === 0"
              flat
              label="点数計算"
              color="primary"
              @click="calcRate(bookDialog.form.contents)"
            />
          </div>
          <div class="col-auto q-pa-xs">
            <q-btn
              :disable="!bookDialog.form.bookName"
              flat
              label="PD検索"
              color="primary"
              @click="searchPublicDomains(bookDialog.form)"
            />
          </div>
          <div
            v-if="bookDialog.form.contents.length > 0"
            class="col-12 q-pa-xs"
          >
            <q-card
              v-for="(content, i) in bookDialog.form.contents"
              :key="'content-' + i"
              class="q-my-sm"
              :class="util.baseColorClasses.value"
            >
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
      :book-name="booksSearchDialog.bookName"
      :author-name="booksSearchDialog.authorName"
      :publisher-name="booksSearchDialog.publisherName"
      @ok="booksSearchDialog.okFunction"
      @error="emitError('エラー', 'APIからデータを取得できませんでした')"
    ></c-books-search-dialog>

    <!-- 一括タグダイアログ -->
    <c-dialog
      v-model="addTagDialog.isShow"
      :header-text="addTagDialog.headerText"
      :ok-label="addTagDialog.okLabel"
      @ok="addTagDialog.okFunction"
    >
      <q-form ref="addTagDialogForm">
        <c-input-tag
          id="add-tag-dialog-tag"
          v-model="addTagDialog.form.tags"
          :label="labels.tags"
          hint=",/スペースで区切られます"
          :options="tagOptions"
          :rules="addTagValidationRules.tags"
          class="set-tag-dialog-form-tags"
        ></c-input-tag>
      </q-form>
    </c-dialog>
  </div>
</template>

<style scoped>
.book-cover-wrapper {
  max-width: 120px;
  min-width: 120px;
}

@media (min-width: 600px) {
  .book-cover-wrapper {
    max-width: 150px;
    min-width: 150px;
  }
}

.filter-cond {
  border-radius: 15px;
}

.set-tag-dialog-form-tags {
  width: 300px;
}

.contents-table-author-name {
  width: 100px;
}
@media (min-width: 600px) {
  .contents-table-author-name {
    width: 150px;
  }
}
.contents-table-rate {
  width: 89px;
}
.contents-table-delete-btn {
  width: 58px;
}

.book-card-rate {
  height: 21px;
}
</style>
