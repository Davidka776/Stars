let currentUser = null;

// Функция инициализации пользователя
async function initUser(userData) {
    try {
        const response = await fetch('/api/user/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        currentUser = await response.json();
        return currentUser;
    } catch (error) {
        console.error('Error initializing user:', error);
    }
}

// Функция для проверки подписки
async function checkSubscription(taskId) {
    try {
        const response = await fetch('/api/tasks/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                task_id: taskId
            })
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) {
            loadTasks(); // Перезагружаем задания
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }
}

// Функция показа реферальной системы
function showReferrals() {
    // Скрываем все секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем секцию рефералов
    document.getElementById('referralsSection').style.display = 'block';
    
    // Загружаем информацию о рефералах
    if (currentUser) {
        loadReferralInfo();
    }
}

// Функция копирования ссылки
function copyLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    
    // Показываем уведомление
    alert('Ссылка скопирована!');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready();
    
    // Получаем данные пользователя
    const user = tg.initDataUnsafe.user;
    if (user) {
        initUser(user).then(() => {
            loadTasks();
        });
    }
});
