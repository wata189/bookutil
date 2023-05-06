import axiosBase from "axios";

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_LAMBDA_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  responseType: 'json'  
});

const get = async (path:string, headerParams?:Object) => {
  try{
    console.log(`axios get:${path}`);

    return await axios.get(path, headerParams);
  }catch(error){
    // TODO: エラーハンドリング共通化
    console.log(error);
  }
} 

export default {
  get
}