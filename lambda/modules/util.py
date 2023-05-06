# ユーザーに応じてメニュー情報を返却する処理
def fetch_menus(isAuth: bool):
    menus = [
        {
            "name": "読みたいリスト", 
            "to":"/toread",       
            "icon":"mdi-format-list-bulleted-type",
            "description": "読みたい本をリスト化します。"
        }
    ]

    if isAuth:
        userMenus = [
            {
                "name": "図書館リスト", 
                "to":"/libraries",       
                "icon":"mdi-bank-outline",
                "description": "利用する図書館の一覧を表示します。"
            },
            {
                "name": "短編小説検索", 
                "to":"/shortstories",       
                "icon":"mdi-book-open-variant",
                "description": "短編集が収録している短編小説を検索します。"
            },
        ]
        menus += userMenus

    return menus
