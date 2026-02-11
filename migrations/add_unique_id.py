import sqlite3
import random

DB_PATH = "doctor_notes.db"

def generate_unique_id():
    return str(random.randint(100000, 999999))

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(patients)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "unique_id" not in columns:
        print("Adding unique_id column...")
        cursor.execute("ALTER TABLE patients ADD COLUMN unique_id TEXT")
        conn.commit()
    else:
        print("unique_id column already exists.")

    # Backfill existing patients
    print("Backfilling existing patients...")
    cursor.execute("SELECT id, unique_id FROM patients")
    patients = cursor.fetchall()
    
    updates = 0
    for pid, uid in patients:
        if not uid:
            new_uid = generate_unique_id()
            # Ensure uniqueness (simple check for this script)
            while True:
                cursor.execute("SELECT id FROM patients WHERE unique_id = ?", (new_uid,))
                if cursor.fetchone() is None:
                    break
                new_uid = generate_unique_id()
                
            cursor.execute("UPDATE patients SET unique_id = ? WHERE id = ?", (new_uid, pid))
            updates += 1
            
    conn.commit()
    print(f"Migration complete. Updated {updates} records.")
    conn.close()

if __name__ == "__main__":
    migrate()
