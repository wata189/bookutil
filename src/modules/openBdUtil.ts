import axiosBase from "axios";

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_OPEN_BD_URL
});

type OpenBdBook = {
  bookName: string,
  isbn: string,
  authorName: string,
  publisherName: string,
  page: number
}
const getBookInfo = async (isbn:string):Promise<OpenBdBook | null> => {
  let book: OpenBdBook | null = null;
  try{
    const path = `/get?isbn=${isbn}`
    console.log(`getBookInfo:${path}`)

    const response = await axios.get(path);
    if(response && response.data && response.data[0]){
      const onix = response.data[0].onix
      const descriptiveDetail = onix.DescriptiveDetail;
      // 書名、PartNumber、サブタイトル、レーベルをbookNameに
      let bookName = descriptiveDetail.TitleDetail.TitleElement.TitleText.content;
      if(descriptiveDetail.TitleDetail.TitleElement.PartNumber){
        bookName += ` ${descriptiveDetail.TitleDetail.TitleElement.PartNumber}`
      }
      if(descriptiveDetail.TitleDetail.TitleElement.Subtitle){
        bookName += ` ${descriptiveDetail.TitleDetail.TitleElement.Subtitle.content}`
      }
      if(descriptiveDetail.Collection && descriptiveDetail.Collection.TitleDetail && descriptiveDetail.Collection.TitleDetail.TitleElement[0]){
        bookName += ` ${descriptiveDetail.Collection.TitleDetail.TitleElement[0].TitleText.content}`;
      }
      const author = descriptiveDetail.Contributor.find((contributor:any) => contributor.ContributorRole[0] === "A01");
      const authorName = author.PersonName.content;
      const publisherName = onix.PublishingDetail.Imprint.ImprintName;
      const page = Number(descriptiveDetail.Extent[0].ExtentValue)
      book = {
        isbn,
        bookName,
        authorName,
        publisherName,
        page
      };
    }

    console.log(book);
    return book;
  }catch(error){
    console.log(error);
    return book;
  }
};

export default {
  getBookInfo
}