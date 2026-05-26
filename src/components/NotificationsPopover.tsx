import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OverlayPanel } from 'primereact/overlaypanel';

export function NotificationsPopover({ className }: { className?: string }) {
  const notifications = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray());
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const op = useRef<OverlayPanel>(null);

  const toggle = (e: React.MouseEvent) => {
    op.current?.toggle(e);
  };

  const markAsRead = async (id: string) => {
    await db.notifications.update(id, { isRead: true });
  };

  const markAllAsRead = async () => {
    if (!notifications) return;
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => db.notifications.update(n.id, { isRead: true })));
  };

  const clearAll = async () => {
    if (!notifications) return;
    await Promise.all(notifications.map(n => db.notifications.delete(n.id)));
  };

  return (
    <div className="relative">
      <button 
        onClick={toggle}
        className={className || "w-11 h-11 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer relative outline-none"}
      >
        <Bell className="w-5 h-5 text-slate-600 hover:text-blue-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      <OverlayPanel ref={op} className="w-[320px] rounded-3xl overflow-hidden shadow-2xl p-0 border border-slate-100" showCloseIcon={false}>
        <div className="flex flex-col h-[400px]" dir="rtl">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm">
            <h3 className="font-black text-blue-950 text-lg">الإشعارات</h3>
            <div className="flex items-center gap-2">
              <button onClick={markAllAsRead} className="px-2 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                تحديد كمقروء
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-sm font-bold">لا يوجد إشعارات حالياً</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${notification.isRead ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100 shadow-sm'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                       <span className="font-black text-sm text-blue-950">{notification.title}</span>
                       <span className="text-[10px] text-slate-400 font-bold bg-white/50 px-1.5 py-0.5 rounded-md">
                         {new Date(notification.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-slate-500' : 'text-slate-700 font-bold'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications && notifications.length > 0 && (
             <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
               <button onClick={clearAll} className="text-xs text-slate-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" />
                  حذف جميع الإشعارات
               </button>
             </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  );
}
