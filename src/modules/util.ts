
import { Dark } from 'quasar';
import * as xml from "xml-js";

const OPEN_BD_COVER_URL:string = import.meta.env.VITE_OPEN_BD_COVER_URL;
const IMG_PLACEHOLDER_PATH = "img/cover_placeholder.jpg";

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

const isbn9To10 = (isbn9:string):string => {
  const sum = isbn9.split('').reduce((acc, c, i) => {
      return acc + Number(c[0]) * (10 - i);
  }, 0);
  let checkDigit = (11 - sum % 11).toString();
  if(checkDigit === "10"){
    checkDigit = "X";
  }
  if(checkDigit === "11"){
    checkDigit = "0";
  }

  return isbn9 + checkDigit;
};

const isbn12To13 = (isbn12: string):string => {
  // チェックディジット計算
  const sum = isbn12.split("").map((num:string, index:number) => {
    //ウェイトは1→3→1→3の順
    const coefficient = index % 2 === 0 ? 1 : 3;
    return Number(num) * coefficient;
  }).reduce((a:number, b:number) => a+b); //sum

  //10で割ったあまり出す
  const remainder = sum % 10;
  //あまりが0の場合は0、それ以外は10-あまり
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return isbn12 + checkDigit;
};

const isbn10To13 = (isbn10:string):string => {
  return isbn12To13("978" + isbn10.slice(0,-1));
};

const isbn13To10 = (isbn13:string):string => {
  return isbn9To10(isbn13.substring(3, 12));
};

const getOpenBdCoverUrl = (isbn:string):string => {
  if(!isIsbn(isbn))return IMG_PLACEHOLDER_PATH;

  const isbn13 = isbn.length === 13 ? isbn : isbn10To13(isbn);
  
  return `${OPEN_BD_COVER_URL}/${isbn13}.jpg`;
};

const xml2json = (xmlStr:string):any => {
  const dataStr:string = xml.xml2json(xmlStr, {compact: true});
  return JSON.parse(dataStr);
};

const fullNum2HalfMap:Record<string, string> = {
  "０": "0","１": "1","２": "2","３": "3","４": "4","５": "5","６": "6","７": "7","８": "8","９": "9",
  "Ａ": "A","Ｂ": "B","Ｃ": "C","Ｄ": "D","Ｅ": "E","Ｆ": "F","Ｇ": "G","Ｈ": "H","Ｉ": "I","Ｊ": "J","Ｋ": "K","Ｌ": "L","Ｍ": "M","Ｎ": "N","Ｏ": "O","Ｐ": "P","Ｑ": "Q","Ｒ": "R","Ｓ": "S","Ｔ": "T","Ｕ": "U","Ｖ": "V","Ｗ": "W","Ｘ": "X","Ｙ": "Y","Ｚ": "Z",
  "ａ": "a","ｂ": "b","ｃ": "c","ｄ": "d","ｅ": "e","ｆ": "f","ｇ": "g","ｈ": "h","ｉ": "i","ｊ": "j","ｋ": "k","ｌ": "l","ｍ": "m","ｎ": "n","ｏ": "o","ｐ": "p","ｑ": "q","ｒ": "r","ｓ": "s","ｔ": "t","ｕ": "u","ｖ": "v","ｗ": "w","ｘ": "x","ｙ": "y","ｚ": "z",
  "　": " ","！": "!","？": "?","（": "(","）": ")"
};
const fullStr2Half = (str:string):string => {
  return str.split("").map(char => fullNum2HalfMap[char] || char).join("");
};

export default {
  isIsbn,
  isExist,
  isUrl,
  strToTag,
  isDarkMode,
  isSmartPhone,
  formatDateToStr,
  getCurrentUrl,
  getIconHref,
  getOpenBdCoverUrl,
  isbn10To13,
  isbn13To10,
  isbn9To10,
  isbn12To13,
  xml2json,
  fullStr2Half
}