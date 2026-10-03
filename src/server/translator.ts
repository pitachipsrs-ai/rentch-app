import { GoogleGenAI } from '@google/genai';
import { Apartment } from '../types';
import { sanitizeApartmentPhones, stripPhoneAndContactMentions } from '../utils/phoneSanitizer';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Failed to initialize Gemini AI client:', err);
    }
  }
  return aiClient;
}

export function hasNonRussianText(str: string = ''): boolean {
  if (!str) return false;
  // Check for Georgian characters
  if (/[\u10A0-\u10FF]/.test(str)) return true;
  // Check for predominantly English words in title or description
  if (/\b(rent|apartment|bedroom|flat|studio|furnished|renovated|floor|balcony|square|street|district|tbilisi|batumi)\b/i.test(str)) {
    return true;
  }
  return false;
}

// Comprehensive Georgian & English to Russian dictionary for fast bulk translation
const GEO_DICT: Record<string, string> = {
  'ქირავდება': 'Сдается',
  'ბინა': 'квартира',
  'ოთახიანი': '-комнатная',
  'ოთახი': 'комната',
  'ახალაშენებულ': 'в новостройке',
  'ახალაშენებული': 'новостройка',
  'კორპუსში': 'в корпусе',
  'ევრორემონტით': 'с евроремонтом',
  'გარემონტებული': 'с ремонтом',
  'უცხოვრებელი': 'никто не жил',
  'ავეჯით': 'с мебелью',
  'ტექნიკით': 'с техникой',
  'ყველა საჭირო': 'всей необходимой',
  'საძინებელი': 'спальня',
  'საძინებლით': 'со спальней',
  'სტუდიო': 'студия',
  'აივნით': 'с балконом',
  'აივანი': 'балкон',
  'ცენტრალური გათბობა': 'центральное отопление',
  'ცენტრალური გათბობით': 'с центральным отоплением',
  'კონდიციონერი': 'кондиционер',
  'ლიფტი': 'лифт',
  'პარკინგი': 'паркинг',
  'სართული': 'этаж',
  'ქუჩა': 'ул.',
  'ქუჩაზე': 'на ул.',
  'ქ.': 'ул.',
  'გამზირი': 'просп.',
  'გამზ.': 'просп.',
  'ჩიხი': 'пер.',
  'შესახვევი': 'пер.',
  'მიკრორაიონი': 'мкр.',
  'მ/რ': 'мкр.',
  'კვარტალი': 'квартал',
  'უბანი': 'район',
  'ვაკეში': 'в Ваке',
  'ვაკე': 'Ваке',
  'საბურთალოზე': 'в Сабуртало',
  'საბურთალო': 'Сабуртало',
  'ვერაზე': 'в Вера',
  'ვერა': 'Вера',
  'მთაწმინდაზე': 'на Мтацминда',
  'მთაწმინდა': 'Мтацминда',
  'სოლოლაკში': 'в Сололаки',
  'სოლოლაკი': 'Сололаки',
  'ორთაჭალაში': 'в Ортачала',
  'ორთაჭალა': 'Ортачала',
  'ავლაბარში': 'в Авлабари',
  'ავლაბარი': 'Авлабари',
  'ჩუღურეთში': 'в Чугурети',
  'ჩუღურეთი': 'Чугурети',
  'დიდუბეში': 'в Дидубе',
  'დიდუბე': 'Дидубе',
  'ისანში': 'в Исани',
  'ისანი': 'Исани',
  'სამგორში': 'в Самгори',
  'სამგორი': 'Самгори',
  'კრწანისში': 'в Крцаниси',
  'კრწანისი': 'Крцаниси',
  'ბაგებში': 'в Багеби',
  'ბაგები': 'Багеби',
  'დიდ დიღომში': 'в Диди Дигоми',
  'დიდი დიღომი': 'Диди Дигоми',
  'დიღომში': 'в Дигоми',
  'დიღომი': 'Дигоми',
  'დიღმის მასივში': 'в Дигомском массиве',
  'დიღმის მასივი': 'Дигомский массив',
  'ნაძალადევში': 'в Надзаладеви',
  'ნაძალადევი': 'Надзаладеви',
  'გლდანში': 'в Глдани',
  'გლდანი': 'Глдани',
  'ვარკეთილში': 'в Варкетили',
  'ვარკეთილი': 'Варкетили',
  'სანზონაში': 'в Санзона',
  'სანზონა': 'Санзона',
  'მუხიანში': 'в Мухиани',
  'მუხიანი': 'Мухиани',
  'ბათუმი': 'Батуми',
  'თბილისი': 'Тбилиси',
  'საქართველო': 'Грузия',
  'მირიან მეფის': 'Царя Мириана',
  'შროშის': 'Шроши',
  'ხიმშიაშვილის': 'Химшиашвили',
  'რუსთაველის': 'Руставели',
  'ჭავჭავაძის': 'Чавчавадзе',
  'ყაზბეგის': 'Казбеги',
  'პეკინის': 'Пекина',
  'წერეთლის': 'Церетели',
  'აღმაშენებლის ხეივ.': 'аллея Агмашенебели',
  'აღმაშენებლის': 'Агмашенебели',
  'კოსტავას': 'Костава',
  'შარტავას': 'Шартава',
  'პოლიტკოვსკაიას': 'Политковской',
  'ჯიქიას': 'Джикия',
  'ნუცუბიძის ფერდობზე': 'на плато Нуцубидзе',
  'ნუცუბიძის': 'Нуцубидзе',
  'ვაჟა-ფშაველას': 'Важа-Пшавела',
  'თამარაშვილის': 'Тамарашвили',
  'აბაშიძის': 'Абашидзе',
  'ფალიაშვილის': 'Палиашвили',
  'ბარნოვის': 'Барнова',
  'გორგასლის': 'Горгасали',
  'წინამძღვრიშვილის': 'Цинамдзгвришвили',
  'მარჯანიშვილის': 'Марджанишвили',
  'ქავთარაძის': 'Кавтарадзе',
  'ცინცაძის': 'Цинцадзе',
  'შავიშვილის': 'Шавишвили',
  'ალექსიძის': 'Алексидзе',
  'ჟვანიას': 'Жвания',
  'უნივერსიტეტის': 'Университетская',
  'ბახტრიონის': 'Бахтриони',
  'ჭყონდიდელის': 'Чкондидели',
  'მელიქიშვილის': 'Меликишвили',
  'კედიას': 'Кедия',
  'ვეკუას': 'Векуа',
  'კუპრაძის': 'Купрадзе',
  'ჭილაძის': 'Чиладзе',
  'თავხელიძის': 'Тавхелидзе',
  'თავდადებულის': 'Деметре Тавдадебули',
  'პეტრიწის': 'Иоанна Петрици',
  'გელოვანის': 'Маршала Геловани',
  'ატენის': 'Атени',
  'მოსაშვილის': 'Мосашвили',
  'ყიფშიძის': 'Кипшидзе',
  'მიცკევიჩის': 'Мицкевича',
  'საირმის': 'Саирме',
  'გაგარინის': 'Гагарина',
  'გულუას': 'Гулуа',
  'ბოჭორმის': 'Бочорма',
  'ვოლსკის': 'Гр. Вольского',
  'დადიანის': 'Цотне Дадиани',
  'გურამიშვილის': 'Гурамишвили',
  'ხიზანიშვილის': 'Хизанишвили',
  'ჯავახეთის': 'Джавахети',
  'For Rent': 'Сдается',
  'Apartment for rent': 'Сдается квартира',
  'Flat for rent': 'Сдается квартира',
};

