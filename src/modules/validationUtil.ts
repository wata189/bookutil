import util from "@/modules/util";

const isExist = (valName:string) => {
  return (val:any) => {
    return util.isExist(val) || `${valName}を入力してください`;
  };
};

const isNumber = (valName:string) => {
  return (val:any) => {
    if(!util.isExist(val)){return true;}
    const regex = /^-?[0-9]*$/;
    return regex.test(val.toString()) || `${valName}は半角数字で入力してください`;
  };
};

const isIsbn = (valName:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    return util.isIsbn(val) || `${valName}は10桁または13桁で入力してください`;
  };
};

const isUrl = (valName:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    return util.isUrl(val) || `${valName}はURLを入力してください`;
  };
};

const isEmail = (valName:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    const regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
    return regex.test(val.toString()) || `${valName}は不正な形式のメールアドレスです`;
  }
};
const isPassword = (valName:string) => {
  return (val:string) => {
    if(!util.isExist(val)){return true;}

    const regex = /^[a-zA-Z0-9.?/\-!"#$%&'()^~|@`\{\}\[\]:*,<>_]{8,100}$/;
    return regex.test(val.toString()) || `${valName}は不正な形式のパスワードです`;
  }
};


export default {
  isExist,
  isNumber,
  isIsbn,
  isUrl,
  isEmail,
  isPassword
}