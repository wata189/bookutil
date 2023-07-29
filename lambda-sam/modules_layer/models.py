import util
import re
from mysql_util import Mysql
import sql_util
import calil_util

# ユーザーに応じてメニュー情報を返却する処理
def fetch_menus(is_auth: bool):
    menus = [
        {
            "name": "読みたいリスト", 
            "to":"/toread",       
            "icon":"format_list_bulleted",
            "description": "読みたい本をリスト化します。"
        }
    ]

    if is_auth:
        user_menus = [
            {
                "name": "図書館リスト", 
                "to":"/libraries",       
                "icon":"account_balance",
                "description": "利用する図書館の一覧を表示します。"
            }
        ]
        menus += user_menus

    return menus


## toreadの本を取得する処理
## isAuthがfalseの場合はモック用の本のみ表示する
def fetch_toread(is_auth:bool, mysql:Mysql):

    # DBから取得
    result = mysql.select("fetch_toread")


    toread_rows = [
        {
            "id":              row["id"],
            "bookName":        row["book_name"],
            "isbn":            row["isbn"],
            "coverUrl":        create_cover_url(row["isbn"]),
            "authorName":      row["author_name"],
            "publisherName":   row["publisher_name"],
            "page":            row["page"],
            "otherUrl":        row["other_url"],
            "newBookCheckFlg": row["new_book_check_flg"],
            "updateAt":        row["update_at"].timestamp(),
            "tags":            row["tags"] or ""
        } for row in result
    ]

    # モック用 ログインしていない場合はプログラミングタグを持つ本のみ表示
    if not is_auth:
        toread_rows = list(filter(lambda row: "プログラミング" in row["tags"], toread_rows))

    return toread_rows

# カバーのURLをISBNから取得
def create_cover_url(isbn:str):
    # isbnない場合はプレースホルダー
    cover_url = "img/cover_placeholder.jpg"
    if isbn and util.is_isbn(isbn):
        cover_url = f"https://cover.openbd.jp/{util.isbn_10_to_13(isbn)}.jpg"
    return cover_url


def fetch_toread_tags(mysql:Mysql):
    # DBから取得
    result = mysql.select("fetch_toread_tag")
    toread_tags = [row["tag"] for row in result]

    # dict→listに変換して重複を削除
    # setだと並び順が保証されないためdictを使用
    return list(dict.fromkeys(toread_tags))


def create_toread(form, mysql:Mysql):
    #bookテーブルにINSERT
    new_id = create_toread_book(form, mysql)
    #tagテーブルにINSERT
    create_toread_tag(new_id, form, mysql)
    return

def update_toread(form, mysql:Mysql):
    #bookテーブルUPDATE
    update_toread_book(form, mysql)
    #tagテーブルいったんdelete
    delete_physically_toread_tag(form["id"], mysql)
    #tagテーブルにINSERT
    create_toread_tag(form["id"], form, mysql)
    return

def update_toread_book(form, mysql:Mysql):

    params = [
        form["book_name"],
        form["isbn"],
        form["author_name"],
        form["publisher_name"],
        form["page"],
        form["other_url"],
        form["new_book_check_flg"],
        form["user"],
        form["id"]
    ]
    mysql.update("update_toread_book", params)
    return

def create_toread_book(form, mysql:Mysql):
    params = [
        form["book_name"],
        form["isbn"],
        form["author_name"],
        form["publisher_name"],
        form["page"],
        form["other_url"],
        form["new_book_check_flg"],
        form["user"],
        form["user"]
    ]
    new_id = mysql.insert("create_toread_book", params)
    return new_id

def create_toread_tag(id, form, mysql:Mysql):
    # /,スペースで分割
    # set→list変換で重複削除
    tags = [tag for tag in list(set(re.split("[ 　/,]", form["tags"]))) if tag != ""]

    user = form["user"]

    if len(tags) > 0:
        params = [ [id, tag, user, user] for tag in tags]
        mysql.insert_multi("create_toread_tag", params)

    return

def delete_physically_toread_tag(id, mysql:Mysql):
    params = [id]
    mysql.delete_physically("delete_physically_toread_tag", params)

