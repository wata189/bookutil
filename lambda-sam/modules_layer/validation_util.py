import re
from mysql_util import Mysql
import util

NOT_EXISTS = ["", None]
def is_exist(val):
    return not(val in NOT_EXISTS)

# TODO:てすとかく
def is_exist_array(val:list):
    if not is_exist(val): return True
    return len(val) > 0

def is_number(val):
    if not is_exist(val): return True

    return not(not re.match("^-?[0-9]*$", str(val)))

def is_plus(val):
    if not is_exist(val): return True

    return val > 0

def is_isbn(val):
    if not is_exist(val): return True

    return util.is_isbn(val)

def is_url(val):
    if val == "": return False
    if not is_exist(val): return True

    return not(not re.match("^https?://", val))

#TODO:テストかく
def is_valid_update_book(form):
    # バリデーション処理
    validation_result = [
        is_exist(form["id"]),
        is_number(form["id"]),
        is_exist(form["update_at"]),
        is_number(form["update_at"]),
    ]
    return not (False in validation_result)

def is_valid_book(form):
    # バリデーション処理
    validation_result = [
        is_exist(form["book_name"]),
        is_isbn(form["isbn"]),
        is_number(form["page"]),
        is_plus(form["page"]),
        is_url(form["other_url"]),
        is_exist(form["new_book_check_flg"]),
        is_exist(form["user"])
    ]
    return not (False in validation_result)


# ISBN被りチェック 新規作成
def is_create_unique_isbn(isbn, mysql:Mysql):
    # isbn空の場合は問題ない
    if not isbn: return True

    result = mysql.select("is_create_unique_isbn", [isbn])
    return len(result) == 0

def is_update_unique_isbn(bookId:str, isbn, mysql:Mysql):
    # isbn空の場合は問題ない
    if not isbn: return True

    # IDが異なりISBNが同じ本がある場合は
    result = mysql.select("is_update_unique_isbn", [bookId, isbn])
    return len(result) == 0

# ID存在チェック
def is_exist_book_id(bookId:str, mysql:Mysql):
    result = util.get_toread_book(bookId, mysql)
    return len(result) == 1

# コンフリクトチェック
def is_not_conflict_book(bookId:str, update_at:int, mysql:Mysql):
    result = util.get_toread_book(bookId, mysql)
    return result[0] and result[0]["update_at"].timestamp() == update_at

# TODO:てすとかく
def is_valid_books(body):
    # バリデーション処理
    validation_result = [
        is_exist(body["books"]),
        is_exist_array(body["books"]),
        is_exist(body["user"])
    ]
    for delete_book in body["books"]:
        validation_result.append(is_exist(delete_book["id"]))
        validation_result.append(is_number(delete_book["id"]))
        validation_result.append(is_exist(delete_book["update_at"]))
        validation_result.append(is_number(delete_book["update_at"]))


    return not (False in validation_result)

# ID存在チェック 複数
def is_exist_books_id(books, mysql:Mysql):
    result = True
    for book in books:
        result = is_exist_book_id(book["id"], mysql)
        if not result:break # False1件でもあったら終了

    return result

# コンフリクトチェック 複数
def is_not_conflict_books(books, mysql:Mysql):
    result = True
    for book in books:
        result = is_not_conflict_book(book["id"], book["update_at"], mysql)
        if not result:break # False1件でもあったら終了

    return result