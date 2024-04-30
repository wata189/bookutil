import util from "@/modules/util";
import { CacheUtil } from '@/modules/cacheUtil';

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
};
const initApp = initializeApp(config);
const auth = getAuth(initApp);

const cacheUtil = new CacheUtil();

type User = {
  email:string
}
// トークン取得処理
const getIdToken = async ():Promise<string | null> =>{
  const idToken = await auth.currentUser?.getIdToken();
  return idToken || null;
};

// firebaseの読み込み処理が完了してから何かを行う処理
const waitAuthStateChanged = (func:Function) => {
  onAuthStateChanged(auth, (user) => {
    func(user);
  });
};

// アクセストークン→ユーザー情報を取得
const getUserInfo = ():User =>{
  const user = {email: ""};

  try{
    if(auth.currentUser && auth.currentUser.email){
      user.email = auth.currentUser.email;
    }
  }catch(error){
    console.log(error);
  }finally{
    return user;
  }
};
// ログイン
const login = (email:string, password:string):Promise<void> => {
  return new Promise((resolve, reject) => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async () => {
        // 認証成功した時
        console.log("login success")
        window.location.href = util.getCurrentUrl();
        resolve();
      })
      .catch(async (error) => {
        // ログイン失敗でキャッシュクリア
        await cacheUtil.refresh()
        // TODO:ログイン失敗したときエラーダイアログ投げる
        reject(error);
      });

  })
};
// ログアウト
const logout = async () => {
  await auth.signOut();
  // キャッシュ初期化
  await cacheUtil.refresh();
  // 画面更新
  window.location.href = util.getCurrentUrl();
};

export default {
  getIdToken,
  getUserInfo,
  login,
  logout,
  waitAuthStateChanged
}