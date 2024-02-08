import axios from "axios";
import util from "@/modules/util";
import { CacheUtil } from '@/modules/cacheUtil';
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  ACCESS_TOKEN: "cache-accessToken",
  REFRESH_TOKEN: "cache-refreshToken"
};

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
  console.log("auth getToken");
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
    // ログインできなかった場合はキャッシュリセット
    await cacheUtil.clear();
  }finally{
    // トークンをキャッシュに設定
    await cacheUtil.set(CACHE_KEY.ACCESS_TOKEN, tokens.accessToken, 1);
    await cacheUtil.set(CACHE_KEY.REFRESH_TOKEN, tokens.refreshToken, 24);
    return tokens;
  }
} 
const refreshToken = async () => {
  console.log("auth refreshToken");
  let accessToken = "";
  try{
    // refresh_token使ってaccess_token取得し直し
    const tmpRefreshToken = await cacheUtil.get(CACHE_KEY.REFRESH_TOKEN);

    if(tmpRefreshToken){
      const params = {
        "grant_type": "refresh_token",
        "client_id": clientId,
        "refresh_token": tmpRefreshToken
      };
      const response = await axios.post(URL_OAUTH2_TOKEN, params, {headers: {"Content-Type": "application/x-www-form-urlencoded"}});
      if(response){
        const data = response.data;
        accessToken = data.access_token;
      }
    }
  }catch(e){
    console.log(e);
    // リフレッシュできなかった場合はキャッシュリセット
    await cacheUtil.clear();
  }finally{
    await cacheUtil.set(CACHE_KEY.ACCESS_TOKEN, accessToken, 1);
  }
};

// アクセストークン→ユーザー情報を取得
const getUserInfo = async (accessToken: string):Promise<User> =>{
  console.log("auth getUserInfo");
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
      // 1度リフレッシュトークンを使用してアクセストークンを復活させる
      await refreshToken();

      // 取得したaccessTokenを使ってもう一度ユーザー情報取得
      const accessToken = await cacheUtil.get(CACHE_KEY.ACCESS_TOKEN);
      const userInfoHeaders = {
        "Authorization": `Bearer ${accessToken}`
      };
      const userResponse = await axios.get(URL_OAUTH2_USERINFO, {headers: userInfoHeaders});
      if(userResponse){
        user.email = userResponse.data.email;
      }
    }catch(innerError){
      console.log(innerError);
      // リフレッシュできなかった場合はキャッシュリセット
      await cacheUtil.clear();
    }
  }finally{
    return user;
  }
};
// ログイン
const login = async () => {
  // キャッシュリフレッシュ
  await cacheUtil.refresh();
  const currentUrl = util.getCurrentUrl();
  const url = `${authUrl}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+phone&redirect_uri=${currentUrl}&identity_provider=Google`;
  window.location.href = url;
};
// ログアウト
const logout = async () => {
  // キャッシュ初期化
  await cacheUtil.clear();

  const currentUrl = util.getCurrentUrl();

  const url = `${authUrl}/logout?client_id=${clientId}&logout_uri=${currentUrl}`;
  window.location.href = url;
};

const getCacheAccessToken = async ():Promise<string> => {
  // アクセストークン取得するときには必ずリフレッシュする
  await refreshToken();
  const accessToken = await cacheUtil.get(CACHE_KEY.ACCESS_TOKEN);
  return accessToken || "";
};

export default {
  getToken,
  getUserInfo,
  login,
  logout,
  getCacheAccessToken
}