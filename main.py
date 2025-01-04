from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Конфигурация базы данных
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///telegram_mini_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Модели
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.Integer, unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True)
    first_name = db.Column(db.String(80))
    balance = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)

class CompletedTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, nullable=False)

# Создание таблиц
with app.app_context():
    db.create_all()

# Telegram Bot Token
BOT_TOKEN = os.getenv('BOT_TOKEN')

def check_subscription(channel_username, user_id):
    """Проверка подписки пользователя на канал через Bot API"""
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
        params = {
            'chat_id': f"@{channel_username}",
            'user_id': user_id
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('ok'):
            status = data['result']['status']
            member_statuses = ['creator', 'administrator', 'member', 'restricted']
            return status in member_statuses
        return False
        
    except Exception as e:
        print(f"Ошибка при проверке подписки: {str(e)}")
        return False

def load_tasks():
    """Загрузка заданий из JSON файла"""
    try:
        with open('static/tasks.json', 'r', encoding='utf-8') as file:
            return json.load(file)['tasks']
    except Exception as e:
        print(f"Ошибка при загрузке заданий: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/user/init', methods=['POST'])
def init_user():
    try:
        data = request.get_json()
        print("Received user data:", data)

        telegram_id = data.get('telegram_id')
        username = data.get('username', '').strip() or None
        first_name = data.get('first_name', '').strip() or 'Пользователь'

        if not telegram_id:
            return jsonify({'error': 'No telegram_id provided'}), 400

        user = User.query.filter_by(telegram_id=telegram_id).first()
        if not user:
            user = User(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                balance=0,
                total_earned=0
            )
            db.session.add(user)
        else:
            user.username = username
            user.first_name = first_name

        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'telegram_id': user.telegram_id,
            'username': user.username or '',
            'first_name': user.first_name or 'Пользователь',
            'balance': user.balance,
            'total_earned': user.total_earned
        })

    except Exception as e:
        print(f"Error in init_user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        tasks = load_tasks()
        tasks_data = [task for task in tasks if task['is_active']]
        return jsonify(tasks_data)
    except Exception as e:
        print(f"Ошибка при получении заданий: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/check', methods=['POST'])
def check_task():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        task_id = data.get('task_id')
        
        tasks = load_tasks()
        task = next((t for t in tasks if t['id'] == task_id), None)
        user = User.query.get(user_id)
        
        if not task:
            return jsonify({'success': False, 'message': 'Задание не найдено'})
        
        if not user:
            return jsonify({'success': False, 'message': 'Пользователь не найден'})
            
        if CompletedTask.query.filter_by(user_id=user_id, task_id=task_id).first():
            return jsonify({'success': False, 'message': 'Задание уже выполнено'})
        
        is_subscribed = check_subscription(task['channel_username'], user.telegram_id)
        
        if is_subscribed:
            completed_task = CompletedTask(user_id=user_id, task_id=task_id)
            db.session.add(completed_task)
            
            user.balance += task['reward']
            user.total_earned += task['reward']
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Награда {task["reward"]} звезд начислена!',
                'new_balance': user.balance
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Вы не подписаны на канал'
            })
            
    except Exception as e:
        print(f"Критическая ошибка: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tasks/completed', methods=['GET'])
def get_completed_tasks():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify([])
            
        completed_tasks = CompletedTask.query.filter_by(user_id=user_id).all()
        completed_task_ids = [task.task_id for task in completed_tasks]
        
        return jsonify(completed_task_ids)
    except Exception as e:
        print(f"Ошибка при получении выполненных заданий: {str(e)}")
        return jsonify([])

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port)