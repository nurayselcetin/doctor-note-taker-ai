from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def run_migration():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        # 1. Create Assistants Table
        try:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS assistants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR,
                hashed_password VARCHAR,
                doctor_id INTEGER,
                created_at DATETIME DEFAULT (datetime('now')),
                FOREIGN KEY(doctor_id) REFERENCES doctors(id)
            )
            """))
            print("Created assistants table")
        except Exception as e:
            print(f"Error creating assistants table: {e}")

        # 2. Add assistant_id to student_feedback if not exists
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(student_feedback)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "assistant_id" not in columns:
                conn.execute(text("ALTER TABLE student_feedback ADD COLUMN assistant_id INTEGER REFERENCES assistants(id)"))
                print("Added assistant_id to student_feedback")
            else:
                print("assistant_id already exists in student_feedback")
                
        except Exception as e:
            print(f"Error updating student_feedback table: {e}")
            
    print("Migration completed successfully")

if __name__ == "__main__":
    run_migration()
