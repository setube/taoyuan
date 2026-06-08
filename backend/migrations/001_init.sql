-- 桃源乡 AI 后端数据库迁移
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS taoyuan_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taoyuan_ai;

-- 设备注册表
CREATE TABLE IF NOT EXISTS devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL UNIQUE,
    token VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB;

-- 云端存档表
CREATE TABLE IF NOT EXISTS cloud_saves (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    slot INT NOT NULL DEFAULT 0,
    save_data MEDIUMTEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_device_slot (device_id, slot),
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB;

-- 对话历史表（长期记忆）
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    persona_id VARCHAR(20) NOT NULL DEFAULT '',
    role ENUM('system', 'player', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    game_day INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_persona (device_id, persona_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- 长期记忆时间线
CREATE TABLE IF NOT EXISTS memory_timeline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    day INT NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    trigger_type ENUM('periodic', 'milestone', 'affinity') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device (device_id)
) ENGINE=InnoDB;