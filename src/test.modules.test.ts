import util from "./modules/util.ts";

describe.each([
  ["", false],
  ["1", false],
  ["123456789", false],
  ["1234567890", true],
  ["1234567891", true],
  ["123456789X", true],
  ["X23456789X", false],
  ["123456789Y", false],
  ["12345678901", false],
  ["123456789012", false],
  ["1234567890123", true],
  ["123456789012X", false],
  ["123456789X123", false],
  ["12345678901234", false]
])("isIsbn(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isIsbn(param)).toBe(expected);
  })
});
describe.each([
  [-1, true],
  [0, true],
  [1, true],
  ["0", true],
  [true, true],
  [false, true],
  [[], true],
  [{}, true],
  
  ["", false],
  [null, false],
  [undefined, false]
])("isExist(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isExist(param)).toBe(expected);
  })
});
describe.each([
  ["", false],
  ["h", false],
  ["http://example.com", true],
  ["https://example.com", true],
  ["http:/example.com", false],
  ["https:/example.com", false],
  ["http//example.com", false],
  ["https//example.com", false],
  ["ttp://example.com", false],
  ["ttps://example.com", false],
])("isUrl(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isUrl(param)).toBe(expected);
  })
});
describe.each([
  ["", 0],
  ["1", 1],

  ["1/1", 2],
  ["1 1", 2],
  ["1　1", 2],
  ["1,1", 2],
  ["1,/ 　1", 2],

  [" 1 ", 1],
  ["/1/", 1],
  ["　1　", 1],
  [",a,", 1],

  ["1,1 1　1/1", 5],
  
])("strTotag(%p)", (param, expected) => {
  test(`length = ${expected}`, () => {
    expect(util.strToTag(param).length).toBe(expected);
  })
});
const testDate = new Date('1995-01-01T01:01:01');
describe.each([
  ["yy", testDate, "95"],
  ["yyyy", testDate, "1995"],
  ["M", testDate, "1"],
  ["MM", testDate, "01"],
  ["d", testDate, "1"],
  ["dd", testDate, "01"],
  ["h", testDate, "1"],
  ["hh", testDate, "01"],
  ["m", testDate, "1"],
  ["mm", testDate, "01"],
  ["s", testDate, "1"],
  ["ss", testDate, "01"],
  ["yyyyMMddhhmmss", testDate, "19950101010101"],
  ["yyyy/MM/dd hh:mm:ss", testDate, "1995/01/01 01:01:01"],
])("formatDateToStr(%p)", (format, date, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.formatDateToStr(date, format)).toBe(expected);
  })
});

describe.each([
  ["404891207", "4048912070"],
  ["480251105", "4802511051"],
  ["404680135", "4046801352"],
  ["429501007", "4295010073"],
  ["404703654", "4047036544"],
  ["406149575", "4061495755"],
  ["406257881", "4062578816"],
  ["404419110", "4044191107"],
  ["406156547", "4061565478"],
  ["482223917", "4822239179"],
  ["479817243", "479817243X"],
])("isbn9To10(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isbn9To10(param)).toBe(expected);
  })
});
describe.each([
  ["9784048912075", "4048912070"],
  ["9784802511056", "4802511051"],
  ["9784046801357", "4046801352"],
  ["9784295010074", "4295010073"],
  ["9784047036543", "4047036544"],
  ["9784061495753", "4061495755"],
  ["9784062578813", "4062578816"],
  ["9784044191108", "4044191107"],
  ["9784061565470", "4061565478"],
  ["9784822239176", "4822239179"],
  ["9784798172439", "479817243X"],
])("isbn13To10(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isbn13To10(param)).toBe(expected);
  })
});
describe.each([
  ["978404891207", "9784048912075"],
  ["978480251105", "9784802511056"],
  ["978404680135", "9784046801357"],
  ["978429501007", "9784295010074"],
  ["978404703654", "9784047036543"],
  ["978406149575", "9784061495753"],
  ["978406257881", "9784062578813"],
  ["978404419110", "9784044191108"],
  ["978406156547", "9784061565470"],
  ["978482223917", "9784822239176"],
  ["978479817243", "9784798172439"],
])("isbn12To13(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isbn12To13(param)).toBe(expected);
  })
});
describe.each([
  ["4048912070", "9784048912075"],
  ["4802511051", "9784802511056"],
  ["4046801352", "9784046801357"],
  ["4295010073", "9784295010074"],
  ["4047036544", "9784047036543"],
  ["4061495755", "9784061495753"],
  ["4062578816", "9784062578813"],
  ["4044191107", "9784044191108"],
  ["4061565478", "9784061565470"],
  ["4822239179", "9784822239176"],
  ["479817243X", "9784798172439"],
])("isbn10To13(%p)", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.isbn10To13(param)).toBe(expected);
  })
});

