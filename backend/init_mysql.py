#!/usr/bin/env python3
"""
MySQL Database Initialization Script for ML-WAF
Sets up database with specified credentials (root/admin)
"""

import mysql.connector
import os
import logging
from database_config import DB_CONFIG, db_manager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_database():
    """Create database if it doesn't exist"""
    try:
        # Connect to MySQL server (without specifying database)
        conn = mysql.connector.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        logger.info(f"Database '{DB_CONFIG['database']}' created successfully or already exists")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        return False

def initialize_tables():
    """Initialize all database tables and indexes"""
    try:
        logger.info("Initializing database tables...")
        
        # Test connection first
        if not db_manager.test_connection():
            logger.error("Failed to connect to database")
            return False
        
        # Initialize database (this will create tables and indexes)
        from logger_module import WAFLogger
        waf_logger = WAFLogger()
        
        logger.info("Database tables initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing tables: {e}")
        return False

def setup_permissions():
    """Set up appropriate permissions for database"""
    try:
        logger.info("Setting up database permissions...")
        
        # For MariaDB/MySQL, permissions are usually already set for the database owner
        # Skip permission setup for root user or if using default setup
        if DB_CONFIG['user'] == 'root':
            logger.info("Skipping permission setup for root user")
            return True
            
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Grant necessary permissions (MySQL specific)
        cursor.execute(f"GRANT ALL PRIVILEGES ON `{DB_CONFIG['database']}`.* TO '{DB_CONFIG['user']}'@'localhost'")
        cursor.execute("FLUSH PRIVILEGES")
        
        cursor.close()
        conn.close()
        
        logger.info("Database permissions set successfully")
        return True
    except Exception as e:
        logger.error(f"Error setting permissions: {e}")
        return False

def create_waf_tables():
    """Create WAF-specific tables with MySQL syntax"""
    try:
        logger.info("Creating WAF tables...")
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Create logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS waf_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip VARCHAR(45) NOT NULL,
                    method VARCHAR(10) NOT NULL,
                    url TEXT NOT NULL,
                    decision VARCHAR(20) NOT NULL,
                    risk_score DECIMAL(5,4),
                    ml_score DECIMAL(5,4),
                    reason TEXT,
                    user_agent TEXT,
                    response_code INT,
                    response_size INT,
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_ip (ip),
                    INDEX idx_decision (decision)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Create alerts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS waf_alerts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    ip VARCHAR(45),
                    url TEXT,
                    acknowledged BOOLEAN DEFAULT FALSE,
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_severity (severity)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Create blocked_ips table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS blocked_ips (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    ip VARCHAR(45) NOT NULL UNIQUE,
                    reason TEXT,
                    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    blocked_by VARCHAR(50),
                    INDEX idx_ip (ip)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Create users table for authentication
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL,
                    INDEX idx_username (username)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Insert default admin user if not exists
            cursor.execute("""
                INSERT IGNORE INTO users (username, email, password_hash, role) 
                VALUES ('admin', 'admin@waf.local', 'admin123_hash', 'admin')
            """)
            
            conn.commit()
            logger.info("WAF tables created successfully")
            return True
            
    except Exception as e:
        logger.error(f"Error creating WAF tables: {e}")
        return False

def main():
    """Main initialization function"""
    logger.info("Starting MySQL database initialization for ML-WAF")
    logger.info(f"Database: {DB_CONFIG['database']}")
    logger.info(f"User: {DB_CONFIG['user']}")
    logger.info(f"Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    
    # Step 1: Create database
    if not create_database():
        logger.error("Failed to create database")
        return False
    
    # Step 2: Create WAF tables
    if not create_waf_tables():
        logger.error("Failed to create WAF tables")
        return False
    
    # Step 3: Initialize additional tables
    if not initialize_tables():
        logger.error("Failed to initialize tables")
        return False
    
    # Step 4: Setup permissions
    if not setup_permissions():
        logger.error("Failed to setup permissions")
        return False
    
    logger.info("MySQL database initialization completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
