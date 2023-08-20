
import { Dark } from 'quasar';

const openPageAsNewTab = (url:string) => {
  window.open(url, "_blank");
};

const isIsbn = (isbn: string):boolean => {
  const isbn10Regex = /^[0-9]{9}[0-9X]$/;
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
  return window.matchMedia("(max-device-width: 600px)").matches;
}

const formatDateToStr = (date: Date, format: string) => {
  const symbol = {
    M: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
  };

  const formatted = format.replace(/(M+|d+|h+|m+|s+)/g, (v) =>
    ((v.length > 1 ? "0" : "") + symbol[v.slice(-1) as keyof typeof symbol]).slice(-2)
  );

  return formatted.replace(/(y+)/g, (v) =>
    date.getFullYear().toString().slice(-v.length)
  );
};

const getCurrentUrl = ():string => {
  // クエリパラメータは除外する
  return window.location.href.split("?")[0];
};

const getIconHref = ():string => {
  return import.meta.env.DEV ? "img/icon.dev.svg" : "img/icon.svg";
};

const trimString = (val:string|null):string|null => {
  return val ? val.trim() : null;
}

export default {
  openPageAsNewTab,
  isIsbn,
  isExist,
  isUrl,
  strToTag,
  isDarkMode,
  isSmartPhone,
  formatDateToStr,
  getCurrentUrl,
  getIconHref,
  trimString
}