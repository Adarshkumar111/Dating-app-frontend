import React, { useState } from 'react';
import { MdWarning, MdSettings, MdStar, MdPayment } from 'react-icons/md';

import AdminUsers from './admin/AdminUsers.jsx';
import AdminSpammers from './admin/AdminSpammers.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import AdminPremiumPlans from './admin/AdminPremiumPlans.jsx';
import AdminPayments from './admin/AdminPayments.jsx';
import AdminProfileEdits from './admin/AdminProfileEdits.jsx';

export default function AdminPanelPage() {
  const [tab, setTab] = useState('users');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All Users
          </button>
          <button
            onClick={() => setTab('spammers')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'spammers' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdWarning /> Spammers
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'settings' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdSettings /> Settings
          </button>
          <button
            onClick={() => setTab('premium')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'premium' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdStar /> Premium Plans
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'payments' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <MdPayment /> Payments
          </button>
          <button
            onClick={() => setTab('edits')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${tab === 'edits' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📝 Profile Edits
          </button>
        </div>

        {/* Tab bodies */}
        {tab === 'users' && <AdminUsers />}
        {tab === 'spammers' && <AdminSpammers />}
        {tab === 'settings' && <AdminSettings />}
        {tab === 'premium' && <AdminPremiumPlans />}
        {tab === 'payments' && <AdminPayments />}
        {tab === 'edits' && <AdminProfileEdits />}
      </div>
    </div>
  );
}
