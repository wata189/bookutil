import axios from "axios";
import util from "@/modules/util";

// 認証関係の定数
const authUrl = import.meta.env.VITE_AUTH_URL;
const clientId = import.meta.env.VITE_AUTH_CRIENT_ID;

const URL_OAUTH2_TOKEN = `${authUrl}/oauth2/token`;
const URL_OAUTH2_USERINFO = `${authUrl}/oauth2/userInfo`;

type User = {
  email:string
}
type Tokens = {
  accessToken: string,
  refreshToken: string
}
// トークン取得処理
const getToken = async (code: string):Promise<Tokens> =>{
  const tokens = {
    "accessToken": "",
    "refreshToken": ""
  };
  try{
    // code→アクセストークンを取得
    const currentUrl = util.getCurrentUrl();
    const params = {
      "grant_type": "authorization_code",
      "client_id": clientId,
      "redirect_uri": currentUrl,
      "code": code
    };
    const response = await axios.post(URL_OAUTH2_TOKEN, params, {headers: {"Content-Type": "application/x-www-form-urlencoded"}});
    if(response){
      const data = response.data;
      tokens.accessToken = data.access_token;
      tokens.refreshToken = data.refresh_token;
    }
  }catch(error){
    console.log(error);
  }finally{
    // トークンをローカルストレージに設定
    localStorage.accessToken = tokens.accessToken;
    localStorage.refreshToken = tokens.refreshToken;
    return tokens;
  }
} 

// アクセストークン→ユーザー情報を取得
const getUserInfo = async (accessToken: string):Promise<User> =>{
  const user = {email: ""};

  try{
    const userInfoHeaders = {
      "Authorization": `Bearer ${accessToken}`
    };
    const userResponse = await axios.get(URL_OAUTH2_USERINFO, {headers: userInfoHeaders});
    if(userResponse){
      user.email = userResponse.data.email;
    }
  }catch(error){
    console.log(error);

    try{
      // 1回refresh_token使ってaccess_token取得し直し
      const refreshToken = localStorage.refreshToken || "";
      const params = {
        "grant_type": "refresh_token",
        "client_id": clientId,
        "refresh_token": refreshToken
      };
      const response = await axios.post(URL_OAUTH2_TOKEN, params, {headers: {"Content-Type": "application/x-www-form-urlencoded"}});
      if(response){
        const data = response.data;
        localStorage.accessToken = data.access_token;
  
        // 取得したaccessTokenを使ってもう一度ユーザー情報取得
        const userInfoHeaders = {
          "Authorization": `Bearer ${data.access_token}`
        };
        const userResponse = await axios.get(URL_OAUTH2_USERINFO, {headers: userInfoHeaders});
        if(userResponse){
          user.email = userResponse.data.email;
        }
      }
    }catch(innerError){
      console.log(innerError);
    }
  }finally{
    return user;
  }
};
// ログイン
const login = () => {
  const currentUrl = util.getCurrentUrl();
  const url = `${authUrl}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+phone&redirect_uri=${currentUrl}&identity_provider=Google`;
  window.location.href = url;
};
// ログアウト
const logout = () => {
  // アクセストークン初期化
  localStorage.accessToken = "";
  localStorage.refreshToken = "";

  const currentUrl = util.getCurrentUrl();

  const url = `${authUrl}/logout?client_id=${clientId}&logout_uri=${currentUrl}`;
  window.location.href = url;
};

const getLocalStorageAccessToken = async ():Promise<string> => {
  let accessToken = localStorage.accessToken;
  if(!accessToken){

    const urlParams = (new URL(window.location.href)).searchParams;
    const code = urlParams.get("code");
  
    // トークン取得
    if(code){
      await getToken(code);
    }
    accessToken = localStorage.accessToken;
  }
  return accessToken || "";
};

export default {
  getToken,
  getUserInfo,
  login,
  logout,
  getLocalStorageAccessToken
}