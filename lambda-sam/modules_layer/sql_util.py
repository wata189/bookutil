fetch_toread = """
SELECT 
    id
    , book_name
    , isbn
    , author_name
    , publisher_name
    , page
    , other_url
    , new_book_check_flg
    , create_user
    , create_at
    , update_user
    , update_at
    , delete_flg
    , tags
FROM(
    SELECT
        id
        , book_name
        , isbn
        , author_name
        , publisher_name
        , page
        , other_url
        , new_book_check_flg
        , create_user
        , create_at
        , update_user
        , update_at
        , delete_flg
    FROM
        bookutil.t_toread_book
    WHERE delete_flg = 0
) book

JOIN(
    SELECT book_id, GROUP_CONCAT(tag SEPARATOR "/") as tags
    FROM t_toread_tag
    WHERE delete_flg = 0
    GROUP BY book_id
) tag

ON book.id = tag.book_id
"""

fetch_toread_tag = """
SELECT tag FROM v_toread_tag
"""

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

is_create_unique_isbn = """
SELECT id, isbn FROM t_toread_book WHERE delete_flg = 0 AND isbn = %s
"""

SQLS = {
    "fetch_toread": fetch_toread,
    "fetch_toread_tag": fetch_toread_tag,
    "create_toread_book": create_toread_book,
    "create_toread_tag": create_toread_tag,
    "is_create_unique_isbn": is_create_unique_isbn
}

def get_sql(sql_name):
    return SQLS[sql_name]