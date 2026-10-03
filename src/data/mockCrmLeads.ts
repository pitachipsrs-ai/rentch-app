import { CrmLead } from '../types';

export const INITIAL_CRM_LEADS: CrmLead[] = [
  {
    id: 'crm-chat-myhome-26142052',
    clientName: 'Ситников Антон',
    clientPhone: '+995595766600',
    stage: 'viewing_scheduled',
    apartmentId: 'myhome-26142052',
    apartmentTitle: 'Сдается 1-комнатная квартира в Сабуртало',
    apartmentDistrict: 'Сабуртало (Saburtalo)',
    apartmentAddress: 'мицкевичи а. ул. 14',
    apartmentPriceUsd: 550,
    apartmentImage:
      'https://static-api-statements.tnet.ge/uploads/202609/20260923/statements/kNu58hO6ab42360cf40e.webp',
    apartmentSourceUrl:
      'https://www.myhome.ge/ru/nedvizhimost/sdaetsia-1-komnatnaia-kvartira-v-saburtalo-26142052/',
    viewingSlot: {
      date: 'Сегодня (28 сентября)',
      time: '19:00',
    },
    registeredAt: '28 сентября в 15:37',
    notes:
      'Запись через приложение Rentch на осмотр объекта Сдается 1-комнатная квартира в Сабуртало (Сегодня (28 сентября) в 19:00)',
    messages: [
      {
        id: 'bot-welcome-myhome-26142052',
        sender: 'bot',
        text: 'Здравствуйте! Рады приветствовать вас в Rentch 🇬🇪\nПоздравляем с взаимным Rentch! по квартире «Сдается 1-комнатная квартира в Сабуртало».\nЯ виртуальный помощник. Мы готовы забронировать удобное время для очного или онлайн-просмотра квартиры.',
        timestamp: '15:36',
        isAction: true,
        actionType: 'confirm_viewing',
      },
      {
        id: 'msg-confirm-myhome-26142052',
        sender: 'user',
        senderName: 'Ситников Антон',
        text: 'Здравствуйте! Я подтверждаю бронирование осмотра квартиры на Сегодня (28 сентября) в 19:00.\nМои контактные данные: Ситников Антон (+995595766600).',
        timestamp: '15:37',
      },
      {
        id: 'bot-confirmed-myhome-26142052',
        sender: 'bot',
        text: '✅ Отлично! Осмотр забронирован на Сегодня (28 сентября) в 19:00.\nЗаявка передана в отдел аренды. Ждём вас по адресу: мицкевичи а. ул. 14!',
        timestamp: '15:37',
        isAction: true,
        actionType: 'viewing_scheduled',
      },
      {
        id: 'landlord-welcome-myhome-26142052',
        sender: 'landlord',
        senderName: 'Служба заботы Rentch',
        text: 'Добрый день, Ситников Антон! Осмотр на Сегодня (28 сентября) в 19:00 подтверждён. Квартира на мицкевичи а. ул. 14 готова к показу. До встречи!\n\nТелефон для связи: +995 558 542 365',
        timestamp: '15:37',
      },
    ],
    unreadByAdmin: 1,
  },
  {
    id: 'crm-chat-myhome-26142775',
    clientName: 'Родион',
    clientPhone: '+995 558 542 365',
    stage: 'viewing_scheduled',
    apartmentId: 'myhome-26142775',
    apartmentTitle: 'Сдается 4-комнатная квартира в Ваке',
    apartmentDistrict: 'Ваке (Vake)',
    apartmentAddress: 'жваниа н. ул. 10',
    apartmentPriceUsd: 1750,
    apartmentImage:
      'https://static-api-statements.tnet.ge/uploads/202609/20260924/statements/WEa66zn6ab4cc0c8b4f9.webp',
    apartmentSourceUrl:
      'https://www.myhome.ge/ru/nedvizhimost/sdaetsia-4-komnatnaia-kvartira-v-vake-26142775/',
    viewingSlot: {
      date: 'Завтра (29 сентября)',
      time: '18:00',
    },
    registeredAt: '27 сентября',
    notes:
      'Свайп вправо (Rentch! ❤️) и запись на осмотр объекта «Сдается 4-комнатная квартира в Ваке» (Завтра в 18:00)',
    messages: [
      {
        id: 'bot-welcome-myhome-26142775',
        sender: 'bot',
        text: 'Здравствуйте! Рады приветствовать вас в Rentch 🇬🇪\nПоздравляем с взаимным Rentch! по квартире «Сдается 4-комнатная квартира в Ваке».\nЯ виртуальный помощник. Мы готовы забронировать удобное время для очного или онлайн-просмотра квартиры.',
        timestamp: '19:45',
        isAction: true,
        actionType: 'confirm_viewing',
      },
      {
        id: 'msg-confirm-myhome-26142775',
        sender: 'user',
        senderName: 'Родион',
        text: 'Здравствуйте! Я подтверждаю бронирование осмотра квартиры на Завтра (29 сентября) в 18:00.\nМои контактные данные: Родион.',
        timestamp: '19:46',
      },
      {
        id: 'bot-confirmed-myhome-26142775',
        sender: 'bot',
        text: '✅ Отлично! Осмотр забронирован на Завтра (29 сентября) в 18:00.\nЗаявка передана в отдел аренды. Ждём вас по адресу: жваниа н. ул. 10!',
        timestamp: '19:46',
        isAction: true,
        actionType: 'viewing_scheduled',
      },
    ],
    unreadByAdmin: 1,
  },
];
