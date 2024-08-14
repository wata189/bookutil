import { CacheUtil } from "@/modules/cacheUtil";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
};
const initApp = initializeApp(config);
const auth = getAuth(initApp);

const cacheUtil = new CacheUtil();

type UserData = {
  email: string;
};
// トークン取得処理
const getIdToken = async (): Promise<string | null> => {
  const idToken = await auth.currentUser?.getIdToken();
  return idToken || null;
};

// firebaseの読み込み処理が完了してから何かを行う処理
const waitAuthStateChanged = (func: (user: User | null) => void) => {
  onAuthStateChanged(auth, (user) => {
    func(user);
  });
};

// アクセストークン→ユーザー情報を取得
const getUserInfo = (): UserData => {
  const user = { email: "" };

  try {
    if (auth.currentUser && auth.currentUser.email) {
      user.email = auth.currentUser.email;
    }
  } catch (error) {
    console.log(error);
  }
  return user;
};
// ログイン
const login = (email: string, password: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async () => {
        // 認証成功した時
        console.log("login success");
        // ログイン成功時、キャッシュクリアして諸々読み込み直す
        await cacheUtil.clear();
        window.location.reload();
        resolve();
      })
      .catch(async (error) => {
        console.log(error);
        reject(error);
      });
  });
};
// ログアウト
const logout = async () => {
  await auth.signOut();
  // キャッシュ初期化
  await cacheUtil.clear();
  // 画面更新
  window.location.reload();
};

export default {
  getIdToken,
  getUserInfo,
  login,
  logout,
  waitAuthStateChanged,
};
