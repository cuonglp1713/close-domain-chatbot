import mysql.connector
import time
import os

# Đợi MySQL container sẵn sàng
def wait_for_db():
    retries = 10
    while retries > 0:
        try:
            connection = mysql.connector.connect(
                host=os.getenv('MYSQL_HOST', 'localhost'),
                user=os.getenv('MYSQL_USER', 'root'),
                password=os.getenv('MYSQL_PASSWORD', 'password'),
                database=os.getenv('MYSQL_DATABASE', 'chat')
            )
            connection.close()
            print("Database is ready!")
            return True
        except mysql.connector.Error as err:
            print(f"Waiting for database... ({err})")
            retries -= 1
            time.sleep(5)
    raise Exception("Database not available")

# Kết nối và khởi tạo database
def initialize_database():
    connection = mysql.connector.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', 'password'),
        database=os.getenv('MYSQL_DATABASE', 'chat')
    )
    cursor = connection.cursor()

    # Tạo bảng messages
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL
    );
    ''')

    # Tạo bảng additional_info
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS additional_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        info_key VARCHAR(255) NOT NULL,
        info_value TEXT,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );
    ''')

    # Chèn dữ liệu mẫu
    cursor.executemany('''
    INSERT INTO messages (conversation_id, role, content) VALUES (%s, %s, %s)
    ''', [
        (1, 'user', 'Hello, how are you?'),
        (1, 'assistant', 'I am fine, thank you!'),
        (2, 'user', 'What is the weather like today?')
    ])

    cursor.executemany('''
    INSERT INTO additional_info (message_id, info_key, info_value) VALUES (%s, %s, %s)
    ''', [
        (1, 'sentiment', 'positive'),
        (2, 'sentiment', 'neutral')
    ])

    connection.commit()
    cursor.close()
    connection.close()

if __name__ == "__main__":
    wait_for_db()
    initialize_database()
    print("Database initialized successfully!")