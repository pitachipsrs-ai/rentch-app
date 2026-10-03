import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { stripPhoneAndContactMentions, sanitizeApartmentPhones } from '../src/utils/phoneSanitizer';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function cleanDescriptionWithGemini(title: string, desc: string): Promise<string> {
  // If description doesn't contain contact hints, just run sanitizer
  const contactRegex = /(\+?995|\b5\d{2}[- :.]?\d{2}[- :.]?\d{2}[- :.]?\d{2}\b|\b5\d{8}\b|\+41|\+972|\+1|whatsapp|viber|telegram|ватсап|вайбер|телеграм|звоните|пишите|свяжитесь|номер|телефон|моб|☎|📞|📱)/i;
  
  if (!contactRegex.test(desc)) {
    return stripPhoneAndContactMentions(desc);
  }

  const prompt = `Ты — профессиональный редактор текстов портала недвижимости Rentch.
Твоя задача — аккуратно отредактировать описание квартиры на русском языке, ПОЛНОСТЬЮ УДАЛИВ любые контактные данные.

СТРОГИЕ ПРАВИЛА:
1. Удали абсолютно ВСЕ номера телефонов (грузинские, международные, мобильные).
2. Удали любые упоминания мессенджеров (WhatsApp, Viber, Telegram, ТГ, Ватсап и т.д.).
3. Удали любые призывы связаться ("звоните", "пишите", "свяжитесь со мной", "для просмотра звоните/пишите", "контакты для связи", "убедительная просьба к агентствам не звонить" и т.п.).
4. Удали значки телефонов (☎, 📞, 📱).
5. Сохрани ВСЕ полезные характеристики квартиры (район, ремонт, мебель, техника, видовые характеристики, условия аренды, срок, этаж, парковка, интернет, ТВ).
6. Текст должен оставаться связным, грамотным и красивым русским языком.

ЗАГОЛОВОК: "${title}"
ИСХОДНОЕ ОПИСАНИЕ:
"""
${desc}
"""

ВЕРНИ ТОЛЬКО ОТРЕДАКТИРОВАННЫЙ ТЕКСТ ОПИСАНИЯ БЕЗ КАВЫЧЕК, БЕЗ ВВОДНЫХ СЛОВ И БЕЗ MARKDOWN-РАЗМЕТКИ.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    const result = response.text ? response.text.trim() : '';
    if (result && result.length > 20) {
      return stripPhoneAndContactMentions(result);
    }
  } catch (err: any) {
    console.warn(`Gemini cleaning error: ${err.message || err}`);
  }

  return stripPhoneAndContactMentions(desc);
}

async function run() {
  const filePath = path.join(process.cwd(), 'data', 'apartments.json');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const apartments = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Processing ${apartments.length} apartments...`);

  const updated = [];
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    console.log(`[${i + 1}/${apartments.length}] Processing ${apt.id}: ${apt.title.slice(0, 40)}...`);

    const cleanedDesc = await cleanDescriptionWithGemini(apt.title, apt.description || '');
    const cleanedTitle = stripPhoneAndContactMentions(apt.title || '');

    const sanitizedApt = sanitizeApartmentPhones({
      ...apt,
      title: cleanedTitle,
      description: cleanedDesc,
    });

    updated.push(sanitizedApt);
  }

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`Successfully updated ${filePath}`);

  // Also update realApartments.json if present
  const realPath = path.join(process.cwd(), 'data', 'realApartments.json');
  if (fs.existsSync(realPath)) {
    fs.writeFileSync(realPath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log(`Also synchronized ${realPath}`);
  }
}

run().catch(console.error);
