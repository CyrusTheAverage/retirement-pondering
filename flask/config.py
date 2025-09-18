import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_DATABASE_URI = f"postgresql://{os.environ.get('POSTGRES_USER')}:"\
            f"{os.environ.get('POSTGRES_PASSWORD')}@localhost:5432/" \
            f"{os.environ.get('POSTGRES_DB')}"
    # Flask configuration
    UPLOAD_FOLDER = '../uploads'
    PROCESSED_FOLDER = '../processed'
    ERROR_FOLDER = 'error_files'