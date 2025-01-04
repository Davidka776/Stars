// Глобальные функции
window.initUser = async function() {
    try {
        const tg = window.Telegram.WebApp;
        console.log('Checking Telegram WebApp:', tg);
        
        // Проверяем, открыто ли приложение в Telegram
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            console.log('Приложение открыто не в Telegram, используем тестовые данные');
            // Тестовые данные для разработки
            return {
                id: 1,
                telegram_id: 123456789,
                username: 'test_user',
                first_name: 'Тестовый Пользователь', // тестовое русское имя
                balance: 0,
                total_earned: 0
            };
        }

        const user = tg.initDataUnsafe.user;
        console.log('Raw user data from Telegram:', user);

        const response = await fetch('/api/user/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_id: user.id,
                username: user.username || '',
                first_name: user.first_name || 'Пользователь'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('Processed user data:', userData);
        return userData;
    } catch (error) {
        console.error('Error initializing user:', error);
        return {
            id: 1,
            telegram_id: 123456789,
            username: 'error_user',
            first_name: 'Ошибка загрузки',
            balance: 0,
            total_earned: 0
        };
    }
}

window.openChannel = function(username) {
    const tg = window.Telegram.WebApp;
    tg.openTelegramLink(`https://t.me/${username}`);
}

window.loadTasks = async function() {
    try {
        // Получаем данные пользователя для проверки выполненных заданий
        const userData = await window.initUser();
        
        // Загружаем задания и выполненные задания
        const [tasksResponse, completedResponse] = await Promise.all([
            fetch('/api/tasks'),
            fetch(`/api/tasks/completed?user_id=${userData.id}`)
        ]);

        if (!tasksResponse.ok || !completedResponse.ok) {
            throw new Error('Ошибка загрузки данных');
        }

        const tasks = await tasksResponse.json();
        const completedTasks = await completedResponse.json();
        console.log('Loaded tasks:', tasks);
        console.log('Completed tasks:', completedTasks);

        // Добавляем статус выполнения к заданиям
        const tasksWithStatus = tasks.map(task => ({
            ...task,
            isCompleted: completedTasks.includes(task.id)
        }));

        // Сортируем задания: невыполненные сверху, выполненные снизу
        tasksWithStatus.sort((a, b) => {
            if (a.isCompleted === b.isCompleted) return 0;
            return a.isCompleted ? 1 : -1;
        });

        let tasksHTML = `
            <h2>Доступные задания</h2>
            <div class="tasks-container">
        `;

        tasksWithStatus.forEach(task => {
            tasksHTML += `
                <div class="task-card ${task.isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-info">
                        <h3>${task.channel_title}</h3>
                        <p>Награда: ${task.reward} ⭐</p>
                    </div>
                    <div class="task-actions">
                        ${task.isCompleted ? 
                            '<div class="completed-badge">✅ Выполнено</div>' :
                            `<button class="subscribe-btn" onclick="openChannel('${task.channel_username}')">Подписаться</button>
                             <button class="check-btn" onclick="checkSubscription(${task.id})">Проверить</button>`
                        }
                    </div>
                </div>
            `;
        });

        tasksHTML += '</div>';
        document.getElementById('content').innerHTML = tasksHTML;
    } catch (error) {
        console.error('Error in loadTasks:', error);
        document.getElementById('content').innerHTML = `
            <h2>Доступные задания</h2>
            <p>Произошла ошибка при загрузке заданий: ${error.message}</p>
        `;
    }
}

window.checkSubscription = async function(taskId) {
    try {
        console.log('Начало проверки подписки для задания:', taskId);
        
        // Получаем данные пользователя
        const userData = await window.initUser();
        console.log('Данные пользователя:', userData);
        
        if (!userData || !userData.id) {
            console.error('Нет данных пользователя');
            return;
        }

        const response = await fetch('/api/tasks/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userData.id,
                task_id: taskId,
                telegram_id: userData.telegram_id
            })
        });
        
        console.log('Ответ сервера получен');
        const result = await response.json();
        console.log('Результат проверки:', result);
        
        if (result.success) {
            // Обновляем интерфейс
            window.loadTasks();
            alert(result.message);
        } else {
            alert(result.message || 'Проверьте подписку на канал');
        }
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error);
        alert('Произошла ошибка при проверке подписки');
    }
}

// Функция для обрезки текста
function truncateText(text, maxLength = 20) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Функция для безопасного отображения текста
function safeText(text, defaultText = 'Нет данных') {
    if (!text || text === 'undefined' || text === 'null') {
        return defaultText;
    }
    return text;
}

window.loadProfile = async function() {
    try {
        const userData = await window.initUser();
        console.log('Loading profile for user:', userData);

        const profileHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <h2>Профиль</h2>
                </div>
                <div class="profile-info">
                    <div class="profile-item">
                        <span class="label">Имя:</span>
                        <span class="value" title="${safeText(userData.first_name)}">${truncateText(safeText(userData.first_name))}</span>
                    </div>
                    <div class="profile-item">
                        <span class="label">Username:</span>
                        <span class="value" title="${safeText(userData.username, 'Не указан')}">@${truncateText(safeText(userData.username, 'Не указан'))}</span>
                    </div>
                    <div class="profile-item">
                        <span class="label">Баланс:</span>
                        <span class="value">⭐ ${userData.balance || 0}</span>
                    </div>
                    <div class="profile-item">
                        <span class="label">Всего заработано:</span>
                        <span class="value">⭐ ${userData.total_earned || 0}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = profileHTML;
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                <h2>Ошибка</h2>
                <p>Не удалось загрузить профиль: ${error.message}</p>
            </div>
        `;
    }
}

// Глобальные функции
window.loadPage = function(page) {
    const content = document.getElementById('content');
    switch(page) {
        case 'tasks':
            window.loadTasks();
            break;
        case 'ref':
            content.innerHTML = '<h2>Реферальная программа</h2><p>Здесь будет реферальная система</p>';
            break;
        case 'fortune':
            content.innerHTML = '<h2>Колесо фортуны</h2><p>Здесь будет колесо фортуны</p>';
            break;
        case 'profile':
            window.loadProfile();
            break;
    }
}

// Обработчик загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Обработчик клика по кнопкам навигации
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.dataset.page;
            window.loadPage(page);
            
            // Убираем активный класс у всех кнопок и добавляем к текущей
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Загружаем задания при старте
    window.loadTasks();
    navButtons[0].classList.add('active');
});
