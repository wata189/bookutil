import os
import requests
import urllib.parse

CALIL_URL = os.getenv('CALIL_URL')
CALIL_APP_KEY = os.getenv('CALIL_APP_KEY')

def check_calil_new_book(book, library):
    result = {
        "is_exist": False,
        "reserve_url": ""
    }

    # カーリルでチェック
    try:
        # 1回目の検索
        next_url = f"{CALIL_URL}/check"
        isbn = book["isbn"]
        systemid = library["id"]
        params = {
            "appkey": CALIL_APP_KEY,
            "isbn": isbn,
            "systemid": systemid,
            "format": "json",
            "callback": "no"
        }
        while params:
          json = requests.get(next_url, params).json()

          # continueの場合はセッション情報使ってもう一度処理する
          if json["continue"]:
            params = {
              "appkey": CALIL_APP_KEY,
              "session": json["session"],
              "format": "json",
              "callback": "no"
            }

          # 呼び出しが終了したら結果を格納
          else:
            params = None # paramsを空にしてループ終了

            calil_book = json["books"][isbn][systemid]

            if calil_book["libkey"] and len(calil_book["libkey"]) != 0:
              result["is_exist"] = True
              result["reserve_url"] = calil_book["reserveurl"]


          
          
    except Exception as e:
      print(e)
    finally:
      return result