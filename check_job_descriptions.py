import psycopg2
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:MgqD7m8BCQcp@ep-twilight-cherry-ahajff5o.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check if jobs have descriptions
cur.execute('''
    SELECT 
        id, 
        title, 
        description,
        "jobDescription",
        COALESCE(LENGTH(description), 0) as desc_len,
        COALESCE(LENGTH("jobDescription"), 0) as job_desc_len
    FROM jobs 
    LIMIT 5
''')

rows = cur.fetchall()

print('\n=== Jobs in database ===\n')
for row in rows:
    job_id, title, description, job_description, desc_len, job_desc_len = row
    print(f'ID: {job_id}')
    print(f'Title: {title}')
    print(f'description field length: {desc_len} chars')
    print(f'jobDescription field length: {job_desc_len} chars')
    
    if description:
        print(f'description preview: {description[:150]}...')
    if job_description:
        print(f'jobDescription preview: {job_description[:150]}...')
    
    print('-' * 80)
    print()

conn.close()
