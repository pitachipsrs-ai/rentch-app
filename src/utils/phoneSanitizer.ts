/**
 * Utility to completely strip phone numbers, messenger handles, and phone contact prompts
 * from apartment titles, descriptions, and metadata.
 */

export function stripPhoneAndContactMentions(text: string = ''): string {
  if (!text) return '';

  let s = text;

  // 1. Temporarily standardize line breaks
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // 2. Remove common whole sentences or phrases dedicated to phone/messenger contact
  // e.g. "Для уточнения деталей и организации просмотра звоните: 599 92 14 83."
  // e.g. "☎️Моб/Whatsapp/Telegram: 555:45:18:22"
  // e.g. "🎥 Для видео и просмотра пишите мне в WhatsApp;"
  // e.g. "Свяжитесь со мной по телефону +995 599..."
  // e.g. "⛔️Не звоните из агентств⛔️"
  s = s.replace(/(?:[☎📞📱]?\s*(?:тел(?:ефон)?|моб(?:ильный)?|номер|phone|tel|mob|cell|contact|whatsapp|viber|telegram|ватсап|вайбер|телеграм|тг)[\w\s\/\.:–—]*[:\-–—]?\s*)?(?:\+?995[\s\-]?)?(?:5\d{2}[- :.]?\d{2}[- :.]?\d{2}[- :.]?\d{2}|5\d{2}[- :.]?\d{3}[- :.]?\d{3}|5\d{8})/gi, '');

  s = s.replace(/(?:для\s+(?:уточнения|связи|просмотра|информации|видео)[^.,;!?\n]*?)?(?:звоните|звонить|пишите|свяжитесь|связывайтесь)[^.,;!?\n]*(?:[☎📞📱]|номерам?|телефону?|whatsapp|viber|telegram|ватсап|вайбер|смс|\+?995|\b5\d{2}\b)[^.,;!?\n]*(?:[.;!?]|\n|$)/gi, '');

  s = s.replace(/[☎📞📱]\s*(?:Моб|Тел|Whatsapp|Telegram|Viber|Телефон)[^\n.<]*/gi, '');
  s = s.replace(/(?:пишите|звоните)\s+(?:мне\s+)?в\s+(?:whatsapp|viber|telegram|ватсап|вайбер|тг)[^\n.<]*/gi, '');
  s = s.replace(/(?:не\s+звоните|звонить\s+не\s+надо)[^\n.<]*/gi, '');
  s = s.replace(/(?:телефон|тел\.?|номер для связи|контактный номер)\s*[:\-–—]\s*[^\n.<]*/gi, '');

  // 3. Remove any remaining phone numbers formatted with +995 or 9-digit Georgian mobile numbers (starting with 5)
  s = s.replace(/(?:\+?995[\s\-]?)?\b5\d{2}[\s\-.:]?\d{2}[\s\-.:]?\d{2}[\s\-.:]?\d{2}\b/g, '');
  s = s.replace(/(?:\+?995[\s\-]?)?\b5\d{2}[\s\-.:]?\d{3}[\s\-.:]?\d{3}\b/g, '');
  s = s.replace(/(?:\+?995[\s\-]?)?\b5\d{8}\b/g, '');

  // 4. Remove leftover phone labels, messengers, and emojis
  s = s.replace(/\b(?:тел(?:ефон(?:а|у|ом)?)?|номер(?:а|у|ом)?\s+телефона|whatsapp|viber|ватсап|вайбер)\s*[:\-–—]?/gi, '');
  s = s.replace(/[☎📞📱]/g, '');

  // 5. Clean up extra punctuation left over by removed phrases (e.g. "; ;", "• :")
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n\s*[:;,\-–—]\s*\n/g, '\n');
  s = s.replace(/([.,;!?])\s*([.,;!?])+/g, '$1');

  // 6. Split lines and filter out empty/useless fragments
  const lines = s.split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^[:;,\.\-–—\s•*]+$/.test(l)) return false;
      if (/^(?:тел|телефон|моб|phone|tel|whatsapp|viber|звоните)[:\s\-–—.]*$/i.test(l)) return false;
      return true;
    });

  return lines.join('\n').trim();
}

export const DEFAULT_AGENT_PHONE = '+995 558 542 365';
export const DEFAULT_AGENT_WHATSAPP = '995558542365';

/**
 * Sanitize an entire apartment object by removing external phone numbers from
 * landlord, title, and description, replacing landlord contact with the specified agent phone.
 */
export function sanitizeApartmentPhones<T extends { title?: string; description?: string; landlord?: { phone?: string } }>(
  apt: T,
  replacementPhone: string = DEFAULT_AGENT_PHONE
): T {
  if (!apt) return apt;
  return {
    ...apt,
    title: stripPhoneAndContactMentions(apt.title || ''),
    description: stripPhoneAndContactMentions(apt.description || ''),
    landlord: apt.landlord ? {
      ...apt.landlord,
      phone: replacementPhone || DEFAULT_AGENT_PHONE,
    } : apt.landlord,
  };
}
