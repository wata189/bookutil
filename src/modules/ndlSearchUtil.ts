import axiosBase from "axios";
import util from "./util";

const NDL_SEARCH_URL = import.meta.env.VITE_NDL_SEARCH_URL

const axios = axiosBase.create({
  baseURL: NDL_SEARCH_URL + "/api"
});

export type NdlBook = {
  ndlId: string | null,
  bookName: string,
  isbn: string | null,
  authorName: string,
  publisherName: string,
  page: number,
  coverUrl: string
};

export const getNdlBook = async (isbn:string):Promise<NdlBook|null> => {
  let book:NdlBook|null = null;

  const path = `/opensearch?isbn=${isbn}`;
  console.log(`getNdlBooks:${path}`);

  try{
    const response = await axios.get(path);
    if(response && response.data){
      const searchResult:any = util.xml2json(response.data).rss.channel.item;

      const ndlItem = searchResult[0] ? searchResult[0] : searchResult;
      book = ndlItem2NdlBook(ndlItem);
    }
  }catch(error) {
    console.error(error);
  }finally{
    return book;
  }
};

export const searchNdlBooks = async (searchWord:string) => {
  let ndlBooks:NdlBook[] = [];
  const formatted = searchWord.replace(/　/g, " "); // 全角スペースあるとエラー出るので半角にする
  const path = `/opensearch?any=${formatted}&cnt=50`;
  console.log(`getNdlBooks:${path}`);
  try {
    const response = await axios.get(path);
    if(response && response.data){
      ndlBooks = xml2NdlBooks(response.data)
    }
  }catch(error) {
    console.error(error);
  }finally{
    return ndlBooks;
  }
};

const xml2NdlBooks = (xml:string):NdlBook[] => {
  const ndlBooks:NdlBook[] = [];
  const ndlItems:any[] = util.xml2json(xml).rss.channel.item;
  for(const ndlItem of ndlItems){
    const ndlBook = ndlItem2NdlBook(ndlItem);
    if(ndlBook){
      ndlBooks.push(ndlBook);
    }
  }
  return ndlBooks;
};
const ndlItem2NdlBook = (ndlItem:any):NdlBook | null => {
  let ndlBook = null
  // レスポンスから書誌IDを取得
  try{
    const ndlUrl:string = ndlItem.guid._text;
    const ndlId:string | null = ndlUrl.split("/").pop() || null;
    const bookName:string = ndlItem.title._text;
    let authorName = "";
    // 配列の場合がある
    if(ndlItem["dc:creator"][0]){
      authorName = ndlItem["dc:creator"].map((creatorItem:any) => {
        return creatorItem._text.replaceAll(",", "").replaceAll(" ", "");
      }).join(", ");
    }else{
      authorName = ndlItem["dc:creator"]._text.replaceAll(",", "").replaceAll(" ", "");
    }
    authorName = authorName.replace(/[0-9\-]/g, "");
    const publisherName:string = ndlItem["dc:publisher"]._text;
    const page:number = Number(ndlItem["dc:extent"]._text.replace("p", ""));
  
    let isbn = "";
    if(ndlItem["dc:identifier"]){
      for(const identifier of ndlItem["dc:identifier"]){
        if(identifier._attributes["xsi:type"] === "dcndl:ISBN"
          || identifier._attributes["xsi:type"] === "dcndl:ISBN13"
        ){
          isbn = identifier._text.replaceAll("-", "")
          break;
        }
      }
    }else{
      if(ndlItem["dc:identifier"]._attributes["xsi:type"] === "dcndl:ISBN"
        || ndlItem["dc:identifier"]._attributes["xsi:type"] === "dcndl:ISBN13"
      ){
        isbn = ndlItem["dc:identifier"]._text.replaceAll("-", "")
      }
    }

    if(isbn){
      const isbn13 = isbn.length === 13 ? isbn : util.isbn10To13(isbn);
      const coverUrl:string = `${NDL_SEARCH_URL}/thumbnail/${isbn13}.jpg`;
      ndlBook = { isbn, ndlId, bookName, authorName, publisherName, page, coverUrl };
    }
  }catch(error) {
    console.error(error);
  }finally{
    return ndlBook;
  }
};

type ShortStory = {
  author: string|null,
  title: string
};
export const searchNdlShortStorys = async (isbn:string):Promise<ShortStory[]> => {
  let shortStorys:ShortStory[] = [];

  try{
    const ndlBook = await getNdlBook(isbn);


    if(ndlBook && ndlBook.ndlId){
      const path = `/oaipmh?verb=GetRecord&metadataPrefix=dcndl&identifier=oai:ndlsearch.ndl.go.jp:${ndlBook.ndlId}`;
      console.log(`searchShortStorys:${path}`);
      const response = await axios.get(path);
      if(response && response.data){
        const searchResult:any = util.xml2json(response.data);

        // レスポンスから短編小説名を取得
        const partInformations:any[] = searchResult["OAI-PMH"].GetRecord.record.metadata["rdf:RDF"]["dcndl:BibResource"][0]["dcndl:partInformation"];
        if(partInformations && partInformations.length > 0){
          shortStorys = partInformations.map((partInformation:any) => {
            const title:string = partInformation["rdf:Description"]["dcterms:title"]._text;
            const creatorObject = partInformation["rdf:Description"]["dc:creator"];
            let author:string|null = null;
            if(creatorObject && creatorObject._text){
              const creator:string = creatorObject._text;
              // 著って入ってる→アンソロジー
              if(creator.includes(" 著")){
                author = creator.split(" 著")[0];
              }else if(creator.includes(" 訳")){
                // 訳って入ってて著って入ってない→海外著者の短編集 authorは空でよい
              }else{
                author = creator;
              }
            }

            return {
              // トリム、全角数字→半角数字の整形
              author: author ? util.fullStr2Half(author).trim() : null, 
              title
            };
          });
        }
      }
    }

  }catch(error) {
    console.error(error);
  }finally{
    return shortStorys
  }

};