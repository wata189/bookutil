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

    def select(self, sql, params=[]):
        self.cursor.execute(sql, params)
        return self.cursor.fetchall()
        
        

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