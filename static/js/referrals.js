async function loadReferralInfo() {
    try {
        const response = await fetch(`/api/referral/info?user_id=${currentUser.id}`);
        const data = await response.json();
        
        document.getElementById('referralLink').value = data.referral_link;
        document.getElementById('totalEarnings').textContent = data.total_earnings;
        
        const referralsList = document.getElementById('referralsList');
        referralsList.innerHTML = '';
        
        if (data.referrals.length === 0) {
            referralsList.innerHTML = '<p class="no-referrals">У вас пока нет приглашенных пользователей</p>';
            return;
        }
        
        data.referrals.forEach(ref => {
            referralsList.innerHTML += `
                <div class="referral-item">
                    <span class="referral-username">${ref.username}</span>
                    <span class="referral-amount">+${ref.amount} звезд</span>
                    <span class="referral-date">${ref.date}</span>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading referral info:', error);
    }
}

function copyLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    
    // Показываем уведомление
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = 'Ссылка скопирована!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
} 