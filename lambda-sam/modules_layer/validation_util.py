import re
import util

NOT_EXISTS = ["", None]
def is_exist(val):
    return not(val in NOT_EXISTS)

def is_number(val):
    if not is_exist(val): return True

    return not(not re.match("^[0-9]*$", str(val)))

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
def is_create_unique_isbn(isbn:str, mysql):
    # isbn空の場合は問題ない
    if not isbn: return True

    result = mysql.select("is_create_unique_isbn", [isbn])
    return len(result) == 0