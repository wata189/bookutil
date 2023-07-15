const openPageAsNewTab = (url:string) => {
  window.open(url, "_blank");
};

const isIsbn = (isbn: string):boolean => {
  const isbn10Regex = /^[0-9]{9}[1-9X]$/;
  const isbn13Regex = /^[0-9]{13}$/;
  return isbn10Regex.test(isbn) || isbn13Regex.test(isbn);
};

export default {
  openPageAsNewTab,
  isIsbn
}