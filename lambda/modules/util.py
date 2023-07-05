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
def fetch_toread(is_auth: bool):

    # TODO:DBから取得
    toread_rows = [
    ]

    return toread_rows


def fetch_toread_tags():
    # TODO:DBから取得
    toread_tags = [
        'よみたい',
        'すごくよみたい',
        '新刊チェック'
    ]

    return toread_tags