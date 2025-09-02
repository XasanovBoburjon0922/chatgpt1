import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Check for stored language in localStorage, default to "uz"
const savedLanguage = localStorage.getItem("i18nextLng") || "uz";

i18n.use(initReactI18next).init({
  resources: {
    uz: {
      translation: {
        chatgpt: "Imzo AI",
        login: "Kirish",
        signup: "Bepul ro'yxatdan o'tish",
        pdf: "Ariza yaratish",
        writeApplication: "Ariza yozish",
        generateApplication: "Ariza PDF yaratish",
        downloadApplication: "Arizani yuklab olish",
        askanything: "Har qanday savol bering",
        you: "Siz:",
        newchat: "Yangi chat",
        chathistory: "Chat tarixi",
        terms: "Shartlar",
        privacy: "Maxfiylik siyosati",
        agree: "Imzo AI bilan xabar yuborish orqali siz bizning",
        loginRequired: "Savollar berish uchun avval login qiling",
        failedtocreatechatroom: "Yangi chat yaratishda xatolik",
        pleasecreatechatroom: "Iltimos yangi chat yarating",
        failedtosendmessage: "Xabar yuborishda xatolik",
        rateLimitError: "Siz juda ko'p so'rov yuboryapsiz. Biroz kuting.",
        serverError: "Server xatoligi yuz berdi. Keyinroq qayta urinib ko'ring.",
        networkError: "Internet aloqasini tekshiring.",
        tokenError: "Autentifikatsiya tokeni topilmadi. Iltimos, qayta login qiling.",
        enterName: "Ismingizni kiriting",
        save: "Saqlash",
        cancel: "Bekor qilish",
        nameRequired: "Iltimos, ismingizni kiriting!",
        nameUpdateError: "Ismni saqlashda xatolik yuz berdi!",
        categories: "Kategoriyalar",
        noItems: "Items yo'q",
        noCategories: "Kategoriyalar topilmadi",
        "notifications": "Xabarnomalar",
        "no_notifications": "Xabarnomalar yo'q",
        "mark_all_read": "Hammasini o'qilgan deb belgilash",
      },
    },
    ru: {
      translation: {
        chatgpt: "Imzo AI",
        login: "Вход",
        signup: "Бесплатная регистрация",
        pdf: "Создать заявление",
        writeApplication: "Написать заявление",
        generateApplication: "Создать PDF заявления",
        downloadApplication: "Скачать заявление",
        askanything: "Задайте любой вопрос",
        you: "Вы:",
        newchat: "Новый чат",
        chathistory: "История чатов",
        terms: "Условия",
        privacy: "Политика конфиденциальности",
        agree: "Отправляя сообщение Imzo AI, вы соглашаетесь с нашими",
        loginRequired: "Для отправки вопросов сначала войдите в систему",
        failedtocreatechatroom: "Ошибка при создании нового чата",
        pleasecreatechatroom: "Пожалуйста, создайте новый чат",
        failedtosendmessage: "Ошибка при отправке сообщения",
        rateLimitError: "Слишком много запросов. Подождите немного.",
        serverError: "Произошла ошибка сервера. Попробуйте позже.",
        networkError: "Проверьте подключение к интернету.",
        tokenError: "Токен аутентификации не найден. Пожалуйста, войдите снова.",
        enterName: "Введите ваше имя",
        save: "Сохранить",
        cancel: "Отмена",
        nameRequired: "Пожалуйста, введите ваше имя!",
        nameUpdateError: "Ошибка при сохранении имени!",
        categories: "Категории",
        noItems: "Нет элементов",
        noCategories: "Категории не найдены",
        "notifications": "Уведомления",
        "no_notifications": "Нет уведомлений",
        "mark_all_read": "Отметить все как прочитанные"
      },
    },
  },
  lng: savedLanguage, // Use saved language or default to "uz"
  fallbackLng: "uz",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;