import jwt
import os

region = os.environ['AUTH_REGION']
user_pool_id = os.environ['AUTH_USER_POOL_ID']
client_id = os.environ['AUTH_CRIENT_ID']

issuer = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
jwks_url = f'{issuer}/.well-known/jwks.json'

# トークンが使えるか確認する処理
def isAuth(token:str):
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