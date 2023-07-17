# pathの設定しないとpyファイル読み込めない
import sys
sys.path.append("C:\\workspace\\bookutil\\lambda-sam\\modules_layer")


from modules_layer import util

def test_create_response_1():
    assert util.create_response("OK")["statusCode"] == 200
def test_create_response_2():
    assert util.create_response("BAD_REQUEST")["statusCode"] == 400
def test_create_response_3():
    assert util.create_response("UNAUTHORISZED")["statusCode"] == 401
def test_create_response_4():
    assert util.create_response("FORBIDDEN")["statusCode"] == 403
def test_create_response_5():
    assert util.create_response("NOT_FOUND")["statusCode"] == 404
def test_create_response_6():
    assert util.create_response("CONFLICT")["statusCode"] == 409
def test_create_response_7():
    assert util.create_response("INTERNAL_SERVER_ERROR")["statusCode"] == 500

def test_is_isbn_1():
    assert util.is_isbn("") == False
def test_is_isbn_2():
    assert util.is_isbn("1") == False
def test_is_isbn_3():
    assert util.is_isbn("123456789") == False
def test_is_isbn_D():
    assert util.is_isbn("1234567890") == True
def test_is_isbn_E():
    assert util.is_isbn("1234567891") == True
def test_is_isbn_4():
    assert util.is_isbn("123456789X") == True
def test_is_isbn_5():
    assert util.is_isbn("X23456789X") == False
def test_is_isbn_6():
    assert util.is_isbn("123456789Y") == False
def test_is_isbn_7():
    assert util.is_isbn("12345678901") == False
def test_is_isbn_8():
    assert util.is_isbn("123456789012") == False
def test_is_isbn_9():
    assert util.is_isbn("1234567890123") == True
def test_is_isbn_A():
    assert util.is_isbn("123456789012X") == False
def test_is_isbn_B():
    assert util.is_isbn("123456789X123") == False
def test_is_isbn_C():
    assert util.is_isbn("12345678901234") == False

def test_isbn_10_to_13_1():
    assert util.isbn_10_to_13(None) == None
def test_isbn_10_to_13_2():
    assert util.isbn_10_to_13("") == None
def test_isbn_10_to_13_3():
    assert util.isbn_10_to_13("415209205X") == "9784152092052"
def test_isbn_10_to_13_4():
    assert util.isbn_10_to_13("415209205Y") == None
def test_isbn_10_to_13_5():
    assert util.isbn_10_to_13("9784152092052") == "9784152092052"
def test_isbn_10_to_13_6():
    assert util.isbn_10_to_13("978415209205X") == None


from modules_layer import sql_util

def test_get_sql_1():
    assert sql_util.get_sql("fetch_toread") == sql_util.fetch_toread
def test_get_sql_2():
    assert sql_util.get_sql("fetch_toread_tag") == sql_util.fetch_toread_tag
def test_get_sql_3():
    assert sql_util.get_sql("create_toread_book") == sql_util.create_toread_book
def test_get_sql_4():
    assert sql_util.get_sql("create_toread_tag") == sql_util.create_toread_tag
def test_get_sql_5():
    assert sql_util.get_sql("is_create_unique_isbn") == sql_util.is_create_unique_isbn



from modules_layer import validation_util

def test_is_exist_1():
    assert validation_util.is_exist("") == False
def test_is_exist_2():
    assert validation_util.is_exist(None) == False
def test_is_exist_3():
    assert validation_util.is_exist("a") == True
def test_is_exist_4():
    assert validation_util.is_exist(1) == True
def test_is_exist_5():
    assert validation_util.is_exist(0) == True
def test_is_exist_6():
    assert validation_util.is_exist(True) == True
def test_is_exist_7():
    assert validation_util.is_exist(False) == True

def test_is_number_1():
    assert validation_util.is_number(None) == True
def test_is_number_E():
    assert validation_util.is_number(-1) == True
def test_is_number_2():
    assert validation_util.is_number(0) == True
def test_is_number_3():
    assert validation_util.is_number(1) == True
def test_is_number_4():
    assert validation_util.is_number(9) == True
def test_is_number_5():
    assert validation_util.is_number(1234567890) == True
def test_is_number_F():
    assert validation_util.is_number("-1") == True
def test_is_number_6():
    assert validation_util.is_number("0") == True
def test_is_number_7():
    assert validation_util.is_number("1") == True
def test_is_number_8():
    assert validation_util.is_number("9") == True
def test_is_number_9():
    assert validation_util.is_number("1234567890") == True
def test_is_number_A():
    assert validation_util.is_number("123456789X") == False
def test_is_number_B():
    assert validation_util.is_number("a") == False
def test_is_number_C():
    assert validation_util.is_number(True) == False
def test_is_number_D():
    assert validation_util.is_number(False) == False
def test_is_number_G():
    assert validation_util.is_number("－１") == False
