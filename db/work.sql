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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci