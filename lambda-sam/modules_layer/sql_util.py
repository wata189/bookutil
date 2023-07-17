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

LEFT JOIN(
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

update_toread_book = """
UPDATE t_toread_book SET
    book_name = %s
    , isbn = %s
    , author_name = %s
    , publisher_name = %s
    , page = %s
    , other_url = %s
    , new_book_check_flg = %s
    , update_user = %s
    , update_at = CURRENT_TIMESTAMP
WHERE
    id = %s

"""

delete_physically_toread_tag = """
DELETE FROM t_toread_tag WHERE book_id = %s
"""

get_toread_book = """
SELECT * FROM t_toread_book WHERE id = %s AND delete_flg = 0
"""

is_update_unique_isbn = """
SELECT id FROM t_toread_book WHERE id != %s AND isbn = %s AND delete_flg = 0
"""

SQLS = {
    "fetch_toread": fetch_toread,
    "fetch_toread_tag": fetch_toread_tag,
    "create_toread_book": create_toread_book,
    "create_toread_tag": create_toread_tag,
    "update_toread_book": update_toread_book,
    "is_create_unique_isbn": is_create_unique_isbn,
    "delete_physically_toread_tag": delete_physically_toread_tag,
    "get_toread_book": get_toread_book,
    "is_update_unique_isbn": is_update_unique_isbn
}

def get_sql(sql_name):
    return SQLS[sql_name]