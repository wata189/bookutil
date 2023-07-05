print("start check_isbn")

from lxml import etree
import os
import csv
import shutil



BASE_PATH = "./batch/evernote2csv/"
CSV_PATH = BASE_PATH + "bookinfo_3.csv"
RESULT_PATH = BASE_PATH + "result_check_isbn.txt"

# csv読み込み
result = []
with open(CSV_PATH, encoding='utf8', newline='') as f:
    csvreader = csv.reader(f)
    # 整形
    isbns = []

    for row in csvreader:
        if row[0] == "": continue
        if row[4] in isbns:
            result.append(row)
        
        isbns.append(row[4])




# txt書き込み
with open(RESULT_PATH, "a", encoding="utf-8") as f:
    for line in result:
        f.write(line[0])
        f.write(" ")
        f.write(line[4])
        f.write("\n")



print("end check_isbn")