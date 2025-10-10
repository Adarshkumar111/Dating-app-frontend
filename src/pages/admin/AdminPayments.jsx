import React, { useEffect, useState } from 'react';
import { MdPayment, MdStar } from 'react-icons/md';
import { getPaymentStats, getPremiumUsers, cancelUserPremium } from '../../services/adminService.js';

export default function AdminPayments() {
  const [paymentStats, setPaymentStats] = useState({ paidCount: 0, totalAmount: 0, premiumUsers: 0 });
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [premiumUsers, setPremiumUsers] = useState([]);

  useEffect(() => {
    loadPaymentStats();
    loadPremiumUsers();
  }, []);

  const loadPaymentStats = async () => {
    try {
      setLoading(true);
      const data = await getPaymentStats();
      setPaymentStats(data);
    } catch (e) {
      setInfo('Failed to load payment stats: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumUsers = async () => {
    try {
      setLoading(true);
      const data = await getPremiumUsers();
      setPremiumUsers(data || []);
    } catch (e) {
      setInfo('Failed to load premium users: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPremium = async (userId) => {
    if (!window.confirm('Cancel premium for this user?')) return;
    try {
      await cancelUserPremium(userId);
      setInfo('Premium cancelled successfully');
      loadPaymentStats();
      loadPremiumUsers();
    } catch (e) {
      setInfo('Failed to cancel premium: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="space-y-6">
      {info && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-center font-medium">
          {info}
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <MdPayment /> Payment Analytics
      </h3>

      {/* Payment Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-3xl font-bold text-green-600">{paymentStats.paidCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MdPayment className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-600">₹{paymentStats.totalAmount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MdStar className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Premium Users</p>
              <p className="text-3xl font-bold text-purple-600">{paymentStats.premiumUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MdStar className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-700">Premium Users</h4>
        {premiumUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MdStar className="text-4xl mx-auto mb-2 text-gray-300" />
            <p>No premium users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Expires</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {premiumUsers.map(u => {
                  const tier = String(u.premiumTier || '').toLowerCase();
                  const bg = tier === 'gold' ? '#FCE7A2' : tier === 'silver' ? '#E5E7EB' : '#EFD6C2';
                  const fg = tier === 'gold' ? '#8B6B00' : tier === 'silver' ? '#4B5563' : '#7C4A21';
                  const br = tier === 'gold' ? '#D4AF37' : tier === 'silver' ? '#C0C0C0' : '#CD7F32';
                  return (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {u.profilePhoto ? (
                              <img src={u.profilePhoto} alt="" className="w-9 h-9 object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-gray-600">{(u.name || '?')[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email || u.contact}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {tier ? (
                          <span className="px-2 py-0.5 text-xs font-extrabold rounded-full border" style={{ backgroundColor: bg, color: fg, borderColor: br }}>
                            {tier.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{u?.premiumPlan?.name || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString() : '—'}</td>
                      <td className="py-3 pr-0">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleCancelPremium(u._id)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100"
                          >
                            Cancel Premium
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
