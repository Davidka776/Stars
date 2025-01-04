from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.Integer, unique=True, nullable=False)
    username = db.Column(db.String(32), unique=True)
    first_name = db.Column(db.String(64))
    referral_code = db.Column(db.String(10), unique=True)
    referred_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    balance = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)
    
    first_login = db.Column(db.DateTime, default=func.now())
    last_activity = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f'<User {self.username}>' 

class CompletedTask(db.Model):
    __tablename__ = 'completed_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_id = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=func.now()) 