import json
import os
import re

# ステータスコード
STATUS_CODE = {
    "OK": 200,

    "BAD_REQUEST": 400,
    "UNAUTHORISZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "CONFLICT": 409,

    "INTERNAL_SERVER_ERROR": 500
}

def create_response(status_code_str:str, body={}, msg=""):
    print(f"{status_code_str} {msg} {body}")
    body["msg"] = msg
    response = {
        "statusCode": STATUS_CODE[status_code_str],
        "body": json.dumps(body),
        "headers": {
            'Content-type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-TOKEN',
            'Access-Control-Allow-Origin': os.getenv("CLIENT_URL"),
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            "Access-Control-Allow-Credentials": True,
        },
    }
    return response

def is_isbn(isbn: str):
    isbn_13_pattern = "^[0-9]{13}$"
    isbn_10_pattern = "^[0-9]{9}[1-9X]$"

    return not(not re.match(isbn_10_pattern, isbn)) or not(not re.match(isbn_13_pattern, isbn))

#isbn10桁→13桁への変換
def isbn_10_to_13(isbn:str):
    # nullの場合はnull返却
    if not isbn: return None
    # isbnじゃない場合はnull返却
    if not is_isbn(isbn): return None
    # 10桁じゃない場合はそのまま返す
    if len(isbn) != 10: return isbn

    # プレフィックスつけて末尾1桁を削除して12ケタに
    isbn_12 = "978" + isbn[:-1]

    #　チェックディジット計算
    sum = 0
    for i, chr in enumerate(isbn_12):
        # ウェイトは1→3→1→3の順
        coefficient = 1 if i % 2 == 0 else 3
        sum += int(chr) * coefficient
    
    #10で割ったあまり出す
    remainder = sum % 10
    
    #あまりが0の場合は0、それ以外は10-あまり
    check_digit = 0 if remainder == 0 else 10 - remainder

    return isbn_12 + str(check_digit)