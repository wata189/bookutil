print("start format_csv")

from lxml import etree
import os
import csv
import shutil



BASE_PATH = "./batch/evernote2csv/"
OLD_PATH = BASE_PATH + "_old"
CSV_PATH = BASE_PATH + "bookinfo_2.csv"
FORMATTED_CSV_PATH = BASE_PATH + "bookinfo_3.csv"

# csv読み込み
write_rows = []
with open(CSV_PATH, encoding='utf8', newline='') as f:
    csvreader = csv.reader(f)
    # 整形
    for row in csvreader:
        if row[0] == '': continue

        splited_isbn = row[4].split("/?coliid")

        write_rows.append([
            row[0],
            row[1],
            row[2],
            row[3].replace("本/", ""),
            splited_isbn[0],
            row[5]
        ])





# csv書き込み
with open(FORMATTED_CSV_PATH, "a", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(write_rows)


# oldフォルダに移動
shutil.move(CSV_PATH, OLD_PATH)


print("end format_csv")