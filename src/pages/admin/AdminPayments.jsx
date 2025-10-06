import React, { useEffect, useState } from 'react';
import { MdPayment, MdStar } from 'react-icons/md';
import { getPaymentStats } from '../../services/adminService.js';

export default function AdminPayments() {
  const [paymentStats, setPaymentStats] = useState({ paidCount: 0, totalAmount: 0, premiumUsers: 0 });
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentStats();
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
        <h4 className="text-lg font-semibold mb-4 text-gray-700">Premium Users List</h4>
        <div className="text-center py-8 text-gray-500">
          <MdStar className="text-4xl mx-auto mb-2 text-gray-300" />
          <p>Premium users list will be displayed here</p>
          <p className="text-sm">Feature to be implemented</p>
        </div>
      </div>
    </div>
  );
}
