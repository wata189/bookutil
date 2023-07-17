
import { Dark } from 'quasar';

const openPageAsNewTab = (url:string) => {
  window.open(url, "_blank");
};

const isIsbn = (isbn: string):boolean => {
  const isbn10Regex = /^[0-9]{9}[1-9X]$/;
  const isbn13Regex = /^[0-9]{13}$/;
  return isbn10Regex.test(isbn) || isbn13Regex.test(isbn);
};

const NOT_EXISTS = ["", null, undefined]
const isExist = (val:any) => {
  return !NOT_EXISTS.includes(val);
};

const isUrl = (url:string):boolean => {
  return /^https?:\/\//.test(url);
};

const strToTag = (tagStr:string):string[] => {
  return tagStr.split(/[ 　\,\/]/)
                .filter(tag => tag); // 空文字排除
};

const isDarkMode = ():boolean => {
  return Dark.isActive;
};

const isSmartPhone = ():boolean => {
  return window.matchMedia('(max-width: 600px)').matches;
}

export default {
  openPageAsNewTab,
  isIsbn,
  isExist,
  isUrl,
  strToTag,
  isDarkMode,
  isSmartPhone
}