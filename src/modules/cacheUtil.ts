import Dexie from "dexie";

const dataBaseVer = 1;
const dataBaseName = "Cache";
const dataBaseTableName = "cacheTable";

const CACHE_KEY = {
  LIBRARIES: "cache-libraries",
  BOOKSHELF: "cache-bookshelf",
  BOOKS: "cache-toreadBooks",
  TAGS: "cache-toreadTags",
  TAGS_HISTORIES: "cache-tagsHistories",
  PUBLISHERS: "cache-publishers",
  ACCESS_TOKEN: "cache-accessToken",
  REFRESH_TOKEN: "cache-refreshToken",
  IS_DARK_MODE: "cache-isDarkMode",
};
const PERMANENT_CACHE_KEY = [
  CACHE_KEY.ACCESS_TOKEN,
  CACHE_KEY.REFRESH_TOKEN,
  CACHE_KEY.IS_DARK_MODE,
];

interface Cache {
  key: string;
  limit: number | undefined;
  value: unknown;
}

class CacheUtil {
  cacheTable: Dexie.Table<Cache, string>;
  constructor() {
    const db = new Dexie(dataBaseName);
    db.version(dataBaseVer).stores({
      [dataBaseTableName]: "key",
    });
    this.cacheTable = db.table(dataBaseTableName) as Dexie.Table<Cache, string>;
  }

  /**
   * @param {string} key - キー
   * @param {unknown} value - バリュー
   * @param {number} [limitHours] - キャッシュの期限（時間単位）
   */
  async set(key: string, value: unknown, limitHours?: number) {
    const defaultLimitHours = 24; // 引数ないときのデフォルトは24h
    // キャッシュ期限の計算
    const limit =
      new Date().getTime() + (limitHours || defaultLimitHours) * 60 * 60 * 1000;

    const cache: Cache = {
      key,
      value,
      limit,
    };
    await this.cacheTable.put(cache);
  }

  async get(key: string) {
    let value: unknown = null;
    const cache = await this.cacheTable.get(key);
    if (cache) {
      // 期限ありキャッシュで期限を超えている場合はキャッシュ削除
      if (cache.limit && cache.limit < new Date().getTime()) {
        await this.delete(key);
      } else {
        // 期限なしのキャッシュの場合は普通に返却
        value = cache.value;
      }
    }
    return value;
  }

  async delete(key: string) {
    return await this.cacheTable.delete(key);
  }

  // キャッシュを一部を除いてクリアする処理
  // ダークモード設定消さない
  async clear() {
    const allCaches: Cache[] = await this.cacheTable.toArray();
    const deleteCaches: Cache[] = allCaches.filter((cache: Cache) => {
      return !PERMANENT_CACHE_KEY.includes(cache.key);
    });
    const promises: Promise<void>[] = [];
    for (const cache of deleteCaches) {
      promises.push(this.delete(cache.key));
    }
    return Promise.all(promises);
  }
}

export { CacheUtil, CACHE_KEY };
