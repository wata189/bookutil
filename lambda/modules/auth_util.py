import jwt
import os

ENV = os.environ['ENV']
USE_AUTH = True if os.environ['USE_AUTH'] == "True" else False 
IS_AUTH = True if os.environ['IS_AUTH'] == "True" else False 
region = os.environ['AUTH_REGION']
user_pool_id = os.environ['AUTH_USER_POOL_ID']
client_id = os.environ['AUTH_CRIENT_ID']

issuer = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
jwks_url = f'{issuer}/.well-known/jwks.json'

# トークンが使えるか確認する処理
def is_auth(token:str):

    # 開発環境の場合は環境変数を見る
    if ENV == "dev" and not USE_AUTH:
        return IS_AUTH

    try:
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