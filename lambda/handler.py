import json
from modules import util, authUtil

## メニュー情報取得処理
def handler_fetch_menus(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    isAuth = authUtil.isAuth(token)
    menus = util.fetch_menus(isAuth)
    body = {
        "menus": menus
    }
    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response