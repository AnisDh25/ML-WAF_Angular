#!/usr/bin/env python3
"""
Data Migration Script: PostgreSQL to MySQL
Migrates all existing data from PostgreSQL to MySQL database
"""

import psycopg2
import mysql.connector
import os
import logging
from datetime import datetime
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# PostgreSQL Configuration (source)
PG_CONFIG = {
    'host': os.environ.get('PG_HOST', 'localhost'),
    'port': os.environ.get('PG_PORT', '5432'),
    'database': os.environ.get('PG_DB_NAME', 'waf_database'),
    'user': os.environ.get('PG_USER', 'postgres'),
    'password': os.environ.get('PG_PASSWORD', 'admin')
}

# MySQL Configuration (target)
MYSQL_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '3306'),
    'database': os.environ.get('DB_NAME', 'waf_database'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '')
}

def connect_postgresql():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        logger.info("✅ Connected to PostgreSQL database")
        return conn
    except Exception as e:
        logger.error(f"❌ Failed to connect to PostgreSQL: {e}")
        logger.error("💡 Make sure PostgreSQL is running and credentials are correct")
        logger.error("💡 Set environment variables: PG_HOST, PG_PORT, PG_DB_NAME, PG_USER, PG_PASSWORD")
        return None

def connect_mysql():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        logger.info("✅ Connected to MySQL database")
        return conn
    except Exception as e:
        logger.error(f"❌ Failed to connect to MySQL: {e}")
        logger.error("💡 Make sure MySQL/MariaDB is running and credentials are correct")
        logger.error("💡 Set environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
        return None

def migrate_table(pg_conn, mysql_conn, table_name, columns_mapping):
    """Migrate data from PostgreSQL table to MySQL table"""
    try:
        logger.info(f"🔄 Migrating table: {table_name}")
        
        pg_cursor = pg_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Get data from PostgreSQL
        pg_cursor.execute(f"SELECT {', '.join(columns_mapping.keys())} FROM {table_name}")
        rows = pg_cursor.fetchall()
        
        if rows:
            logger.info(f"📊 Found {len(rows)} rows in {table_name}")
            
            # Prepare MySQL insert statement
            mysql_columns = ', '.join(columns_mapping.values())
            placeholders = ', '.join(['%s'] * len(columns_mapping))
            insert_sql = f"INSERT INTO {table_name} ({mysql_columns}) VALUES ({placeholders})"
            
            # Convert data types if needed
            converted_rows = []
            for row in rows:
                converted_row = []
                for i, value in enumerate(row):
                    # Handle None values
                    if value is None:
                        converted_row.append(None)
                    # Handle boolean values
                    elif isinstance(value, bool):
                        converted_row.append(1 if value else 0)
                    # Handle datetime objects
                    elif isinstance(value, datetime):
                        converted_row.append(value)
                    else:
                        converted_row.append(value)
                converted_rows.append(tuple(converted_row))
            
            # Insert data into MySQL in batches
            batch_size = 1000
            for i in range(0, len(converted_rows), batch_size):
                batch = converted_rows[i:i + batch_size]
                mysql_cursor.executemany(insert_sql, batch)
                mysql_conn.commit()
                logger.info(f"✅ Migrated batch {i//batch_size + 1}: {len(batch)} rows")
            
            logger.info(f"✅ Successfully migrated {len(converted_rows)} rows from {table_name}")
        else:
            logger.info(f"ℹ️  No data found in {table_name}")
        
        pg_cursor.close()
        mysql_cursor.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error migrating {table_name}: {e}")
        return False

def check_postgresql_tables(pg_conn):
    """Check what tables exist in PostgreSQL"""
    try:
        pg_cursor = pg_conn.cursor()
        pg_cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row[0] for row in pg_cursor.fetchall()]
        pg_cursor.close()
        logger.info(f"📋 Found PostgreSQL tables: {tables}")
        return tables
    except Exception as e:
        logger.error(f"❌ Error checking PostgreSQL tables: {e}")
        return []

