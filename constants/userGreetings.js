const PREMIUM_MESSAGE = `
🌟 Premium Access

Отримайте доступ до ексклюзивних можливостей та переваг з нашим преміум планом! Наші передплатники отримують:

🚀 Ранній Доступ: Будьте серед перших, хто випробовує нові функції та оновлення.

🎨 Ексклюзивні Теми: Оформлення та дизайн, доступні лише для підписників преміум-плану.

🤖 Покращені Команди Бота: Нові та потужні команди для зручного використання наших ботів.

📚 Ексклюзивні Віджети: Додайте стиль до свого додатку за допомогою унікальних віджетів для преміум-користувачів.

💬 Пріоритетна Підтримка: Швидка та ефективна підтримка від нашої команди для вас.

Обирайте наш преміум план та розблоковуйте найкращі можливості! 🌟
`
const REFERAL_SYSTEM_MESSAGE = (ctx) => `\n<b>Ваше унікальне реферальне посилання:</b>\n\n<i>(Натисніть щоб скопіювати)</i>\n<code>https://t.me/EnjoyHubBot?start=${ctx.message.from.id}</code>\n\n
💰 Реферальна Програма

Покликайте своїх друзів та отримайте винагороду за кожного нового учасника, які приєднається до нашої спільноти!

🌐 Запрошуйте Друзів: Поділіться своїм унікальним реферальним посиланням з друзями через Телеграм.

🎁 Отримуйте Винагороду: За кожного друга, який приєднується за вашим посиланням, ви отримуєте особливий бонус.

🚀 Збільшуйте Статус: Завдяки реферальним бонусам, ви розблокуєте високий рівень статусу та ексклюзивні переваги.

📈 Відстежуйте Статистику: Спостерігайте за кількістю запрошених друзів та ваших досягнень у панелі статистики.

💡 Ексклюзивні Бонуси: За досягнення певних мильників, отримуйте додаткові бонуси та подарунки.
\n\n`

module.exports = {
    PREMIUM_MESSAGE,
    REFERAL_SYSTEM_MESSAGE
}