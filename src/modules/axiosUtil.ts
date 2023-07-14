import axiosBase from "axios";

const axios = axiosBase.create({
  baseURL: import.meta.env.VITE_LAMBDA_URL,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
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
};
const post = async (path:string, params?:Object) => {
  try{
    console.log(`axios post:${path}`);

    return await axios.post(path, params);
  }catch(error){
    // TODO: エラーハンドリング共通化
    console.log(error);
  }
};

export default {
  get,
  post
}