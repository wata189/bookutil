const IS_DEV = true; // 開発環境フラグ
const MENU_TITLE = IS_DEV ? "Bookutilに登録(開発環境)" : "Bookutilに登録";
const BOOKUTIL_ROOT_URL = IS_DEV ? "http://localhost:5173" : "" //TODO: 本番環境のURL
/**
 * 拡張機能インストール時の処理
 * インストール時のイベント関数で、コンテキストメニューを登録します。
 */
chrome.runtime.onInstalled.addListener(function () {
  const menu = chrome.contextMenus.create({
      type: "normal",
      id: "toBookutil",
      title: MENU_TITLE
  });
});
/**
* メニューが選択されたときの処理
* 選択されたメニューが関数の引数に渡される。
*/
chrome.contextMenus.onClicked.addListener(function (item, tab) {
  console.log("click menu");
  const tabId = tab && tab.id ? tab.id : 0; //tabIdを取得

  // クリックしたメニューによって処理振り分け
  switch(item.menuItemId){
    case "toBookutil":
      toBookutil(item.pageUrl, tabId);
      break;
  }
});

// isbn判定
const isIsbn = (isbn) => {
  const isbn10Regex = /^[0-9]{9}[0-9X]$/;
  const isbn13Regex = /^[0-9]{13}$/;
  return isbn10Regex.test(isbn) || isbn13Regex.test(isbn);
};

//画面を開く処理
const toBookutil = (pageUrl, tabId) => {
  console.log("toBookutil");

  // pageUrlからisbn取得
  const isbn = pageUrl.split("/").find((path) => isIsbn(path)) || "null"

  const url = `${BOOKUTIL_ROOT_URL}/toread?isbn=${isbn}`;
  chrome.tabs.create({
    active: true,
    url: url
  });

};