def test_is_number_H():
    assert validation_util.is_number("０") == False
def test_is_number_I():
    assert validation_util.is_number("１") == False

def test_is_plus_1():
    assert validation_util.is_plus(None) == True
def test_is_plus_2():
    assert validation_util.is_plus(1) == True
def test_is_plus_3():
    assert validation_util.is_plus(99999999) == True
def test_is_plus_4():
    assert validation_util.is_plus(0) == False
def test_is_plus_5():
    assert validation_util.is_plus(-1) == False
def test_is_plus_6():
    assert validation_util.is_plus(-99999999) == False

def test_validation_util_is_isbn_1():
    assert validation_util.is_isbn(None) == True
def test_validation_util_is_isbn_2():
    assert validation_util.is_isbn("1") == False
def test_validation_util_is_isbn_3():
    assert validation_util.is_isbn("123456789") == False
def test_validation_util_is_isbn_4():
    assert validation_util.is_isbn("1234567890") == True
def test_validation_util_is_isbn_5():
    assert validation_util.is_isbn("1234567891") == True
def test_validation_util_is_isbn_6():
    assert validation_util.is_isbn("123456789X") == True
def test_validation_util_is_isbn_7():
    assert validation_util.is_isbn("X23456789X") == False
def test_validation_util_is_isbn_8():
    assert validation_util.is_isbn("123456789Y") == False
def test_validation_util_is_isbn_9():
    assert validation_util.is_isbn("12345678901") == False
def test_validation_util_is_isbn_A():
    assert validation_util.is_isbn("123456789012") == False
def test_validation_util_is_isbn_B():
    assert validation_util.is_isbn("1234567890123") == True
def test_validation_util_is_isbn_C():
    assert validation_util.is_isbn("123456789012X") == False
def test_validation_util_is_isbn_D():
    assert validation_util.is_isbn("123456789X123") == False
def test_validation_util_is_isbn_E():
    assert validation_util.is_isbn("12345678901234") == False

def test_is_url_1():
    assert validation_util.is_url(None) == True
def test_is_url_2():
    assert validation_util.is_url("") == False
def test_is_url_3():
    assert validation_util.is_url("h") == False
def test_is_url_4():
    assert validation_util.is_url("http://example.com") == True
def test_is_url_5():
    assert validation_util.is_url("https://example.com") == True
def test_is_url_6():
    assert validation_util.is_url("http:/example.com") == False
def test_is_url_7():
    assert validation_util.is_url("https:/example.com") == False
def test_is_url_8():
    assert validation_util.is_url("http//example.com") == False
def test_is_url_9():
    assert validation_util.is_url("https//example.com") == False
def test_is_url_A():
    assert validation_util.is_url("ttp://example.com") == False
def test_is_url_B():
    assert validation_util.is_url("ttps://example.com") == False

def test_is_valid_book_1():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": 1,
        "other_url": None,
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == True
def test_is_valid_book_2():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": 1,
        "other_url": None,
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == False
def test_is_valid_book_3():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": "a",
        "new_book_check_flg": 1,
        "other_url": None,
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == False
def test_is_valid_book_4():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": None,
        "other_url": None,
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == False
def test_is_valid_book_5():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": 1,
        "other_url": "test",
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == False
def test_is_valid_book_6():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": 1,
        "other_url": None,
        "page": -1,
        "publisher_name": None,
        "tags": None,
        "user": "REST_Client"
    }
    assert validation_util.is_valid_book(form) == False
def test_is_valid_book_7():
    form = {
        "access_token": "",
        "author_name": None,
        "book_name": "風の歌を聴け",
        "update_at": None,
        "id": None,
        "isbn": None,
        "new_book_check_flg": 1,
        "other_url": None,
        "page": None,
        "publisher_name": None,
        "tags": None,
        "user": None
    }
    assert validation_util.is_valid_book(form) == False



from modules_layer import models

def test_fetch_menus_1():
    assert len(models.fetch_menus(True)) == 3
def test_fetch_menus_2():
    assert len(models.fetch_menus(False)) == 1

def test_create_cover_url_1():
    assert models.create_cover_url("") == "/img/cover_placeholder.jpg"
def test_create_cover_url_2():
    assert models.create_cover_url(None) == "/img/cover_placeholder.jpg"
def test_create_cover_url_3():
    assert models.create_cover_url("a") == "/img/cover_placeholder.jpg"
def test_create_cover_url_4():
    assert models.create_cover_url("415209205X") == "https://cover.openbd.jp/9784152092052.jpg"
def test_create_cover_url_5():
    assert models.create_cover_url("415209205Y") == "/img/cover_placeholder.jpg"
def test_create_cover_url_6():
    assert models.create_cover_url("9784152092052") == "https://cover.openbd.jp/9784152092052.jpg"
def test_create_cover_url_7():
    assert models.create_cover_url("978415209205X") == "/img/cover_placeholder.jpg"