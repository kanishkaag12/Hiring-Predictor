import os
import psycopg2

# Read DATABASE_URL from .env file
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            DATABASE_URL = line.strip().split('=', 1)[1].strip('"').strip("'")
            break

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    ORDER BY ordinal_position
""")

print("ACTUAL DATABASE COLUMNS IN jobs TABLE:")
print("-" * 50)
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

cur.close()
conn.close()
