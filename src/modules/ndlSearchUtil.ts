import axiosBase from "axios";
import util from "./util";


const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_NDL_SEARCH_UTIL
});

type NdlBook = {
  ndlId: string | null,
  bookName: string,
  isbn: string,
};

const searchBooks = async (isbn:string):Promise<NdlBook|null> => {
  let book:NdlBook|null = null;

  const path = `/opensearch?isbn=${isbn}`;
  console.log(`searchBooks:${path}`);

  try{
    const response = await axios.get(path);
    if(response && response.data){
      const searchResult:any = util.xml2json(response.data).rss.channel.item;

      const searchItem = searchResult[0] ? searchResult[0] : searchResult;

      // レスポンスから書誌IDを取得
      const ndlUrl:string = searchItem.guid._text;
      const ndlId:string | null = ndlUrl.split("/").pop() || null;
      const bookName:string = searchItem.title._text;

      book = { isbn, ndlId, bookName};
    }
  }catch(error) {
    console.log(error);
  }finally{
    return book;
  }
};

type ShortStory = {
  author: string|null,
  title: string
};
const searchShortStorys = async (isbn:string):Promise<ShortStory[]> => {
  let shortStorys:ShortStory[] = [];

  try{
    const ndlBook = await searchBooks(isbn);


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
    console.log(error);
  }finally{
    return shortStorys
  }

};
export default {
  searchBooks,
  searchShortStorys
}