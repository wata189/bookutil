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
INSERT INTO t_toread_tag (book_id, tag, create_user, update_user, update_at) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE update_user = VALUES(update_user), update_at = VALUES(update_at)
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

delete_toread_book = """
UPDATE t_toread_book SET delete_flg = 1, update_user = %s, update_at = CURRENT_TIMESTAMP
WHERE id IN (@WHERE_IN_PLACEHOLDER@)
"""

delete_toread_tag = """
UPDATE t_toread_tag SET delete_flg = 1, update_user = %s, update_at = CURRENT_TIMESTAMP
WHERE book_id IN (@WHERE_IN_PLACEHOLDER@)
"""

fetch_libraries = """
SELECT
    m_library.id
    , m_library.city
    , m_library.name
    , m_library.closest_station
    , m_library.url
    , m_library.map_url
    , m_library.order_num
    , m_library_business_hours.day_of_week
    , m_library_business_hours.is_open
    , m_library_business_hours.start_time
    , m_library_business_hours.end_time
FROM
    m_library
    
JOIN
    m_library_business_hours
ON
    m_library.id = m_library_business_hours.library_id

WHERE DAYOFWEEK(now()) - 1 = m_library_business_hours.day_of_week AND m_library.delete_flg = 0
ORDER BY
    m_library.order_num
"""

fetch_check_new_book_libraries = """
SELECT id, city, url, order_num
FROM m_library
WHERE new_book_check_flg = 1 AND delete_flg = 0
ORDER BY order_num
"""

fetch_check_new_book_toread_books = """
SELECT 
    id
    , book_name
    , isbn
    , author_name
    , publisher_name
    , page
    , other_url
    , new_book_check_flg
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
        t_toread_book
    WHERE delete_flg = 0 AND new_book_check_flg = 1 AND isbn IS NOT NULL
) book

LEFT JOIN(
    SELECT book_id, GROUP_CONCAT(tag SEPARATOR "/") as tags
    FROM t_toread_tag
    WHERE delete_flg = 0
    GROUP BY book_id
) tag

ON book.id = tag.book_id
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
    "is_update_unique_isbn": is_update_unique_isbn,
    "delete_toread_book": delete_toread_book,
    "delete_toread_tag": delete_toread_tag,
    "fetch_libraries": fetch_libraries,
    "fetch_check_new_book_libraries": fetch_check_new_book_libraries,
    "fetch_check_new_book_toread_books": fetch_check_new_book_toread_books
}

def get_sql(sql_name):
    return SQLS[sql_name]