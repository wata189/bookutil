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
def fetch_toread(is_auth, my_sql):

    # DBから取得
    result = []
    if is_auth:
        result = my_sql.select(SQL_FETCH_TOREAD)
    else:
        # TODO:isAuthがfalseの場合はモック用の本のみ表示する
        result = my_sql.select(SQL_FETCH_TOREAD)

    toread_rows = [
        {
            "id":                 row["id"],
            "book_name":          row["book_name"],
            "isbn":               row["isbn"],
            "author_name":        row["author_name"],
            "publisher_name":     row["publisher_name"],
            "page":               row["page"],
            "other_url":          row["other_url"],
            "new_book_check_flg": row["new_book_check_flg"],
            "update_at":          row["update_at"].timestamp(),
            "tags":               row["tags"].split(TAG_SEPARATOR)
        } for row in result
    ]

    return toread_rows


SQL_FETCH_TOREAD_TAGS = """
SELECT tag FROM v_toread_tag
"""
def fetch_toread_tags(my_sql):
    # DBから取得
    result = my_sql.select(SQL_FETCH_TOREAD_TAGS)
    toread_tags = [row["tag"] for row in result]

    return list(dict.fromkeys(toread_tags))