import json
from modules import util

## メニュー情報取得処理
def handler_fetch_menus(event, context):
    # TODO:ユーザー情報を取得
    user = {
        id: 1
    }
    menus = util.fetch_menus(user)
    body = {
        "menus": menus
    }
    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response