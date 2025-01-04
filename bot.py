import os
from telegram.ext import Updater, CommandHandler
from dotenv import load_dotenv
from main import db, User, ReferralReward

load_dotenv()

def start(update, context):
    args = context.args
    user = update.effective_user
    
    # Проверяем, есть ли реферальный код
    if args and len(args[0]) == 8:
        referral_code = args[0]
        referrer = User.query.filter_by(referral_code=referral_code).first()
        
        if referrer and referrer.telegram_id != user.id:
            # Проверяем, не был ли пользователь уже приглашен
            new_user = User.query.filter_by(telegram_id=user.id).first()
            if not new_user:
                new_user = User(
                    telegram_id=user.id,
                    username=user.username,
                    first_name=user.first_name
                )
                db.session.add(new_user)
                
                # Начисляем награду рефереру
                reward_amount = 50  # Награда за реферала
                referrer.balance += reward_amount
                referrer.referral_earnings += reward_amount
                
                # Записываем награду
                reward = ReferralReward(
                    referrer_id=referrer.id,
                    referred_id=new_user.id,
                    amount=reward_amount
                )
                db.session.add(reward)
                db.session.commit()

def main():
    updater = Updater(os.getenv('BOT_TOKEN'))
    dp = updater.dispatcher
    
    dp.add_handler(CommandHandler("start", start))
    
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()