const GEO_CHAR_MAP: Record<string, string> = {
  'ა': 'а', 'ბ': 'б', 'გ': 'г', 'დ': 'д', 'ე': 'е', 'ვ': 'в', 'ზ': 'з', 'თ': 'т',
  'ი': 'и', 'კ': 'к', 'ლ': 'л', 'მ': 'м', 'ნ': 'ნ', 'ო': 'о', 'პ': 'п', 'ჟ': 'ж',
  'რ': 'р', 'ს': 'с', 'ტ': 'т', 'უ': 'у', 'ფ': 'ф', 'ქ': 'к', 'ღ': 'г', 'ყ': 'к',
  'შ': 'ш', 'ჩ': 'ч', 'ც': 'ц', 'ძ': 'дз', 'წ': 'ц', 'ჭ': 'ч', 'ხ': 'х', 'ჯ': 'дж', 'ჰ': 'х'
};
GEO_CHAR_MAP['ნ'] = 'н';

const RU_POST_FIXES: Array<[RegExp, string]> = [
  [/Сабурталозе/gi, 'в Сабуртало'],
  [/Вакеши/gi, 'в Ваке'],
  [/Веразе/gi, 'в Вера'],
  [/Дидубеши/gi, 'в Дидубе'],
  [/дид дигомши/gi, 'в Диди Дигоми'],
  [/Дигоми 1-9-ши/gi, 'в Дигоми 1-9'],
  [/дигомши/gi, 'в Дигоми'],
  [/багебши/gi, 'в Багеби'],
  [/варкетилши/gi, 'в Варкетили'],
  [/крцанисши/gi, 'в Крцаниси'],
  [/надзаладевши/gi, 'в Надзаладеви'],
  [/глданши/gi, 'в Глдани'],
  [/самгорши/gi, 'в Самгори'],
  [/исанши/gi, 'в Исани'],
  [/ортачалаши/gi, 'в Ортачала'],
  [/чугуретши/gi, 'в Чугурети'],
  [/сололакши/gi, 'в Сололаки'],
  [/авлабарши/gi, 'в Авлабари'],
  [/мтацминдазе/gi, 'на Мтацминда'],
  [/санзонаши/gi, 'в Санзона'],
  [/мухианши/gi, 'в Мухиани'],
  [/Нуцубидзе фердобзе/gi, 'на плато Нуцубидзе'],
  [/сакартвело/gi, 'Тбилиси'],
  [/Tbilisi/gi, 'Тбилиси'],
  [/(\d+)\s+-комнатная/g, '$1-комнатная'],
];

