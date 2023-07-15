def is_valid_book(form, mysql):
    # TODO: バリデーション処理
    return True


# ISBN被りチェック 新規作成
def is_create_unique_isbn(isbn:str, mysql):
    # isbn空の場合は問題ない
    if not isbn: return True

    result = mysql.select("is_create_unique_isbn", [isbn])
    return len(result) == 0