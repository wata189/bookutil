import util
import re

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
            },
            {
                "name": "短編小説検索", 
                "to":"/shortstories",       
                "icon":"menu_book",
                "description": "短編集が収録している短編小説を検索します。"
            },
        ]
        menus += user_menus

    return menus


## toreadの本を取得する処理
## isAuthがfalseの場合はモック用の本のみ表示する
def fetch_toread(is_auth, mysql):

    # DBから取得
    result = mysql.select("fetch_toread")

    # モック用 ログインしていない場合はプログラミングタグを持つ本のみ表示
    if not is_auth:
        result = list(filter(lambda row: "プログラミング" in row["tags"], result))

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
            "tags":            row["tags"]
        } for row in result
    ]


    return toread_rows

# カバーのURLをISBNから取得
def create_cover_url(isbn:str):
    # isbnない場合はプレースホルダー
    cover_url = "/img/cover_placeholder.jpg"
    if isbn and util.is_isbn(isbn):
        cover_url = f"https://cover.openbd.jp/{util.isbn_10_to_13(isbn)}.jpg"
    return cover_url


def fetch_toread_tags(mysql):
    # DBから取得
    result = mysql.select("fetch_toread_tag")
    toread_tags = [row["tag"] for row in result]

    # dict→listに変換して重複を削除
    # setだと並び順が保証されないためdictを使用
    return list(dict.fromkeys(toread_tags))


def create_toread(form, mysql):
    #bookテーブルにINSERT
    new_id = create_toread_book(form, mysql)
    #tagテーブルにINSERT
    create_toread_tag(new_id, form, mysql)
    return

def update_toread(form, mysql):
    #TODO:bookテーブルUPDATE
    #TODO:tagテーブルいったんdelete
    #tagテーブルにINSERT
    create_toread_tag(form["id"], form, mysql)
    return

def create_toread_book(form, mysql):
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

def create_toread_tag(id, form, mysql):
    # /,スペースで分割
    # set→list変換で重複削除
    tags = list(set(re.split("[ 　/,]", form["tags"])))

    if len(tags) > 0:
        params = [ [id, tag] for tag in tags]
        mysql.insert_multi("create_toread_tag", params)

    return