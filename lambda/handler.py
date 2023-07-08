import json
from modules import util, auth_util, mysql_util

## メニュー情報取得処理
def handler_fetch_menus(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    isAuth = auth_util.is_auth(token)

    menus = util.fetch_menus(isAuth)
    body = {
        "menus": menus
    }
    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response


## toread初期化処理
def handler_init_toread(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    is_auth = auth_util.is_auth(token)

    def init_toread(my_sql):
        toread_rows = util.fetch_toread(is_auth, my_sql)
        toread_tags = util.fetch_toread_tags(my_sql)
        return {
            'toreadRows': toread_rows,
            'toreadTags': toread_tags
        }

    body = mysql_util.tran(init_toread)

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response
