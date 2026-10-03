import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Trash2, Mail, Phone, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { DEFAULT_AGENT_PHONE } from '../utils/phoneSanitizer';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteData?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onDeleteData,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 to-stone-850 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Политика конфиденциальности
                </h3>
                <p className="text-xs text-stone-400">
                  Rentch Privacy Policy & Google Play Compliance (v1.4)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-stone-700 text-xs sm:text-sm leading-relaxed">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-xs sm:text-sm">
                  Безопасность и защита ваших данных
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Сервис Rentch строго соблюдает стандарты Google Play User Data Policy и Общий регламент по защите данных (GDPR). Мы собираем минимум данных, необходимых исключительно для связи и организации осмотра жилья.
                </div>
              </div>
            </div>

            <section className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <span>1. Какие данные мы собираем</span>
              </h4>
              <p className="text-stone-600">
                Мы обрабатываем только ту информацию, которую вы добровольно предоставляете в приложении:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li>
                  <strong>Контактные данные:</strong> имя и номер телефона (запрашиваются только при подтверждении бронирования осмотра квартиры или отправке заявки на совместную аренду Double Rentch).
                </li>
                <li>
                  <strong>Параметры поиска:</strong> выбранный город, районы, ценовой диапазон и фильтры мебели/питомцев (хранятся локально на вашем устройстве).
                </li>
                <li>
                  <strong>История сообщений:</strong> диалог с администратором сервиса Rentch для согласования даты и времени показа квартиры.
                </li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>2. Цели использования данных</span>
              </h4>
              <p className="text-stone-600">
                Ваши контакты используются исключительно сотрудниками службы заботы Rentch для:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li>Связи в WhatsApp / Telegram / по телефону для подтверждения встречи на объекте.</li>
                <li>Координации совместного просмотра между соискателями формата 50/50.</li>
                <li>Мы никогда не продаём и не передаём персональные данные рекламным брокерам или посторонним третьим лицам.</li>
              </ul>
            </section>

            <section className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <h4 className="font-bold text-stone-900 flex items-center gap-2 text-rose-600">
                <Trash2 className="w-4 h-4" />
                <span>3. Право на удаление данных (Google Play User Data Deletion)</span>
              </h4>
              <p className="text-stone-600 text-xs">
                В соответствии с требованиями Google Play, вы имеете безусловное право на полное удаление всех ваших данных и истории заявок в 1 клик.
              </p>
              {onDeleteData && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите удалить все сохранённые данные, контакты и историю заявок?')) {
                        onDeleteData();
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить мои данные и историю из Rentch прямо сейчас</span>
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-1.5 text-xs text-stone-500 border-t border-stone-100 pt-3">
              <div className="font-bold text-stone-800">4. Контактная информация оператора</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  <span>Email: pita.chips.rs@gmail.com</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-500" />
                  <span>Телефон: {DEFAULT_AGENT_PHONE}</span>
                </div>
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                Rentch Real Estate Technologies • Тбилиси, Грузия • Дата последнего обновления: 2 октября 2026 г.
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-extrabold transition cursor-pointer"
            >
              Понятно, закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
