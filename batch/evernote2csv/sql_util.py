create_toread_book = """
INSERT INTO t_toread_book( 
      book_name
    , isbn
    , author_name
    , publisher_name
    , page
    , other_url
    , new_book_check_flg
    , create_user
    , update_user
) 
VALUES ( 
      %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
    , %s
)
"""

create_toread_tag = """
INSERT INTO t_toread_tag (book_id, tag) VALUES (%s, %s)
"""

SQLS = {
    "create_toread_book": create_toread_book,
    "create_toread_tag": create_toread_tag,
}

def get_sql(sql_name):
    return SQLS[sql_name]