import Dexie from 'dexie';

const dataBaseVer = 1;
const dataBaseName = "Cache";
const dataBaseTableName = "cacheTable";

const PERMANENT_CACHE_KEY = [
  "cache-accessToken",
  "cache-refreshToken"
];

interface Cache{
  key:string;
  limit: number | undefined;
  value: any;
}

class CacheUtil {
  cacheTable: Dexie.Table<Cache, string>;
  constructor(){
    const db = new Dexie(dataBaseName);
    db.version(dataBaseVer).stores({
      [dataBaseTableName]: "key"
    });
    this.cacheTable = db.table(dataBaseTableName) as Dexie.Table<Cache, string>;
  }

  /**
 * @param {string} key - キー
 * @param {any} value - バリュー
 * @param {number} [limitHours] - キャッシュの期限（時間単位）
 */
  async set(key: string, value: any, limitHours?:number){
    // キャッシュ期限の計算
    let limit:number | undefined = undefined;
    if(limitHours){
      limit = (new Date()).getTime();
      limit += limitHours * 60 * 60 * 1000;
    }

    const cache:Cache = {
      key, value, limit
    };
    await this.cacheTable.put(cache);
  }

  async get(key: string){
    let value:any = null;
    const cache = await this.cacheTable.get(key);
    if(cache){
      // 期限ありキャッシュで期限を超えている場合はキャッシュ削除
      if(cache.limit && cache.limit < new Date().getTime()){
        await this.delete(key);
      }else{
        // 期限なしのキャッシュの場合は普通に返却
        value = cache.value;
      }
    }
    return value;
  }

  async delete(key: string){
    return await this.cacheTable.delete(key);
  }

  //キャッシュを完全にリセットする処理
  async clear(){
    return await this.cacheTable.clear();
  }

  // キャッシュを一部を除いてリセットする処理
  // 一部→トークン情報など
  async refresh(){
    const allCaches: Cache[] = await this.cacheTable.toArray();
    const deleteCaches:Cache[] = allCaches.filter((cache:Cache) => {
      return !PERMANENT_CACHE_KEY.includes(cache.key);
    });
    const promises:Promise<void>[] = [];
    for (const cache of deleteCaches){
      promises.push(this.delete(cache.key));
    }
    return Promise.all(promises);
  }

}

export{
  CacheUtil
}