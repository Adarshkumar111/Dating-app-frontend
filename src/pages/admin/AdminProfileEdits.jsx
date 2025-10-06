import React, { useEffect, useState } from 'react';
import { getPendingProfileEdits, approveProfileEditApi, rejectProfileEditApi } from '../../services/adminService.js';

export default function AdminProfileEdits() {
  const [pendingEdits, setPendingEdits] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingEdits();
  }, []);

  const loadPendingEdits = async () => {
    try {
      setLoading(true);
      const data = await getPendingProfileEdits();
      setPendingEdits(data || []);
    } catch (e) {
      setInfo('Failed to load pending edits: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const approveEdit = async (userId) => {
    try {
      await approveProfileEditApi(userId);
      setInfo('Profile edit approved');
      await loadPendingEdits();
    } catch (e) {
      setInfo('Failed to approve edit: ' + (e.response?.data?.message || e.message));
    }
  };

  const rejectEdit = async (userId) => {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    try {
      await rejectProfileEditApi(userId, reason);
      setInfo('Profile edit rejected');
      await loadPendingEdits();
    } catch (e) {
      setInfo('Failed to reject edit: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Pending Profile Edits</h3>

      {info && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">{info}</div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : pendingEdits.length === 0 ? (
        <div className="text-gray-600">No pending edits.</div>
      ) : (
        <div className="space-y-4">
          {pendingEdits.map(u => (
            <div key={u._id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={u.profilePhoto || '/placeholder.png'} alt="profile" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                <div>
                  <div className="font-semibold text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <div className="text-xs text-gray-500">Last update: {new Date(u.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-gray-50 border rounded p-3 text-sm">
                {(u.changedFields && u.changedFields.length > 0) ? (
                  <div className="space-y-3">
                    {u.changedFields.map((cf, idx) => (
                      <div key={idx} className="border-b pb-3 last:border-0">
                        <div className="font-semibold text-gray-800 mb-1">This user wants to change <span className="text-blue-700">{cf.field}</span>:</div>
                        {cf.valueType === 'image' && typeof cf.new === 'string' ? (
                          <div className="flex items-center gap-3">
                            {cf.old && (
                              <>
                                <div className="text-xs text-gray-500">Old:</div>
                                <img src={cf.old} alt="old" className="w-16 h-16 object-cover rounded" />
                              </>
                            )}
                            <div className="text-xs text-gray-500">New:</div>
                            <img src={cf.new} alt="new" className="w-16 h-16 object-cover rounded border" />
                          </div>
                        ) : cf.valueType === 'gallery' && Array.isArray(cf.new) ? (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">New gallery:</div>
                            <div className="grid grid-cols-4 gap-2">
                              {cf.new.map((url, gi) => (
                                <img key={gi} src={url} alt={`g-${gi}`} className="w-16 h-16 object-cover rounded border" />
                              ))}
                            </div>
                            {Array.isArray(cf.old) && cf.old.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Old gallery:</div>
                                <div className="grid grid-cols-4 gap-2">
                                  {cf.old.map((url, gi) => (
                                    <img key={gi} src={url} alt={`old-g-${gi}`} className="w-12 h-12 object-cover rounded border opacity-70" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            <div className="text-xs text-gray-500">Old:</div>
                            <div className="p-2 bg-white rounded border text-xs break-words">{String(cf.old ?? '')}</div>
                            <div className="text-xs text-gray-500 mt-2">New:</div>
                            <div className="p-2 bg-white rounded border text-xs break-words">{String(cf.new ?? '')}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600">No diffs found.</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => approveEdit(u._id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                <button onClick={() => rejectEdit(u._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
