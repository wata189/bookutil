import axiosBase from "axios";
import util from "@/modules/util";

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_GOOGLE_BOOKS_UTIL
});

type GoogleBook = {
  bookName: string | undefined,
  isbn: string | undefined,
  authorName: string,
  page: number | undefined,
  coverUrl: string | undefined,
  description: string | undefined
};
type GoogleBookItem = {
  volumeInfo: {
    title: string,
    authors: string[],
    industryIdentifiers: [{
      type: string,
      identifier: string
    }]
    pageCount: number | undefined,
    description: string | undefined,
    imageLinks: {
      smallThumbnail: string | undefined
      thumbnail: string | undefined
    }
  }
}

const getBook = async (isbn:string):Promise<GoogleBook | null> => {
  let book:GoogleBook | null = null;

  let isbn10 = "";
  let isbn13 = "";
  if(isbn.length === 10){
    isbn13 = util.isbn10To13(isbn);
    isbn10 = isbn;
  }else if(isbn.length === 13){
    isbn13 = isbn;
    isbn10 = util.isbn13To10(isbn);
  }

  const googleBooks = await searchBooks(`isbn:${isbn10}`);
  const googleBook = googleBooks.find(b => (b.isbn === isbn10 || b.isbn === isbn13));
  if(googleBook){
    book = googleBook;
  }else{
    const secondGoogleBooks = await searchBooks(`isbn:${isbn13}`);
    const secondGoogleBook = secondGoogleBooks.find(b => (b.isbn === isbn10 || b.isbn === isbn13));
    if(secondGoogleBook){
      book = secondGoogleBook;
    }
  }

  return book;
};

const searchBooks = async (searchWord:string):Promise<GoogleBook[]> => {
  let books:GoogleBook[] = [];
  try{
    const path = `/volumes?q=${searchWord}&key=${GOOGLE_BOOKS_API_KEY}`;
    console.log(`getBook:${path}`);

    const response = await axios.get(path);
    if(response && response.data && response.data.totalItems > 0){
      console.log(response.data)
      books = response.data.items.map((bookItem:GoogleBookItem) => {
        const volumeInfo = bookItem.volumeInfo;
        let isbns:string[] = [];
        if(volumeInfo.industryIdentifiers && volumeInfo.industryIdentifiers.length > 0){
          isbns = volumeInfo.industryIdentifiers.filter(identifier => {
            return identifier.type == "ISBN_10" || identifier.type == "ISBN_13";
          }).map(identifier => identifier.identifier);
        }

        const authorName = volumeInfo.authors && volumeInfo.authors.length > 0 ? volumeInfo.authors.join(",") : undefined;
        // 書影は小サムネ＞大サムネ＞空の順で設定する
        const coverUrl = volumeInfo.imageLinks ? (volumeInfo.imageLinks.smallThumbnail || volumeInfo.imageLinks.thumbnail) : undefined;
        
        return {
          isbn: isbns.length > 0 ? isbns[0] : undefined,
          bookName: volumeInfo.title,
          authorName,
          page: volumeInfo.pageCount,
          description: volumeInfo.description,
          coverUrl
        };
      });
    }

  }catch(error){
    console.log(error);
  }finally{
    return books;
  }
};

export default {
  searchBooks,
  getBook
}