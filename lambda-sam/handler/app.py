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


def init_toread(is_auth, mysql):
    toread_rows = models.fetch_toread(is_auth, mysql)
    toread_tags = models.fetch_toread_tags(mysql)

    body = {
        'toreadRows': toread_rows,
        'toreadTags': toread_tags
    }
    return util.create_response("OK", body)

## toread初期化処理
def handler_init_toread(event, context):
    # ユーザーが認証されているかを確認
    token = event.get('queryStringParameters').get('access_token')
    is_auth = auth_util.is_auth(token)

    response = mysql_util.tran(lambda mysql: init_toread(is_auth, mysql))
    return response

## toread新規作成処理
def handler_create_toread(event, context):
    body = json.loads(event.get("body"))
    print(body)

    is_auth = auth_util.is_auth(body["access_token"])
    # ログイン済みでも外部連携でもなければログインエラー
    if not is_auth and not body["is_external_cooperation"]:
        return util.create_response("UNAUTHORISZED", msg="ログインをしてください")
    
    def create_toread(mysql):
        # バリデーション処理
        if not validation_util.is_valid_book(body):
            return util.create_response("BAD_REQUEST", msg="不正なパラメータがあります")
        # ISBN被りチェック
        if not validation_util.is_create_unique_isbn(body["isbn"], mysql):
            return util.create_response("BAD_REQUEST", msg="同じISBNの本があります")

        # DBに格納する
        models.create_toread(body, mysql)
        return init_toread(is_auth, mysql)

    response = mysql_util.tran(create_toread)
    return response

## toread更新処理
def handler_update_toread(event, context):
    body = json.loads(event.get("body"))
    print(body)

    is_auth = auth_util.is_auth(body["access_token"])
    # ログイン済みででなければログインエラー
    if not is_auth:
        return util.create_response("UNAUTHORISZED", msg="ログインをしてください")
    # form情報以外のパラメータチェック
    if not validation_util.is_valid_update_book(body):
        return util.create_response("BAD_REQUEST", msg="不正なパラメータがあります")
    # バリデーションチェック
    if not validation_util.is_valid_book(body):
        return util.create_response("BAD_REQUEST", msg="不正なパラメータがあります")

    def update_toread(mysql):
        # ID存在チェック
        if not validation_util.is_exist_book_id(body["id"], mysql):
            return util.create_response("BAD_REQUEST", msg="本が削除されています")
        # ISBN被りチェック
        if not validation_util.is_update_unique_isbn(body["id"], body["isbn"], mysql):
            return util.create_response("BAD_REQUEST", msg="同じISBNの本があります")
        # コンフリクトチェック
        if not validation_util.is_not_conflict_book(body["id"], body["update_at"], mysql):
            return util.create_response("BAD_REQUEST", msg="本の情報が更新されています")

        # DBに格納する
        models.update_toread(body, mysql)
        return init_toread(is_auth, mysql)

    response = mysql_util.tran(update_toread)
    return response


## toread削除処理
def handler_delete_toread(event, context):
    body = json.loads(event.get("body"))
    print(body)

    is_auth = auth_util.is_auth(body["access_token"])
    # ログイン済みででなければログインエラー
    if not is_auth:
        return util.create_response("UNAUTHORISZED", msg="ログインをしてください")
    # パラメータチェック
    if not validation_util.is_valid_books(body):
        return util.create_response("BAD_REQUEST", msg="不正なパラメータがあります")

    def delete_toread(mysql):
        # ID存在チェック
        if not validation_util.is_exist_books_id(body["books"], mysql):
            return util.create_response("BAD_REQUEST", msg="本が削除されています")
        # コンフリクトチェック
        if not validation_util.is_not_conflict_books(body["books"], mysql):
            return util.create_response("BAD_REQUEST", msg="本の情報が更新されています")

        # DBに格納する
        models.delete_toread(body, mysql)
        return init_toread(is_auth, mysql)

    response = mysql_util.tran(delete_toread)
    return response