import json
import util, validation_util, mysql_util, models, auth_util

## メニュー情報取得処理
def handler_fetch_menus(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    isAuth = auth_util.is_auth(token)

    menus = models.fetch_menus(isAuth)
    body = {
        "menus": menus
    }
    response = util.create_response("OK", body)
    return response


## toread初期化処理
def handler_init_toread(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    is_auth = auth_util.is_auth(token)

    def init_toread(mysql):
        toread_rows = models.fetch_toread(is_auth, mysql)
        toread_tags = models.fetch_toread_tags(mysql)

        body = {
            'toreadRows': toread_rows,
            'toreadTags': toread_tags
        }
        return util.create_response("OK", body)

    response = mysql_util.tran(init_toread)
    return response

## toread新規作成処理
def handler_create_toread(event, context):
    post_body = json.loads(event.get("body"))
    print(post_body)

    is_auth = auth_util.is_auth(post_body["access_token"])
    if not is_auth:
        return util.create_response("UNAUTHORISZED", msg="ログインをしてください")
    
    def create_toread(mysql):
        # バリデーション処理
        if not validation_util.is_valid_book(post_body):
            return util.create_response("BAD_REQUEST", msg="不正なパラメータがあります")
        # ISBN被りチェック
        if not validation_util.is_create_unique_isbn(post_body["isbn"], mysql):
            return util.create_response("BAD_REQUEST", msg="同じISBNの本があります")

        # DBに格納する
        models.create_toread(post_body, mysql)
        return util.create_response("OK")

    response = mysql_util.tran(create_toread)
    return response

def handler_test(event, context):
    post_body = json.loads(event.get("body"))
    print(post_body)
    body = {
        "body": event.get("body")
    }
    return util.create_response("OK", body=post_body)