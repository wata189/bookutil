import axios from 'axios';

// 認証関係の定数
const authUrl = import.meta.env.VITE_AUTH_URL;
const clientId = import.meta.env.VITE_AUTH_CRIENT_ID;
const redirectUrl = encodeURI(import.meta.env.VITE_APP_URL);
type User = {
  email:string
}
type Tokens = {
  idToken: string,
  accessToken: string
}
// トークン取得処理
const getToken = async (code: string):Promise<Tokens> =>{
  const tokens = {
    'idToken': '',
    'accessToken': ''
  };
  try{
    // code→アクセストークンを取得
    const params = {
      'grant_type': 'authorization_code',
      'client_id': clientId,
      'redirect_uri': redirectUrl,
      'code': code
    };
    const url = `${authUrl}/oauth2/token`;
    const response = await axios.post(url, params, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    if(response){
      const data = response.data;
      tokens.idToken = data.id_token;
      tokens.accessToken = data.access_token;
    }
  }catch(error){
    console.log(error);
  }finally{
    // トークンをローカルストレージに設定
    localStorage.accessToken = tokens.accessToken;
    localStorage.idToken = tokens.idToken;
    return tokens;
  }
} 

// アクセストークン→ユーザー情報を取得
const getUserInfo = async (accessToken: string):Promise<User> =>{
  const user = {email: ''};
  try{

    const userInfoUrl = `${authUrl}/oauth2/userInfo`;
    const userInfoHeaders = {
      'Authorization': `Bearer ${accessToken}`
    };
    const userResponse = await axios.get(userInfoUrl, {headers: userInfoHeaders});
    if(userResponse){
      user.email = userResponse.data.email;
    }
  

    return user;
  }catch(error){
    console.log(error);
    return user;
  }
};
// ログイン
const login = () => {
  const url = `${authUrl}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+phone&redirect_uri=${redirectUrl}&identity_provider=Google`;
  window.location.href = url;
};
// ログアウト
const logout = () => {
  // アクセストークン初期化
  localStorage.accessToken = "";
  localStorage.idToken = "";

  const url = `${authUrl}/logout?client_id=${clientId}&logout_uri=${redirectUrl}`;
  window.location.href = url;
};

const getLocalStorageAccessToken = ():string => {
  return localStorage.accessToken || '';
};

export default {
  getToken,
  getUserInfo,
  login,
  logout,
  getLocalStorageAccessToken
}