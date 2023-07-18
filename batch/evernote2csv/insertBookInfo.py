print("start insertBookInfo")

import os
import csv
import shutil
from mysql_util import tran, Mysql
import models
import datetime

# 1回の実行で行う件数
LOOP_COUNT = 1028

BASE_PATH = "./batch/evernote2csv/"
OLD_PATH = BASE_PATH + "_old"
CSV_PATH = BASE_PATH + "remaining_20230718220002.csv"
NOW = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
INSERT_CSV_PATH = BASE_PATH + "insert_" + NOW + ".csv"
REMAINING_CSV_PATH = BASE_PATH + "remaining_" + NOW + ".csv"

# csv読み込み
write_rows = []
with open(CSV_PATH, encoding='utf8', newline='') as f:
  csvreader = csv.reader(f)
  for row in csvreader:
    if row[0] == '': continue
    write_rows.append(row)

# 読み込んだrowを、InsertするRowと残りのRowにわける
insert_rows = write_rows[:LOOP_COUNT]
remaining_rows = write_rows[LOOP_COUNT:]

forms = [
  {
    "book_name": insert_row[0],
    "isbn": insert_row[4] or None,
    "author_name": insert_row[1] or None,
    "publisher_name": insert_row[2] or None,
    "page": None,
    "other_url": insert_row[5] or None,
    "new_book_check_flg": 0,
    "user": "batch",
    "tags": insert_row[3] or ""
  } for insert_row in insert_rows
]

def insert(mysql:Mysql):
  # insertする
  for form in forms:
    models.create_toread(form, mysql)

  # insertしたRowをCSVに吐き出す
  with open(INSERT_CSV_PATH, "a", encoding="utf-8", newline="") as f:
      writer = csv.writer(f)
      writer.writerows(insert_rows)

  # 残りのRowをCSVに吐き出す
  with open(REMAINING_CSV_PATH, "a", encoding="utf-8", newline="") as f:
      writer = csv.writer(f)
      writer.writerows(remaining_rows)
      
  # oldフォルダに移動
  shutil.move(CSV_PATH, OLD_PATH)
  shutil.move(INSERT_CSV_PATH, OLD_PATH)

tran(insert)








print("end insertBookInfo")