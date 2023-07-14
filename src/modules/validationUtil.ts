
const isExist = (valName:string) => {
  return (val:any) => {
    return !!val || `${valName}を入力してください`;
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

    const isbn10Regex = /^[0-9]{9}[1-9X]$/;
    const isbn13Regex = /^[0-9]{13}$/;
    const isIsbn = isbn10Regex.test(val) || isbn13Regex.test(val);
  
    return isIsbn || `${valName}は10桁または13桁で入力してください`;
  };
};

const isUrl = (valName:string) => {
  return (val:string) => {
    if(!val){return true;}

    const httpRegex = /^http:\/\//;
    const httpsRegex = /^https:\/\//;
    const isUrl = httpRegex.test(val) || httpsRegex.test(val);

    return isUrl || `${valName}はURLを入力してください`;
  }
  


};


export default {
  isExist,
  isNumber,
  isIsbn,
  isUrl
}