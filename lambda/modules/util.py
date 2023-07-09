TAG_SEPARATOR = ","

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

## toreadの行を取得する処理
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
    SELECT book_id, GROUP_CONCAT(tag SEPARATOR ",") as tags
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
            "tags":            row["tags"].split(TAG_SEPARATOR)
        } for row in result
    ]

    return toread_rows

# カバーのURLをISBNから取得
def create_cover_url(isbn:str):
    # isbnない場合はプレースホルダー
    cover_url = "/img/cover_placeholder.jpg"
    if isbn:
        cover_url = f"https://cover.openbd.jp/{isbn_10_to_13(isbn)}.jpg"
    return cover_url        

#isbn10桁→13桁への変換
def isbn_10_to_13(isbn:str):
    # nullの場合はnull返却
    if not isbn: return None
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





SQL_FETCH_TOREAD_TAGS = """
SELECT tag FROM v_toread_tag
"""
def fetch_toread_tags(mysql):
    # DBから取得
    result = mysql.select(SQL_FETCH_TOREAD_TAGS)
    toread_tags = [row["tag"] for row in result]

    # 
    return list(dict.fromkeys(toread_tags))