DROP TABLE IF EXISTS `m_library_business_hours`;
DROP TABLE IF EXISTS `m_library`;

CREATE TABLE `m_library` (
  `id` varchar(100) NOT NULL COMMENT 'ID',
  `city` varchar(100) NOT NULL COMMENT '市',
  `name` varchar(100) NOT NULL COMMENT '図書館名',
  `closest_station` varchar(100) DEFAULT NULL COMMENT '最寄り駅',
  `url` text NOT NULL COMMENT '図書館URL',
  `map_url` text NOT NULL COMMENT 'GoogleMapURL',
  `order_num` int NOT NULL COMMENT '並び順',
  `new_book_check_flg` tinyint NOT NULL DEFAULT '0' COMMENT '新刊チェックフラグ',
  `create_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '作成者',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日時',
  `delete_flg` tinyint NOT NULL DEFAULT '0' COMMENT '削除フラグ',
  PRIMARY KEY (`id`)
);

CREATE TABLE `m_library_business_hours` (
  `library_id` varchar(100) NOT NULL COMMENT '図書館ID',
  `day_of_week` int NOT NULL COMMENT '曜日',
  `is_open` tinyint NOT NULL DEFAULT '1' COMMENT '開館フラグ',
  `start_time` varchar(4) DEFAULT NULL COMMENT '開始時刻',
  `end_time` varchar(4) DEFAULT NULL COMMENT '終了時刻',
  `create_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '作成者',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日時',
  `delete_flg` tinyint NOT NULL DEFAULT '0' COMMENT '削除フラグ',
  PRIMARY KEY (`library_id`,`day_of_week`),
  CONSTRAINT `m_library_business_hours_ibfk_1` FOREIGN KEY (`library_id`) REFERENCES `m_library` (`id`)
);




DROP TABLE IF EXISTS `t_toread_tag`;
DROP TABLE IF EXISTS `t_toread_book`;

CREATE TABLE `t_toread_book` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `book_name` varchar(100) NOT NULL COMMENT '書籍名',
  `isbn` varchar(13) DEFAULT NULL COMMENT 'ISBN',
  `author_name` varchar(100) DEFAULT NULL COMMENT '著者名',
  `publisher_name` varchar(100) DEFAULT NULL COMMENT '出版社名',
  `page` int DEFAULT NULL COMMENT 'ページ数',
  `other_url` text COMMENT 'その他URL',
  `new_book_check_flg` tinyint NOT NULL DEFAULT '0' COMMENT '新刊チェックフラグ',
  `create_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '作成者',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日時',
  `delete_flg` tinyint NOT NULL DEFAULT '0' COMMENT '削除フラグ',
  PRIMARY KEY (`id`)
);

CREATE TABLE `t_toread_tag` (
  `book_id` bigint NOT NULL COMMENT '書籍ID',
  `tag` varchar(100) NOT NULL COMMENT 'タグ',
  `create_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '作成者',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日時',
  `delete_flg` tinyint NOT NULL DEFAULT '0' COMMENT '削除フラグ',
  PRIMARY KEY (`book_id`,`tag`),
  CONSTRAINT `t_toread_tag_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `t_toread_book` (`id`)
);

CREATE TABLE `m_toread_tag` (
  `tag` varchar(100) NOT NULL COMMENT 'タグ',
  `order_num` int NOT NULL DEFAULT '0' COMMENT '並び順',
  `create_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '作成者',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_user` varchar(100) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日時',
  `delete_flg` tinyint NOT NULL DEFAULT '0' COMMENT '削除フラグ',
  PRIMARY KEY (`tag`)
);

CREATE VIEW `v_toread_tag` AS 
SELECT `tag`
FROM (
    SELECT 
      `m_toread_tag`.`tag` AS `tag`,
      `m_toread_tag`.`order_num` AS `order_num` 
    FROM `m_toread_tag`
    WHERE (`m_toread_tag`.`delete_flg` = 0)
    
    UNION
    
    SELECT
      concat(`m_library`.`city`,'図書館') AS `tag`,
      (`m_library`.`order_num` + 400) AS `order_num` 
    FROM `m_library` 
    WHERE (`m_library`.`delete_flg` = 0)
    
    UNION
    
    SELECT 
      `t_toread_tag`.`tag` AS `tag`,
      1000 AS `order_num`
    FROM `t_toread_tag` 
    WHERE (`t_toread_tag`.`delete_flg` = 0)
  ) `tag`
ORDER BY `tag`.`order_num`