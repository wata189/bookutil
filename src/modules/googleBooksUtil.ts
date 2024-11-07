import axiosBase, { AxiosResponse } from "axios";
import util from "@/modules/util";

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_GOOGLE_BOOKS_URL,
});

type GoogleBook = {
  bookName: string | null;
  isbn: string | null;
  authorName: string | null;
  coverUrl: string | null;
  publishedMonth: string | null;
  memo: string | null;
};
type GoogleBookItem = {
  volumeInfo: {
    title: string;
    authors: string[];
    industryIdentifiers: [
      {
        type: string;
        identifier: string;
      }
    ];
    publishedDate: string | undefined;
    pageCount: number | undefined;
    description: string | undefined;
    imageLinks: {
      smallThumbnail: string | undefined;
      thumbnail: string | undefined;
    };
  };
};

const getBook = async (isbn: string): Promise<GoogleBook | null> => {
  let book: GoogleBook | null = null;

  let isbn10 = "";
  let isbn13 = "";
  if (isbn.length === 10) {
    isbn13 = util.isbn10To13(isbn);
    isbn10 = isbn;
  } else if (isbn.length === 13) {
    isbn13 = isbn;
    isbn10 = util.isbn13To10(isbn);
  }

  const isbn10Path = `/volumes?q=isbn:${isbn10}&key=${GOOGLE_BOOKS_API_KEY}`;
  console.log(`getBook:${isbn10Path}`);

  let googleBooks: GoogleBook[] = [];
  const response = await axios.get(isbn10Path);
  if (response && response.data && response.data.totalItems > 0) {
    console.log(response.data);
    googleBooks = response2GoogleBooks(response);
  }
  const googleBook = googleBooks.find(
    (b) => b.isbn === isbn10 || b.isbn === isbn13
  );

  if (googleBook) {
    book = googleBook;
  } else {
    const isbn13Path = `/volumes?q=isbn:${isbn13}&key=${GOOGLE_BOOKS_API_KEY}`;
    console.log(`getBook:${isbn13Path}`);

    let googleBooks: GoogleBook[] = [];
    const response = await axios.get(isbn13Path);
    if (response && response.data && response.data.totalItems > 0) {
      console.log(response.data);
      googleBooks = response2GoogleBooks(response);
    }
    const secondGoogleBook = googleBooks.find(
      (b) => b.isbn === isbn10 || b.isbn === isbn13
    );
    if (secondGoogleBook) {
      book = secondGoogleBook;
    }
  }

  return book;
};

const searchBooks = async (
  bookName: string,
  authorName: string,
  publisherName: string
): Promise<GoogleBook[]> => {
  let books: GoogleBook[] = [];
  try {
    const queryParams: string[] = [];
    if (bookName) {
      queryParams.push(`intitle:${bookName}`);
    }
    if (authorName) {
      queryParams.push(`inauthor:${authorName}`);
    }
    if (publisherName) {
      queryParams.push(`inpublisher:${publisherName}`);
    }

    const path = `/volumes?q=${queryParams.join(
      "+"
    )}&key=${GOOGLE_BOOKS_API_KEY}`;
    console.log(`getBook:${path}`);

    const response = await axios.get(path);
    if (response && response.data && response.data.totalItems > 0) {
      console.log(response.data);
      books = response2GoogleBooks(response);
    }
  } catch (error) {
    console.log(error);
  }
  return books;
};

const response2GoogleBooks = (response: AxiosResponse): GoogleBook[] => {
  return response.data.items.map((bookItem: GoogleBookItem): GoogleBook => {
    const volumeInfo = bookItem.volumeInfo;
    let isbns: string[] = [];
    if (
      volumeInfo.industryIdentifiers &&
      volumeInfo.industryIdentifiers.length > 0
    ) {
      isbns = volumeInfo.industryIdentifiers
        .filter((identifier) => {
          return identifier.type == "ISBN_10" || identifier.type == "ISBN_13";
        })
        .map((identifier) => identifier.identifier);
    }

    const authorName =
      volumeInfo.authors && volumeInfo.authors.length > 0
        ? volumeInfo.authors.join(",")
        : null;
    // 書影は小サムネ＞大サムネ＞空の順で設定する
    const coverUrl = volumeInfo.imageLinks
      ? volumeInfo.imageLinks.smallThumbnail || volumeInfo.imageLinks.thumbnail
      : null;

    // googleBooksのpublishedDateはYYYY-MMかYYYY-MM-DD
    const publishedMonth = volumeInfo.publishedDate
      ? volumeInfo.publishedDate.slice(0, 7).replace("-", "/")
      : null;

    return {
      isbn: isbns.length > 0 ? isbns[0] : null,
      bookName: volumeInfo.title || null,
      authorName,
      memo: volumeInfo.description || null,
      coverUrl: toHttps(coverUrl || ""),
      publishedMonth,
    };
  });
};

const toHttps = (url: string) => {
  if (!url) {
    return url;
  }
  if (!url.startsWith("http:")) {
    return url;
  }

  return url.replace(/^http:/, "https:");
};

export default {
  searchBooks,
  getBook,
};