def main():
    """Main migration function"""
    logger.info("🚀 Starting PostgreSQL to MySQL Data Migration")
    logger.info("=" * 60)
    
    # Display configuration
    logger.info("📊 Source (PostgreSQL):")
    logger.info(f"   Host: {PG_CONFIG['host']}")
    logger.info(f"   Port: {PG_CONFIG['port']}")
    logger.info(f"   Database: {PG_CONFIG['database']}")
    logger.info(f"   User: {PG_CONFIG['user']}")
    
    logger.info("🎯 Target (MySQL):")
    logger.info(f"   Host: {MYSQL_CONFIG['host']}")
    logger.info(f"   Port: {MYSQL_CONFIG['port']}")
    logger.info(f"   Database: {MYSQL_CONFIG['database']}")
    logger.info(f"   User: {MYSQL_CONFIG['user']}")
    
    logger.info("=" * 60)
    
    # Connect to both databases
    pg_conn = connect_postgresql()
    mysql_conn = connect_mysql()
    
    if not pg_conn or not mysql_conn:
        logger.error("❌ Failed to connect to databases. Migration aborted.")
        return False
    
    try:
        # Check what tables exist in PostgreSQL
        pg_tables = check_postgresql_tables(pg_conn)
        
        # Define table column mappings
        table_mappings = {
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
                'type': 'type',
                'severity': 'severity', 
                'message': 'message',
                'ip': 'ip',
                'url': 'url'
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
            },
            'blocked_ips': {
                'id': 'id',
                'ip': 'ip',
                'reason': 'reason',
                'blocked_at': 'blocked_at',
                'blocked_by': 'blocked_by'
            }
        }
        
        # Migrate each table that exists
        success_count = 0
        total_migrated = 0
        
        for table_name in table_mappings.keys():
            if table_name in pg_tables:
                logger.info(f"🔄 Processing table: {table_name}")
                if migrate_table(pg_conn, mysql_conn, table_name, table_mappings[table_name]):
                    success_count += 1
                    # Get row count for statistics
                    pg_cursor = pg_conn.cursor()
                    pg_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    row_count = pg_cursor.fetchone()[0]
                    total_migrated += row_count
                    pg_cursor.close()
                else:
                    logger.warning(f"⚠️  Failed to migrate {table_name}")
            else:
                logger.info(f"⏭️  Skipping {table_name} (doesn't exist in PostgreSQL)")
        
        # Summary
        logger.info("=" * 60)
        logger.info("📊 Migration Summary:")
        logger.info(f"   Tables attempted: {len(table_mappings)}")
        logger.info(f"   Tables successful: {success_count}")
        logger.info(f"   Total rows migrated: {total_migrated}")
        
        if success_count > 0:
            logger.info("🎉 Data migration completed successfully!")
            logger.info("💡 You can now use the MySQL backend with all your data")
        else:
            logger.warning("⚠️  No data was migrated")
        
        return success_count > 0
        
    except Exception as e:
        logger.error(f"❌ Migration error: {e}")
        return False
    finally:
        # Close connections
        if pg_conn:
            pg_conn.close()
        if mysql_conn:
            mysql_conn.close()

if __name__ == "__main__":
    print("🔄 PostgreSQL to MySQL Data Migration Tool")
    print("=" * 50)
    print("This tool migrates all data from PostgreSQL to MySQL")
    print()
    print("📋 Prerequisites:")
    print("   1. PostgreSQL server must be running")
    print("   2. MySQL/MariaDB server must be running") 
    print("   3. Proper environment variables set")
    print()
    print("🔧 Environment Variables:")
    print("   PostgreSQL (source):")
    print("     PG_HOST=localhost")
    print("     PG_PORT=5432")
    print("     PG_DB_NAME=waf_database")
    print("     PG_USER=postgres")
    print("     PG_PASSWORD=your_pg_password")
    print()
    print("   MySQL (target):")
    print("     DB_HOST=localhost")
    print("     DB_PORT=3306")
    print("     DB_NAME=waf_database")
    print("     DB_USER=root")
    print("     DB_PASSWORD=your_mysql_password")
    print()
    print("💡 Example Usage:")
    print("   set PG_PASSWORD=your_pg_password")
    print("   set DB_PASSWORD=")
    print("   python migrate_data.py")
    print("=" * 50)
    
    success = main()
    exit(0 if success else 1)
