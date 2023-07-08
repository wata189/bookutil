import pymysql.cursors
import os

HOST        = os.environ['MYSQL_HOST']
USER        = os.environ['MYSQL_USER']
PASSWORD    = os.environ['MYSQL_PASSWORD']
DATABASE    = os.environ['MYSQL_DATABASE']
CURSORCLASS = pymysql.cursors.DictCursor


class My_Sql:
    def __init__(self, cursor) -> None:
        self.cursor = cursor

    # SQL実行の共通処理
    def execute(self, sql, params=[]):
        self.cursor.execute(sql, params)

    # 取得
    def select(self, sql, params=[]):
        self.execute(sql, params)
        return self.cursor.fetchall()
    
    # 追加
    def insert(self, sql, values):
        self.cursor.executemany(sql, values)
    
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
        user=USER,
        password=PASSWORD,
        database=DATABASE,
        cursorclass=CURSORCLASS
    )

    ret = None
    # コネクション接続
    with connection:
        with connection.cursor() as cursor:
            # 引数で渡された処理を実際に行う
            ret = func(My_Sql(cursor))
        # コミット
        connection.commit()
    return ret