import jwt
import os
import json


ENV = os.getenv('ENV')
USE_AUTH = True if os.getenv('USE_AUTH') == "True" else False 
IS_AUTH = True if os.getenv('IS_AUTH') == "True" else False 
region = os.getenv('AUTH_REGION')
user_pool_id = os.getenv('AUTH_USER_POOL_ID')
client_id = os.getenv('AUTH_CRIENT_ID')

issuer = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
jwks_url = f'{issuer}/.well-known/jwks.json'

# トークンが使えるか確認する処理
def is_auth(event:any):

    # 開発環境の場合は環境変数を見る
    if ENV == "dev" and not USE_AUTH:
        return IS_AUTH

    try:
        token = ""
        queryStringParameters = event.get("queryStringParameters")
        body = event.get("body")
        if queryStringParameters:
            token = queryStringParameters.get("access_token")
        elif body:
            json_body = json.loads(body)
            token = json_body.get("access_token")
        
        if not token:
            return


        jwks_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=issuer,
            options = dict(
                verify_aud=False
            )
        )
        if claims['client_id'] != client_id:
            print('client_id error')
            return False
        if claims['token_use'] != 'access':
            print('token_use error')
            return False
        else:
            return True
    except Exception as e:
        print(e)
        return False