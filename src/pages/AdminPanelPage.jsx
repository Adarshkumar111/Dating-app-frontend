import React, { useEffect, useState } from 'react';
import { listUsers, approveUser, deleteUser, listChats } from '../services/adminService.js';

export default function AdminPanelPage() {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [tab, setTab] = useState('users');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (tab === 'users') (async () => setUsers(await listUsers()))();
    if (tab === 'chats') (async () => setChats(await listChats()))();
  }, [tab]);

  const onApprove = async (userId) => {
    await approveUser(userId);
    setInfo('User approved');
    setUsers(await listUsers());
  };

  const onDelete = async (userId) => {
    if (!confirm('Delete user?')) return;
    await deleteUser(userId);
    setInfo('User deleted');
    setUsers(await listUsers());
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Panel</h2>
      {info && <p className="mb-4 text-green-600 font-medium">{info}</p>}

      <div className="mb-6 space-x-2">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('chats')}
          className={`px-4 py-2 rounded ${tab === 'chats' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Chats
        </button>
      </div>

      {tab === 'users' && (
        <div className="overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">All Users</h3>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-blue-100 text-gray-700">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Gender</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2 capitalize">{u.status}</td>
                  <td className="px-4 py-2">{u.gender}</td>
                  <td className="px-4 py-2">{u.contact}</td>
                  <td className="px-4 py-2 space-x-2">
                    {u.status === 'pending' && (
                      <button
                        onClick={() => onApprove(u._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(u._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chats' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Chats</h3>
          {chats.map(c => (
            <div key={c._id} className="border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition">
              <div className="text-gray-800 font-medium">Chat ID: {c._id}</div>
              <div className="text-gray-600 text-sm">
                Users: {c.users?.map(u => u.name).join(', ')}
              </div>
              <div className="text-gray-500 text-xs mt-1">Messages: {c.messages?.length || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
