import requests
import os

BOT_TOKEN = "6003178703:AAE9UECUcRMBFybQa4BNMZps1e9zJQDK6o8"  # Вставьте токен бота напрямую для теста
CHANNEL = "FreePremGift"  # Имя канала без @
USER_ID = 1147574990  # Замените на ваш Telegram ID

def test_bot():
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {
        'chat_id': f"@{CHANNEL}",
        'user_id': USER_ID
    }
    
    try:
        print("Отправка запроса...")
        print(f"URL: {url}")
        print(f"Параметры: {params}")
        
        response = requests.get(url, params=params)
        print(f"Статус ответа: {response.status_code}")
        print(f"Ответ: {response.text}")
        
        data = response.json()
        if data.get('ok'):
            print("Запрос успешен!")
            print(f"Статус пользователя: {data['result']['status']}")
        else:
            print("Ошибка в ответе API")
            print(f"Описание ошибки: {data.get('description')}")
            
    except Exception as e:
        print(f"Произошла ошибка: {str(e)}")

if __name__ == "__main__":
    test_bot() 