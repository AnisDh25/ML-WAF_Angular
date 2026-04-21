"""
MySQL Database Configuration for ML-WAF
Connection management and database utilities
"""

import os
import mysql.connector
from mysql.connector import Error
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import logging

# MySQL Database Configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '3306'),
    'database': os.environ.get('DB_NAME', 'waf_database'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '')
}

# Database URL for SQLAlchemy
DATABASE_URL = f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}?charset=utf8mb4"

class MySQLManager:
    """MySQL database manager for ML-WAF"""
    
    def __init__(self):
        self.engine = create_engine(DATABASE_URL, echo=False)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.logger = logging.getLogger(__name__)
    
    @contextmanager
    def get_connection(self):
        """Get a database connection context manager"""
        conn = None
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            conn.autocommit = False
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            self.logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn and conn.is_connected():
                conn.close()
    
    @contextmanager
    def get_cursor(self, dictionary=True):
        """Get a database cursor context manager"""
        with self.get_connection() as conn:
            try:
                cursor = conn.cursor(dictionary=dictionary)
                yield cursor
                conn.commit()
            except Exception as e:
                conn.rollback()
                self.logger.error(f"Database cursor error: {e}")
                raise
            finally:
                cursor.close()
    
    def test_connection(self):
        """Test database connection"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT VERSION();")
                    version = cursor.fetchone()
                    if version:
                        self.logger.info(f"Connected to MySQL: {version[0]}")
                    else:
                        self.logger.info("Connected to MySQL successfully")
                    return True
        except Exception as e:
            self.logger.error(f"Failed to connect to MySQL: {e}")
            return False
    
    def execute_query(self, query, params=None, fetch=True):
        """Execute a SQL query"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                if fetch:
                    return cursor.fetchall()
                return cursor.rowcount
        except Exception as e:
            self.logger.error(f"Query execution error: {e}")
            raise
    
    def execute_many(self, query, params_list):
        """Execute a query with multiple parameter sets"""
        try:
            with self.get_cursor() as cursor:
                cursor.executemany(query, params_list)
                return cursor.rowcount
        except Exception as e:
            self.logger.error(f"Batch execution error: {e}")
            raise

# Global database manager instance
db_manager = MySQLManager()

# Convenience functions
def get_db_session():
    """Get a database session"""
    session = db_manager.SessionLocal()
    try:
        yield session
    finally:
        session.close()

def init_database():
    """Initialize database tables"""
    try:
        # This will be expanded based on specific tables needed
        with db_manager.get_connection() as conn:
            with conn.cursor() as cursor:
                # Create database if it doesn't exist
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                conn.commit()
        return True
    except Exception as e:
        logging.error(f"Database initialization error: {e}")
        return False
