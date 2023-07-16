import axiosBase, { AxiosError, AxiosInstance } from "axios";

type ErrorData = {
  msg: string
};

class AxiosUtil{
  axios: AxiosInstance;

  // コンストラクタでエラーをハンドリングする関数設定
  constructor(errorFunction: (status:number, statusText:string, msg:string) => void){
    this.axios = axiosBase.create({
      baseURL: import.meta.env.VITE_LAMBDA_URL,
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      responseType: 'json'  
    });

    // インターセプターを利用したエラー処理ハンドリング
    this.axios.interceptors.response.use((response) => {
      // 成功時は普通にresponse返却
      return response;
    }, (error:AxiosError<ErrorData>) => {
      console.log(error);
      const status = error.response?.status || 500;
      const statusText = error.response?.statusText || "Server Error";
      const msg = error.response?.data?.msg || "不明なエラーが発生しました";
      // エラー内容をコンストラクタに設定した関数にわたす
      errorFunction(status, statusText, msg);
    });
  }

  async get(path:string, headerParams?:Object){
    console.log(`axios get:${path}`);
    return await this.axios.get(path, headerParams);
  }

  async post(path:string, params?:Object){
    console.log(`axios post:${path}`);
    return await this.axios.post(path, params);
  }
}

export default AxiosUtil