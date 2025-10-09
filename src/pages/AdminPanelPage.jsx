import React, { useEffect, useState } from 'react';
import { MdWarning, MdSettings, MdStar, MdPayment, MdNotifications } from 'react-icons/md';

import AdminUsers from './admin/AdminUsers.jsx';
import AdminSpammers from './admin/AdminSpammers.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import AdminPremiumPlans from './admin/AdminPremiumPlans.jsx';
import AdminPayments from './admin/AdminPayments.jsx';
import AdminProfileEdits from './admin/AdminProfileEdits.jsx';
import AdminHelpRequests from './admin/AdminHelpRequests.jsx';
import AdminNotifications from './admin/AdminNotifications.jsx';
import AdminPreAuthScreen from './admin/AdminPreAuthScreen.jsx';
import AdminOnboardingSlides from './admin/AdminOnboardingSlides.jsx';
import { getHelpRequestStats } from '../services/helpService.js';
import { onSocketEvent } from '../services/socketService.js';

export default function AdminPanelPage() {
  const [tab, setTab] = useState('users');
  const [helpStats, setHelpStats] = useState({ totalCount: 0, pendingCount: 0, totalUnreadMessages: 0, totalDisplay: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await getHelpRequestStats();
        setHelpStats(stats);
      } catch (_) {
        setHelpStats({ totalCount: 0, pendingCount: 0, totalUnreadMessages: 0, totalDisplay: 0 });
      }
    };
    load();
    
    // Listen for socket events to refresh in real-time
    const unsubscribe = onSocketEvent('adminRequest', (payload) => {
      if (payload.kind === 'help:newMessage' || payload.kind === 'help:messagesSeen' || 
          payload.kind === 'help:new' || payload.kind === 'help:update') {
        load(); // Refresh stats immediately
      }
    });
    
    const i = setInterval(load, 60000); // Backup refresh every 60 seconds
    return () => {
      clearInterval(i);
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
        {/* Tabs - Responsive */}
        <div className="mb-4 md:mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('users')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition ${tab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All Users
          </button>
          <button
            onClick={() => setTab('spammers')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition flex items-center gap-1 ${tab === 'spammers' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdWarning className="text-lg" /> <span className="hidden sm:inline">Spammers</span><span className="sm:hidden">Spam</span>
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition flex items-center gap-1 ${tab === 'settings' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdSettings className="text-lg" /> Settings
          </button>
          <button
            onClick={() => setTab('preauth')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition ${tab === 'preauth' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Signup/Login Screen
          </button>
          <button
            onClick={() => setTab('premium')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition flex items-center gap-1 ${tab === 'premium' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdStar className="text-lg" /> <span className="hidden sm:inline">Premium Plans</span><span className="sm:hidden">Premium</span>
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition flex items-center gap-1 ${tab === 'payments' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdPayment className="text-lg" /> Payments
          </button>
          <button
            onClick={() => setTab('onboarding')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition ${tab === 'onboarding' ? 'bg-teal-700 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Onboarding Slides
          </button>
          <button
            onClick={() => setTab('edits')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition ${tab === 'edits' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📝 <span className="hidden sm:inline">Profile </span>Edits
          </button>
          <button
            onClick={() => setTab('help')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition relative ${tab === 'help' ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            ❓ Help Requests
            {helpStats.totalCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center text-xs font-bold rounded-full px-2 py-0.5 bg-red-600 text-white">
                {helpStats.totalDisplay || helpStats.totalCount}
              </span>
            )}
            {helpStats.totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition flex items-center gap-1 ${tab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdNotifications className="text-lg" /> <span className="hidden sm:inline">Send </span>Notifications
          </button>
          
        </div>

        {/* Tab bodies in a scrollable area (mobile gets top padding via CSS) */}
        <div className="admin-scroll overflow-y-auto">
          {tab === 'users' && <AdminUsers />}
          {tab === 'spammers' && <AdminSpammers />}
          {tab === 'settings' && <AdminSettings />}
          {tab === 'premium' && <AdminPremiumPlans />}
          {tab === 'payments' && <AdminPayments />}
          {tab === 'edits' && <AdminProfileEdits />}
          {tab === 'help' && <AdminHelpRequests />}
          {tab === 'notifications' && <AdminNotifications />}
          {tab === 'preauth' && <AdminPreAuthScreen />}
          {tab === 'onboarding' && <AdminOnboardingSlides />}
        </div>
      </div>
    </div>
  );
}
