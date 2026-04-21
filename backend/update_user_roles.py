#!/usr/bin/env python3
"""
Update existing user roles from 'user' to 'responsible-it'
"""

import mysql.connector
import os

# MySQL Configuration
MYSQL_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '3306'),
    'database': os.environ.get('DB_NAME', 'waf_database'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '')
}

def update_user_roles():
    """Update existing user roles"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        print("=== Updating User Roles ===")
        
        # Check current roles
        cursor.execute("SELECT id, username, role FROM users ORDER BY id")
        users = cursor.fetchall()
        
        print(f"\nCurrent users and roles:")
        for user in users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Role: {user[2]}")
        
        # Update 'user' roles to 'responsible-it'
        cursor.execute("UPDATE users SET role = 'responsible-it' WHERE role = 'user'")
        updated_count = cursor.rowcount
        conn.commit()
        
        if updated_count > 0:
            print(f"\nUpdated {updated_count} users from 'user' to 'responsible-it'")
        else:
            print("\nNo users with 'user' role found to update")
        
        # Show updated roles
        cursor.execute("SELECT id, username, role FROM users ORDER BY id")
        updated_users = cursor.fetchall()
        
        print(f"\nUpdated user roles:")
        for user in updated_users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Role: {user[2]}")
        
        cursor.close()
        conn.close()
        
        print(f"\nRole update completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_user_roles()
