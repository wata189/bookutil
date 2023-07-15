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
SQL_FETCH_TOREAD = """
SELECT 
    id
    , book_name
    , isbn
    , author_name
    , publisher_name
    , page
    , other_url
    , new_book_check_flg
    , create_user
    , create_at
    , update_user
    , update_at
    , delete_flg
    , tags
FROM(
    SELECT
        id
        , book_name
        , isbn
        , author_name
        , publisher_name
        , page
        , other_url
        , new_book_check_flg
        , create_user
        , create_at
        , update_user
        , update_at
        , delete_flg
    FROM
        bookutil.t_toread_book
    WHERE delete_flg = 0
) book

JOIN(
    SELECT book_id, GROUP_CONCAT(tag SEPARATOR "/") as tags
    FROM t_toread_tag
    WHERE delete_flg = 0
    GROUP BY book_id
) tag

ON book.id = tag.book_id
"""
def fetch_toread(is_auth, mysql):

    # DBから取得
    result = []
    if is_auth:
        result = mysql.select(SQL_FETCH_TOREAD)
    else:
        # TODO:isAuthがfalseの場合はモック用の本のみ表示する
        result = mysql.select(SQL_FETCH_TOREAD)

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
    # TODO: ISBNをチェック
    # isbnない場合はプレースホルダー
    cover_url = "/img/cover_placeholder.jpg"
    if isbn:
        cover_url = f"https://cover.openbd.jp/{util.isbn_10_to_13(isbn)}.jpg"
    return cover_url

SQL_FETCH_TOREAD_TAGS = """
SELECT tag FROM v_toread_tag
"""
def fetch_toread_tags(mysql):
    # DBから取得
    result = mysql.select(SQL_FETCH_TOREAD_TAGS)
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

SQL_CREATE_TOREAD_BOOK = """
INSERT INTO t_toread_book( 
      book_name
    , isbn
    , author_name
    , publisher_name
    , page
    , other_url
    , new_book_check_flg
    , create_user
    , update_user
) 
VALUES ( 
      %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
)
"""
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
    new_id = mysql.insert(SQL_CREATE_TOREAD_BOOK, params)
    return new_id

SQL_CREATE_TOREAD_TAG = """
INSERT INTO t_toread_tag (book_id, tag) VALUES (%s, %s)
"""
def create_toread_tag(id, form, mysql):
    # /,スペースで分割
    # set→list変換で重複削除
    tags = list(set(re.split("[ 　/,]", form["tags"])))

    if len(tags) > 0:
        params = [ [id, tag] for tag in tags]
        mysql.insert_multi(SQL_CREATE_TOREAD_TAG, params)

    return