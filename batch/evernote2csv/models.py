import re
from mysql_util import Mysql


def create_toread(form, mysql:Mysql):
    #bookテーブルにINSERT
    new_id = create_toread_book(form, mysql)
    #tagテーブルにINSERT
    create_toread_tag(new_id, form, mysql)
    return

def create_toread_book(form, mysql:Mysql):
    params = [
        form["book_name"],
        form["isbn"],
        form["author_name"],
        form["publisher_name"],
        form["page"],
        form["other_url"],
        form["new_book_check_flg"],
        form["user"],
        form["user"]
    ]
    new_id = mysql.insert("create_toread_book", params)
    return new_id

def create_toread_tag(id, form, mysql:Mysql):
    # /,スペースで分割
    # set→list変換で重複削除
    tags = list(set(re.split("[ 　/,]", form["tags"])))

    if len(tags) > 0:
        params = [ [id, tag] for tag in tags]
        mysql.insert_multi("create_toread_tag", params)

    return