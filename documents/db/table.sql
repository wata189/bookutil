create database bookutil;


drop table if exists bookutil.t_toread_book;
create table bookutil.t_toread_book (
  id BIGINT not null auto_increment comment 'ID'
  , book_name VARCHAR(100) not null comment '書籍名'
  , isbn VARCHAR(13) comment 'ISBN'
  , author_name VARCHAR(100) comment '著者名'
  , publisher_name VARCHAR(100) comment '出版社名'
  , other_url TEXT comment 'その他URL'
  , create_user VARCHAR(100) default 'system' not null comment '作成者'
  , create_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '作成日時'
  , update_user VARCHAR(100) default 'system' not null comment '更新者'
  , update_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '更新日時'
  , delete_flg TINYINT default 0 not null comment '削除フラグ'
  , primary key (id)
);

drop table if exists bookutil.t_toread_tag;
create table bookutil.t_toread_tag (
  book_id BIGINT not null comment '書籍ID'
  , tag VARCHAR(100) not null comment 'タグ'
  , create_user VARCHAR(100) default 'system' not null comment '作成者'
  , create_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '作成日時'
  , update_user VARCHAR(100) default 'system' not null comment '更新者'
  , update_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '更新日時'
  , delete_flg TINYINT default 0 not null comment '削除フラグ'
  , primary key (book_id,tag)
  , FOREIGN KEY fkbook_id (book_id) REFERENCES bookutil.t_toread_book(id)
);

drop table if exists bookutil.m_library;
create table bookutil.m_library (
  id VARCHAR(100) not null comment 'ID'
  , city VARCHAR(100) not null comment '市'
  , name VARCHAR(100) not null comment '図書館名'
  , closest_station VARCHAR(100) comment '最寄り駅'
  , url TEXT not null comment '図書館URL'
  , map_url TEXT not null comment 'GoogleMapURL'
  , order_num INT not null comment '並び順'
  , create_user VARCHAR(100) default 'system' not null comment '作成者'
  , create_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '作成日時'
  , update_user VARCHAR(100) default 'system' not null comment '更新者'
  , update_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '更新日時'
  , delete_flg TINYINT default 0 not null comment '削除フラグ'
  , primary key (id)
);

drop table if exists bookutil.m_library_business_hours;
create table bookutil.m_library_business_hours (
  library_id VARCHAR(100) not null comment '図書館ID'
  , day_of_week INT not null comment '曜日'
  , is_open TINYINT default 1 not null comment '開館フラグ'
  , start_time VARCHAR(4) comment '開始時刻'
  , end_time VARCHAR(4) comment '終了時刻'
  , create_user VARCHAR(100) default 'system' not null comment '作成者'
  , create_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '作成日時'
  , update_user VARCHAR(100) default 'system' not null comment '更新者'
  , update_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '更新日時'
  , delete_flg TINYINT default 0 not null comment '削除フラグ'
  , primary key (library_id,day_of_week)
  , FOREIGN KEY fklibrary_id (library_id) REFERENCES bookutil.m_library(id)
);

drop table if exists bookutil.m_to_read_tag;
create table bookutil.m_to_read_tag (
  tag VARCHAR(100) not null comment 'タグ'
  , order_num INT default 0 not null comment '並び順'
  , create_user VARCHAR(100) default 'system' not null comment '作成者'
  , create_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '作成日時'
  , update_user VARCHAR(100) default 'system' not null comment '更新者'
  , update_at TIMESTAMP default CURRENT_TIMESTAMP not null comment '更新日時'
  , delete_flg TINYINT default 0 not null comment '削除フラグ'
  , primary key (tag)
);

-- ビュー作成
drop view if exists v_toread_tag;
create view v_toread_tag(tag)
AS
SELECT tag
FROM (
SELECT
    m_toread_tag.tag                                         -- タグ
    , m_toread_tag.order_num                                 -- 並び順
FROM
    m_toread_tag
WHERE m_toread_tag.delete_flg = 0

UNION

SELECT
    CONCAT(m_library.city, '図書館') as tag
    , m_library.order_num + 400 as order_num
FROM
    m_library
WHERE m_library.delete_flg = 0

UNION

SELECT
    tag
    , 1000 as order_num
FROM
    bookutil.t_toread_tag
WHERE
    t_toread_tag.delete_flg = 0
) tag
ORDER BY order_num;

--insert
insert into bookutil.t_toread_book(book_name,isbn,author_name,other_url,create_user,create_at,update_user,update_at,delete_flg) values 
    ('日本統計学会公式認定 統計検定 2級 公式問題集[2018〜2021年]','4788925559','日本統計学会
日本統計学','https://www.toukei-kentei.jp/','system',TIMESTAMP '2023-04-30 10:21:16.000','system',TIMESTAMP '2023-04-30 10:21:16.000','0')
  , ('「技術書」の読書術 達人が教える選び方・読み方・情報発信&共有のコツとテクニック','4798171549','増井 敏克
増井敏克',null,'system',TIMESTAMP '2023-04-30 10:22:10.000','system',TIMESTAMP '2023-04-30 10:22:10.000','0');

insert into bookutil.t_toread_tag(book_id,tag,create_user,create_at,update_user,update_at,delete_flg) values 
    (1,'統計学','system',TIMESTAMP '2023-04-30 10:36:55.000','system',TIMESTAMP '2023-04-30 10:36:55.000','0')
  , (1,'自然科学','system',TIMESTAMP '2023-04-30 10:36:45.000','system',TIMESTAMP '2023-04-30 10:36:45.000','0')
  , (2,'その他プログラミング','system',TIMESTAMP '2023-04-30 10:37:22.000','system',TIMESTAMP '2023-04-30 10:37:22.000','0')
  , (2,'プログラミング','system',TIMESTAMP '2023-04-30 10:37:09.000','system',TIMESTAMP '2023-04-30 10:37:09.000','0');