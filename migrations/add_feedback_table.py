
import sqlite3

def migrate():
    conn = sqlite3.connect('doctor_notes.db')
    c = conn.cursor()
    
    # Create student_feedback table
    c.execute('''
        CREATE TABLE IF NOT EXISTS student_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER,
            assistant_name TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(note_id) REFERENCES notes(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Migration successful: student_feedback table created.")

if __name__ == "__main__":
    migrate()
