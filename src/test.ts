import util from "./modules/util.ts";

describe.each([
  ["", false],
  ["1", false],
  ["123456789", false],
  ["1234567890", false],
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
  [validationUtil.isIsbn, "パラメータ", "1234567890", "パラメータは10桁または13桁で入力してください"],
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
  })
});