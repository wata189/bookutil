import axiosBase from "axios";

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_GOOGLE_BOOKS_UTIL
});

type GoogleBook = {
  bookName: string,
  isbn: string,
  authorName: string
};
type GoogleBookItem = {
  volumeInfo: {
    title: string,
    authors: string[],
    industryIdentifiers: [{
      type: string,
      identifier: string
    }]
  }
}

const searchBooks = async (searchWord:string):Promise<GoogleBook[]> => {
  let books:GoogleBook[] = [];
  try{
    const path = `/volumes?q=${searchWord}`;
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

        const authorName = volumeInfo.authors ? volumeInfo.authors.join(",") : "";
        
        return {
          isbn: isbns.length > 0 ? isbns[0] : "",
          bookName: volumeInfo.title,
          authorName
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
  searchBooks
}