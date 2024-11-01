import googleBooksUtil from "@/modules/googleBooksUtil";
import * as ndlSearchUtil from "@/modules/ndlSearchUtil";
import openBdUtil from "@/modules/openBdUtil";
import axiosBase, { AxiosError } from "axios";
import util from "@/modules/util";
import { CacheUtil, CACHE_KEY } from "@/modules/cacheUtil";
const cacheUtil = new CacheUtil();

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_LAMBDA_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
  responseType: "json",
});
axios.interceptors.response.use(
  (response) => {
    // 成功時は普通にresponse返却
    return response;
  },
  (error: AxiosError) => {
    console.error(error);
    return null;
  }
);

export type ApiBook = {
  bookName: string | null;
  isbn: string | null;
  authorName: string | null;
  publisherName: string | null;
  coverUrl: string | null;
  publishedMonth: string | null; // YYYY/MM形式
  memo: string | null;
  isOnKadokawa: boolean;
};

type Publisher = {
  code: string;
  name: string;
  isOnKadokawa: boolean;
};
let publishers: Publisher[] = [];
// init処理 サーバから出版社マスタ取得
const setPublishers = async (pubs: Publisher[]) => {
  // どうせめったに更新しないし致命的でもないのでキャッシュの保存期間は半年あっても大丈夫
  const limitHours = 24 * 30 * 6;
  await cacheUtil.set(CACHE_KEY.PUBLISHERS, pubs, limitHours);
  publishers = pubs;
};
const fetchPublishers = async () => {
  console.log("bookutilApi:post:/publishers/fetch");
  const response = await axios.post("/publishers/fetch");
  if (response.data && response.data.publishers) {
    await setPublishers(response.data.publishers);
  }
};
const cachedPublishers = (await cacheUtil.get(CACHE_KEY.PUBLISHERS)) as
  | Publisher[]
  | null;
if (cachedPublishers) {
  await setPublishers(cachedPublishers);
} else {
  // マスタ取得非同期
  fetchPublishers();
}

const isEnoughApiBook = (apiBook: ApiBook | null) => {
  return (
    apiBook &&
    apiBook.bookName &&
    apiBook.isbn &&
    apiBook.authorName &&
    apiBook.publisherName &&
    apiBook.coverUrl &&
    apiBook.publishedMonth
  );
};

const findMasterPublisher = (isbn: string) => {
  // isbn10に変換
  const isbn10 = isbn.length === 10 ? isbn : util.isbn13To10(isbn);
  // 1文字目削除
  const headDeletedIsbn = isbn10.slice(1);
  return publishers.find((p) => headDeletedIsbn.startsWith(p.code));
};

export const getApiBook = async (isbn: string) => {
  let apiBook: ApiBook | null = null;

  const masterPublisher = findMasterPublisher(isbn);
  const masterPublisherName = masterPublisher ? masterPublisher.name : null;
  const isOnKadokawa = masterPublisher ? masterPublisher.isOnKadokawa : false;

  try {
    // 1.googleBooksApi
    const googleBook = await googleBooksUtil.getBook(isbn);
    if (googleBook) {
      apiBook = {
        ...googleBook,
        publisherName: masterPublisherName,
        isOnKadokawa,
      };
    }
  } catch (e) {
    console.error(e);
  }

  if (isEnoughApiBook(apiBook)) return apiBook;

  try {
    // 2.ndl
    const ndlBook = await ndlSearchUtil.getNdlBook(isbn);
    if (ndlBook) {
      if (apiBook) {
        if (!apiBook.bookName) {
          apiBook.bookName = ndlBook.bookName;
        }
        if (!apiBook.isbn) {
          apiBook.isbn = ndlBook.isbn;
        }
        if (!apiBook.authorName) {
          apiBook.authorName = ndlBook.authorName;
        }
        if (!apiBook.publisherName) {
          apiBook.publisherName = ndlBook.publisherName || masterPublisherName;
        }
        if (!apiBook.coverUrl) {
          apiBook.coverUrl = ndlBook.coverUrl;
        }
      } else {
        apiBook = {
          ...ndlBook,
          memo: null,
          isOnKadokawa,
        };
        if (!apiBook.publisherName) {
          apiBook.publisherName = masterPublisherName;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (isEnoughApiBook(apiBook)) return apiBook;

  try {
    // 3.openBD
    const openBdBook = await openBdUtil.getBookInfo(isbn);
    if (openBdBook) {
      if (apiBook) {
        if (!apiBook.bookName) {
          apiBook.bookName = openBdBook.bookName;
        }
        if (!apiBook.isbn) {
          apiBook.isbn = openBdBook.isbn;
        }
        if (!apiBook.authorName) {
          apiBook.authorName = openBdBook.authorName;
        }
        if (!apiBook.publisherName) {
          apiBook.publisherName = openBdBook.publisherName;
        }
        if (!apiBook.coverUrl) {
          apiBook.coverUrl = openBdBook.coverUrl;
        }
        if (!apiBook.publishedMonth) {
          apiBook.publishedMonth = openBdBook.publishedMonth;
        }
      } else {
        apiBook = {
          ...openBdBook,
          memo: null,
          isOnKadokawa,
        };
      }
    }
  } catch (e) {
    console.error(e);
  }

  return apiBook;
};
export const searchApiBooks = async (searchWord: string) => {
  const apiBooks: ApiBook[] = [];

  const googleBooks = await googleBooksUtil.searchBooks(searchWord);
  googleBooks.forEach((book) => {
    let masterPublisherName = null;
    let isOnKadokawa = false;
    if (book.isbn) {
      const masterPublisher = findMasterPublisher(book.isbn);
      masterPublisherName = masterPublisher ? masterPublisher.name : null;
      isOnKadokawa = masterPublisher ? masterPublisher.isOnKadokawa : false;
    }
    apiBooks.push({
      bookName: book.bookName,
      isbn: book.isbn,
      authorName: book.authorName,
      publisherName: masterPublisherName,
      coverUrl: book.coverUrl,
      memo: book.memo,
      publishedMonth: book.publishedMonth,
      isOnKadokawa,
    });
  });
  const ndlBooks = await ndlSearchUtil.searchNdlBooks(searchWord);
  ndlBooks.forEach((book) => {
    let masterPublisherName = null;
    let isOnKadokawa = false;
    if (book.isbn) {
      const masterPublisher = findMasterPublisher(book.isbn);
      masterPublisherName = masterPublisher ? masterPublisher.name : null;
      isOnKadokawa = masterPublisher ? masterPublisher.isOnKadokawa : false;
    }
    apiBooks.push({
      bookName: book.bookName,
      isbn: book.isbn,
      authorName: book.authorName,
      publisherName: book.publisherName || masterPublisherName,
      coverUrl: book.coverUrl,
      memo: null,
      publishedMonth: book.publishedMonth,
      isOnKadokawa,
    });
  });
  return apiBooks;
};
