import axiosBase, { AxiosError, AxiosInstance } from "axios";

// ステータスコード
const STATUS_CODE = {
    "OK": 200,

    "BAD_REQUEST": 400,
    "UNAUTHORISZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "CONFLICT": 409,

    "INTERNAL_SERVER_ERROR": 500
}

class AxiosUtil{
  axios: AxiosInstance;

  // コンストラクタでエラーをハンドリングする関数設定
  constructor(emits: (event:"show-error-dialog", ...args: any[]) => void){
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
    }, (error:AxiosError) => {
      console.log(error);
      const status = error.response?.status || null;
      const statusText = error.code || "Server Error";
      const data:any = error.response?.data;
      const msg = data?.msg || "不明なエラーが発生しました";

      // 404はNotFoundに飛ばす
      if(status === STATUS_CODE["NOT_FOUND"]){
        window.location.href = `404?status=${status}&statusText=${statusText}&msg=${msg}`;
        return;
      }

      // エラー内容を上のコンポーネントにemitする
      emits("show-error-dialog", status, statusText, msg);
    });
  }

  async get(path:string, headerParams?:Object){
    console.log(`axios get ${path.split("?")[0]}`);
    return await this.axios.get(path, headerParams);
  }

  async post(path:string, params?:Object){
    console.log(`axios post ${path}`);
    return await this.axios.post(path, params);
  }
}

export default AxiosUtil