def delete_toread(body, mysql:Mysql):
    #bookテーブル削除
    delete_toread_book(body, mysql)
    #tagテーブル論理削除（機械学習に使う可能性があるため）
    delete_toread_tag(body, mysql)
    return

def delete_toread_book(body, mysql:Mysql):
    delete_books = body["books"]
    user = body["user"]

    # パラメータを元にSQL生成
    # in句のため1度replaceが必要
    where_in_placeholder = ','.join(['%s'] * len(delete_books))
    sql = sql_util.get_sql("delete_toread_book").replace("@WHERE_IN_PLACEHOLDER@", where_in_placeholder)

    params = [delete_book["id"] for delete_book in delete_books]
    params.insert(0, user)
    mysql.execute(sql, params)

def delete_toread_tag(body, mysql:Mysql):
    delete_books = body["books"]
    user = body["user"]

    # パラメータを元にSQL生成
    # in句のため1度replaceが必要
    where_in_placeholder = ','.join(['%s'] * len(delete_books))
    sql = sql_util.get_sql("delete_toread_tag").replace("@WHERE_IN_PLACEHOLDER@", where_in_placeholder)

    params = [delete_book["id"] for delete_book in delete_books]
    params.insert(0, user)
    mysql.execute(sql, params)

def add_toread_tag(body, mysql:Mysql):
    for book in body["books"]:
        create_toread_tag(book["id"], body, mysql)

    return

def fetch_libraries(mysql:Mysql):
    result = mysql.select("fetch_libraries")

    libraries = [{
        "id": row["id"],
        "city": row["city"],
        "name": row["name"],
        "closestStation": row["closest_station"],
        "url": row["url"],
        "mapUrl": row["map_url"],
        "dayOfWeek": row["day_of_week"],
        "isOpen": row["is_open"],
        "startTime": row["start_time"],
        "endTime": row["end_time"]
    } for row in result]

    return libraries

def fetch_check_new_book_libraries(mysql:Mysql):
    result = mysql.select("fetch_check_new_book_libraries")
    return result

def fetch_check_new_book_toread_books(mysql:Mysql):
    result = mysql.select("fetch_check_new_book_toread_books")
    return result

def check_new_book(books, libraries, mysql:Mysql):
    search_results = []

    for book in books:
        for library in libraries:
            book_tags = book["tags"].split("/")

            # 検索対象or検索対象より優先度の高い図書館のタグ入っていたら飛ばす
            city_tags = [
                tmp_library["city"] + "図書館"
                for tmp_library in libraries
                if tmp_library["order_num"] <= library["order_num"]
            ]

            is_searched = True in [city_tag in book_tags for city_tag in city_tags]
            
            if is_searched: continue


            # カーリルでチェック
            calil_result = calil_util.check_calil_new_book(book, library)

            # カーリルの結果あったら設定処理
            if not calil_result["is_exist"]: continue

            # タグ更新
            # 図書館未定タグと図書館タグすべてけす
            # 「図書館」という文字列が入るタグを削除すればよい
            update_tags = [tag for tag in book_tags if not "図書館" in tag]
            # 今の図書館タグ追加する
            update_tags.append(library["city"] + "図書館")

            # DB更新
            update_form = {
                "id": book["id"],
                "book_name": book["book_name"],
                "isbn": book["isbn"],
                "author_name": book["author_name"],
                "publisher_name": book["publisher_name"],
                "page": book["page"],
                "other_url": book["other_url"],
                # 最優先(order_numが0)の図書館だった場合は新刊チェックフラグ消す
                "new_book_check_flg": 0 if library["order_num"] == 0 else 1,
                "user": "check_new_book", # 更新ユーザーは独自のものにする
                "tags": "/".join(update_tags)
            }
            update_toread(update_form, mysql)

            search_results.append({
                "book": book,
                "library": library,
                "reserve_url": calil_result["reserve_url"]
            })
            # それ以下の図書館は検索しなくてよいのでbreak
            break


    return search_results

def send_search_results(search_results):
    #TODO: 検索結果をディスコで送信
    print(search_results)