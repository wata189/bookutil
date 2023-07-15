import pymysql.cursors
import os
from sql_util import get_sql

HOST        = os.getenv('MYSQL_HOST')
PORT        = int(os.getenv("MYSQL_PORT"))
USER        = os.getenv('MYSQL_USER')
PASSWORD    = os.getenv('MYSQL_PASSWORD')
DATABASE    = os.getenv('MYSQL_DATABASE')
CURSORCLASS = pymysql.cursors.DictCursor
CHARSET = "utf8"

class Mysql:
    def __init__(self, cursor) -> None:
        self.cursor = cursor

    def log_sql(self, sql, params):
        print(sql % tuple(params))

    # SQL実行の共通処理
    def execute(self, sql_name, params=[]):
        sql = self.get_sql(sql_name)
        self.log_sql(sql, params)
        self.cursor.execute(sql, params)

    # 取得
    def select(self, sql_name, params=[]):
        self.execute(sql_name, params)
        return self.cursor.fetchall()
    
    # 追加
    def insert(self, sql_name, values):
        return self.insert_multi(sql_name, [values])
    
    # 追加 複数行
    def insert_multi(self, sql_name, values):
        sql = self.get_sql(sql_name)
        self.log_sql(sql, values[0])
        self.cursor.executemany(sql, values)
        return self.cursor.lastrowid
    
    # 更新
    def update(self, sql_name, params=[]):
        self.execute(sql_name, params)
    
    # 論理削除
    def delete_logically(self, sql_name, params=[]):
        self.update(sql_name, params)
    
    # 物理削除
    def delete_physically(self, sql_name, params=[]):
        self.execute(sql_name, params)
        
    # SQLファイル取得
    def get_sql(self, sql_name):
        return get_sql(sql_name)
        

def tran(func):
    # データベース接続
    connection = pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DATABASE,
        cursorclass=CURSORCLASS,
        charset=CHARSET
    )

    ret = None
    # コネクション接続
    with connection:
        with connection.cursor() as cursor:
            # 引数で渡された処理を実際に行う
            ret = func(Mysql(cursor))
        # コミット
        connection.commit()
    return ret