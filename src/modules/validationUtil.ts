import util from "@/modules/util";

const isExist = (valName: string) => {
  return (val: unknown) => {
    return util.isExist(val) || `${valName}を入力してください`;
  };
};

const isNumber = (valName: string) => {
  return (val: unknown) => {
    if (!util.isExist(val)) {
      return true;
    }
    const regex = /^-?[0-9]*$/;
    return (
      regex.test(val as string) || `${valName}は半角数字で入力してください`
    );
  };
};

const isIsbn = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    return util.isIsbn(val) || `${valName}は10桁または13桁で入力してください`;
  };
};

const isUrl = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    return util.isUrl(val) || `${valName}はURLを入力してください`;
  };
};

const isEmail = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    const regex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
    return (
      regex.test(val.toString()) || `${valName}は不正な形式のメールアドレスです`
    );
  };
};
const isPassword = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    const regex = /^[a-zA-Z0-9.?/\-!"#$%&'()^~|@`{}[\]:*,<>_]{8,100}$/;
    return (
      regex.test(val.toString()) || `${valName}は不正な形式のパスワードです`
    );
  };
};

const isDateStr = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    const regex = /^\d{4}\/\d{2}\/\d{2}/;
    return regex.test(val) || `${valName}は/区切りで入力してください`;
  };
};
const isValidDate = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    const date = new Date(val);
    return (
      !isNaN(date.getDate()) || `${valName}は存在する日付を入力してください`
    );
  };
};

const isYearMonthStr = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }
    const regexYear = /^\d{4}$/;
    const regexYearMonth = /^\d{4}\/\d{2}$/;
    return (
      regexYear.test(val) ||
      regexYearMonth.test(val) ||
      `${valName}は/区切りで入力してください`
    );
  };
};
const isValidYearMonth = (valName: string) => {
  return (val: string) => {
    if (!util.isExist(val)) {
      return true;
    }

    const regexYear = /^\d{4}$/;
    const regexYearMonth = /^\d{4}\/(1[0-2]|0[1-9])$/;
    return (
      regexYear.test(val) ||
      regexYearMonth.test(val) ||
      `${valName}は存在する年月を入力してください`
    );
  };
};

export default {
  isExist,
  isNumber,
  isIsbn,
  isUrl,
  isEmail,
  isPassword,
  isDateStr,
  isValidDate,
  isYearMonthStr,
  isValidYearMonth,
};