export function fallbackGeoToRu(text: string): string {
  if (!text) return '';
  let result = text;
  // Sort keys longest first so 'საბურთალოზე' matches before 'საბურთალო'
  const sortedEntries = Object.entries(GEO_DICT).sort((a, b) => b[0].length - a[0].length);
  for (const [geo, ru] of sortedEntries) {
    result = result.split(geo).join(ru);
  }
  // Transliterate remaining Georgian letters
  result = result.replace(/[\u10A0-\u10FF]/g, (char) => GEO_CHAR_MAP[char] || char);
  for (const [pattern, replacement] of RU_POST_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Fast synchronous translation & sanitization for high-volume bulk imports (up to 200 objects).
 */
export function translateApartmentFast(apt: Apartment): Apartment {
  if (!apt) return apt;
  const fallbackApt: Apartment = {
    ...apt,
    title: stripPhoneAndContactMentions(fallbackGeoToRu(apt.title)),
    address: fallbackGeoToRu(apt.address),
    description: stripPhoneAndContactMentions(fallbackGeoToRu(apt.description)),
    amenities: (apt.amenities || []).map(fallbackGeoToRu),
  };
  return sanitizeApartmentPhones(fallbackApt);
}

/**
 * Automatically translates apartment title, address, description, and amenities into clean Russian.
 */
export async function translateApartmentToRussian(apt: Apartment): Promise<Apartment> {
  if (!apt) return apt;

  const needsTranslation = 
    hasNonRussianText(apt.title) ||
    hasNonRussianText(apt.address) ||
    hasNonRussianText(apt.description) ||
    apt.amenities?.some(hasNonRussianText);

  if (!needsTranslation) {
    return sanitizeApartmentPhones(apt);
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Ты — профессиональный редактор и переводчик портала элитной и комфортной недвижимости Rentch в Тбилиси и Батуми.
Переведи все тексты об объекте недвижимости на безупречный, чистый, грамотный русский язык.

ИСХОДНЫЕ ДАННЫЕ (JSON):
${JSON.stringify({
  title: apt.title,
  address: apt.address,
  description: apt.description,
  amenities: apt.amenities || []
}, null, 2)}

ПРАВИЛА ПЕРЕВОДА:
1. "title": Сделай лаконичным и продающим на русском языке (например: "Сдается 3-комнатная квартира в Ваке, ул. Шроши" или "Уютная 2-комнатная квартира на ул. Царя Мириана").
2. "address": Переведи грузинские или английские названия улиц и районов на русский (например: "მირიან მეფის ქ. 106" -> "ул. Царя Мириана, 106"; "შროშის ქუჩა 2" -> "ул. Шроши, 2"; "მარშალი გელოვანი გამზირი" -> "проспект Маршала Геловани"; "ხიმშიაშვილის უბანი" -> "ул. Шерифа Химшиашвили, Батуми").
3. "description": Сделай связным, приятным и структурированным русским текстом. Убери грузинские символы. Сохрани все важные детали (ремонт, техника, вид, отопление, условия).
4. "amenities": Список удобств на русском языке (например: ["Кондиционер", "Балкон", "Стиральная машина", "Посудомойка", "Центральное отопление"]).
5. СТРОГО УДАЛИ любые номера телефонов (например: +995..., 599..., 5xx...), упоминания телефонов, WhatsApp, Viber, Telegram, призывы "звоните", "пишите мне в вотсап", "свяжитесь по номеру", "не звоните из агентств" и т.д. В описании и заголовке НЕ ДОЛЖНО БЫТЬ НИ ОДНОГО ТЕЛЕФОНА И НИ ОДНОГО УПОМИНАНИЯ СВЯЗИ.

ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON БЕЗ ЛИШНЕГО ТЕКСТА И БЕЗ MARKDOWN-РАЗМЕТКИ В ТАКОМ ФОРМАТЕ:
{
  "title": "...",
  "address": "...",
  "description": "...",
  "amenities": ["...", "..."]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text ? response.text.trim() : '';
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

      const parsed = JSON.parse(cleanJson);
      const translatedApt: Apartment = {
        ...apt,
        title: stripPhoneAndContactMentions(parsed.title || fallbackGeoToRu(apt.title)),
        address: parsed.address || fallbackGeoToRu(apt.address),
        description: stripPhoneAndContactMentions(parsed.description || fallbackGeoToRu(apt.description)),
        amenities: Array.isArray(parsed.amenities) && parsed.amenities.length > 0 ? parsed.amenities : apt.amenities,
      };
      return sanitizeApartmentPhones(translatedApt);
    } catch (err: any) {
      console.warn(`[Translator] Gemini API error for apartment ${apt.id}:`, err.message || err);
    }
  }

  // Fallback if AI unavailable or rate limited
  const fallbackApt: Apartment = {
    ...apt,
    title: stripPhoneAndContactMentions(fallbackGeoToRu(apt.title)),
    address: fallbackGeoToRu(apt.address),
    description: stripPhoneAndContactMentions(fallbackGeoToRu(apt.description)),
    amenities: (apt.amenities || []).map(fallbackGeoToRu),
  };
  return sanitizeApartmentPhones(fallbackApt);
}
