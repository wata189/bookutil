import pymysql.cursors
import os

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
    def execute(self, sql, params=[]):
        self.log_sql(sql, params)
        self.cursor.execute(sql, params)

    # 取得
    def select(self, sql, params=[]):
        self.execute(sql, params)
        return self.cursor.fetchall()
    
    # 追加
    def insert(self, sql, values):
        return self.insert_multi(sql, [values])
    
    # 追加 複数行
    def insert_multi(self, sql, values):
        self.log_sql(sql, values[0])
        self.cursor.executemany(sql, values)
        return self.cursor.lastrowid
    
    # 更新
    def update(self, sql, params=[]):
        self.execute(sql, params)
    
    # 論理削除
    def delete_logically(self, sql, params=[]):
        self.update(sql, params)
    
    # 物理削除
    def delete_physically(self, sql, params=[]):
        self.execute(sql, params)
        
        

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