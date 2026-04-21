#!/usr/bin/env python3
"""
PostgreSQL to MySQL Migration Script for ML-WAF
Migrates data from PostgreSQL to MySQL database
"""

import psycopg2
import mysql.connector
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# PostgreSQL Configuration (old)
PG_CONFIG = {
    'host': os.environ.get('PG_HOST', 'localhost'),
    'port': os.environ.get('PG_PORT', '5432'),
    'database': os.environ.get('PG_DB_NAME', 'waf_database'),
    'user': os.environ.get('PG_USER', 'postgres'),
    'password': os.environ.get('PG_PASSWORD', 'admin')
}

# MySQL Configuration (new)
MYSQL_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '3306'),
    'database': os.environ.get('DB_NAME', 'waf_database'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'admin')
}

def connect_postgresql():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        logger.info("Connected to PostgreSQL database")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return None

def connect_mysql():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        logger.info("Connected to MySQL database")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to MySQL: {e}")
        return None

def migrate_table(pg_conn, mysql_conn, table_name, columns_map):
    """Migrate a table from PostgreSQL to MySQL"""
    try:
        logger.info(f"Migrating table: {table_name}")
        
        pg_cursor = pg_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Get data from PostgreSQL
        pg_cursor.execute(f"SELECT {', '.join(columns_map.keys())} FROM {table_name}")
        rows = pg_cursor.fetchall()
        
        if rows:
            # Prepare MySQL insert statement
            mysql_columns = ', '.join(columns_map.values())
            placeholders = ', '.join(['%s'] * len(columns_map))
            insert_sql = f"INSERT INTO {table_name} ({mysql_columns}) VALUES ({placeholders})"
            
            # Insert data into MySQL
            mysql_cursor.executemany(insert_sql, rows)
            mysql_conn.commit()
            
            logger.info(f"Migrated {len(rows)} rows from {table_name}")
        else:
            logger.info(f"No data found in {table_name}")
        
        pg_cursor.close()
        mysql_cursor.close()
        return True
        
    except Exception as e:
        logger.error(f"Error migrating {table_name}: {e}")
        return False

def main():
    """Main migration function"""
    logger.info("Starting PostgreSQL to MySQL migration for ML-WAF")
    
    # Connect to both databases
    pg_conn = connect_postgresql()
    mysql_conn = connect_mysql()
    
    if not pg_conn or not mysql_conn:
        logger.error("Failed to connect to databases")
        return False
    
    try:
        # Migration mappings (PostgreSQL column -> MySQL column)
        tables_to_migrate = {
            'requests': {
                'id': 'id',
                'timestamp': 'timestamp',
                'ip': 'ip',
                'method': 'method',
                'url': 'url',
                'host': 'host',
                'ml_score': 'ml_score',
                'decision': 'decision',
                'reason': 'reason',
                'user_agent': 'user_agent',
                'request_data': 'request_data'
            },
            'alerts': {
                'id': 'id',
                'timestamp': 'timestamp',
                'ip': 'ip',
                'alert_type': 'alert_type',
                'severity': 'severity',
                'message': 'message'
            },
            'users': {
                'id': 'id',
                'username': 'username',
                'email': 'email',
                'password_hash': 'password_hash',
                'role': 'role',
                'is_active': 'is_active',
                'created_at': 'created_at',
                'last_login': 'last_login'
            }
        }
        
        # Migrate each table
        success_count = 0
        for table_name, columns_map in tables_to_migrate.items():
            if migrate_table(pg_conn, mysql_conn, table_name, columns_map):
                success_count += 1
        
        logger.info(f"Migration completed: {success_count}/{len(tables_to_migrate)} tables migrated successfully")
        
        return success_count == len(tables_to_migrate)
        
    except Exception as e:
        logger.error(f"Migration error: {e}")
        return False
    finally:
        # Close connections
        if pg_conn:
            pg_conn.close()
        if mysql_conn:
            mysql_conn.close()

if __name__ == "__main__":
    print("PostgreSQL to MySQL Migration Script for ML-WAF")
    print("===============================================")
    print("Make sure both PostgreSQL and MySQL databases are accessible")
    print("Set environment variables for database configurations")
    print()
    print("PostgreSQL variables: PG_HOST, PG_PORT, PG_DB_NAME, PG_USER, PG_PASSWORD")
    print("MySQL variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
    print()
    
    success = main()
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed. Check logs for details.")
    
    exit(0 if success else 1)
