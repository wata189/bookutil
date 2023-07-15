import util from "@/modules/util";

const NOT_EXISTS = ["", null, undefined]
const isExist = (valName:string) => {
  return (val:any) => {
    return !(NOT_EXISTS.includes(val)) || `${valName}を入力してください`;
  };
};

const isNumber = (valName:string) => {
  return (val:any) => {
    if(!val){return true;}
    const regex = /^[0-9]*$/;
    return regex.test(val.toString()) || `${valName}は半角数字で入力してください`;
  };
};

const isIsbn = (valName:string) => {
  return (val:string) => {
    if(!val){return true;}

    return util.isIsbn(val) || `${valName}は10桁または13桁で入力してください`;
  };
};

const isUrl = (valName:string) => {
  return (val:string) => {
    if(!val){return true;}

    return /^https?:\/\//.test(val) || `${valName}はURLを入力してください`;
  }
  


};


export default {
  isExist,
  isNumber,
  isIsbn,
  isUrl
}