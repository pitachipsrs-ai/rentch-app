import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Send, X, Sparkles, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../types';

interface RealTimeNotificationToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onClick: (notification: NotificationItem) => void;
}

export const RealTimeNotificationToast: React.FC<RealTimeNotificationToastProps> = ({
  notification,
  onDismiss,
  onClick,
}) => {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="realtime-notification-toast"
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        className="fixed top-18 right-4 sm:right-6 z-50 max-w-sm w-full bg-stone-900 text-white p-4 rounded-3xl shadow-2xl border border-rose-500/30 backdrop-blur-md cursor-pointer group"
        onClick={() => onClick(notification)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            {notification.type === 'telegram_sync' ? (
              <Send className="w-5 h-5 ml-0.5 text-sky-200" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-200" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold uppercase tracking-wider">
              <span>Rentch Live Alert</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h4 className="font-bold text-sm text-white truncate mt-0.5">
              {notification.title}
            </h4>
            <p className="text-xs text-stone-300 line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1 text-sky-400">
            <Send className="w-3 h-3" /> Передано в Telegram-бот
          </span>
          <span className="text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Открыть <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
