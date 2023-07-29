import mysql_util, models

def handler_check_new_book(event, context):
  print("check_new_book start")

  def check_new_book(mysql):
    print("check_new_book")
    # newBookCheckFlg立ってる図書館を取得
    libraries = models.fetch_check_new_book_libraries(mysql)
    
    # newBookCheckFlg立ってる本を取得
    toread_books = models.fetch_check_new_book_toread_books(mysql)

    # 図書館×本で検索
    search_results = models.check_new_book(toread_books, libraries, mysql)

    # 検索結果を送信
    models.send_search_results(search_results)
  
  mysql_util.tran(check_new_book)

  print("check_new_book end")
  return ""