describe.each([
  ["1234567890あいうえおAbcdefg", "1234567890あいうえおAbcdefg"],
  ["１２３４５６７８９０", "1234567890"],
  ["Ａ　ｂｃｄｅｆｇ", "A bcdefg"],
  ["！？", "!?"]
])("fullStr2Half", (param, expected) => {
  test(`returns ${expected}`, () => {
    expect(util.fullStr2Half(param)).toBe(expected);
  })
});


import validationUtil from "./modules/validationUtil.ts";

describe.each([
  [validationUtil.isExist, "パラメータ", -1, true],
  [validationUtil.isExist, "パラメータ", 0, true],
  [validationUtil.isExist, "パラメータ", 1, true],
  [validationUtil.isExist, "パラメータ", "0", true],
  [validationUtil.isExist, "パラメータ", true, true],
  [validationUtil.isExist, "パラメータ", false, true],
  [validationUtil.isExist, "パラメータ", [], true],
  [validationUtil.isExist, "パラメータ", {}, true],
  
  [validationUtil.isExist, "パラメータ", "", "パラメータを入力してください"],
  [validationUtil.isExist, "パラメータ", null, "パラメータを入力してください"],
  [validationUtil.isExist, "パラメータ", undefined, "パラメータを入力してください"],

  [validationUtil.isExist, "", undefined, "を入力してください"],
  [validationUtil.isExist, "あ", undefined, "あを入力してください"],


  [validationUtil.isNumber, "パラメータ", null, true],
  [validationUtil.isNumber, "パラメータ", "", true],
  [validationUtil.isNumber, "パラメータ", undefined, true],
  
  [validationUtil.isNumber, "パラメータ", -1, true],
  [validationUtil.isNumber, "パラメータ", 0, true],
  [validationUtil.isNumber, "パラメータ", 1, true],
  [validationUtil.isNumber, "パラメータ", 9, true],
  [validationUtil.isNumber, "パラメータ", 1234567890, true],
  
  [validationUtil.isNumber, "パラメータ", "-1", true],
  [validationUtil.isNumber, "パラメータ", "0", true],
  [validationUtil.isNumber, "パラメータ", "1", true],
  [validationUtil.isNumber, "パラメータ", "9", true],
  [validationUtil.isNumber, "パラメータ", "1234567890", true],

  [validationUtil.isNumber, "パラメータ", "123456789X", "パラメータは半角数字で入力してください"],
  [validationUtil.isNumber, "パラメータ", "a", "パラメータは半角数字で入力してください"],
  [validationUtil.isNumber, "パラメータ", true, "パラメータは半角数字で入力してください"],  
  [validationUtil.isNumber, "パラメータ", false, "パラメータは半角数字で入力してください"],  
  [validationUtil.isNumber, "パラメータ", "－１", "パラメータは半角数字で入力してください"],  
  [validationUtil.isNumber, "パラメータ", "０", "パラメータは半角数字で入力してください"],  
  [validationUtil.isNumber, "パラメータ", "１", "パラメータは半角数字で入力してください"],

  [validationUtil.isNumber, "", "a", "は半角数字で入力してください"],
  [validationUtil.isNumber, "あ", "a", "あは半角数字で入力してください"],
])("%p(%p)(%p)", (func, valName, val, expected) => {
  test(`returns ${expected}`, () => {
    expect(func(valName)(val)).toBe(expected);
  })
})
describe.each([
  [validationUtil.isIsbn, "パラメータ", "", true],
  [validationUtil.isIsbn, "パラメータ", "1", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "123456789", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "1234567890", true],
  [validationUtil.isIsbn, "パラメータ", "1234567891", true],
  [validationUtil.isIsbn, "パラメータ", "123456789X", true],
  [validationUtil.isIsbn, "パラメータ", "X23456789X", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "123456789Y", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "12345678901", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "123456789012", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "1234567890123", true],
  [validationUtil.isIsbn, "パラメータ", "123456789012X", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "123456789X123", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "パラメータ", "12345678901234", "パラメータは10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "", "1", "は10桁または13桁で入力してください"],
  [validationUtil.isIsbn, "a", "1", "aは10桁または13桁で入力してください"],


  [validationUtil.isUrl, "パラメータ", "", true],
  [validationUtil.isUrl, "パラメータ", "h", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "http://example.com", true],
  [validationUtil.isUrl, "パラメータ", "https://example.com", true],
  [validationUtil.isUrl, "パラメータ", "http:/example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "https:/example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "http//example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "https//example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "ttp://example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "パラメータ", "ttps://example.com", "パラメータはURLを入力してください"],
  [validationUtil.isUrl, "", "h", "はURLを入力してください"],
  [validationUtil.isUrl, "あ", "h", "あはURLを入力してください"],
])("%p(%p)(%p)", (func, valName, val, expected) => {
  test(`returns ${expected}`, () => {
    expect(func(valName)(val)).toBe(expected);
  });
});
