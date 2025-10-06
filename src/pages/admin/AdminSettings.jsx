import React, { useEffect, useState } from 'react';
import { MdSettings } from 'react-icons/md';
import { getSettings, updateSettings, getAppSettings, updateAppSettings } from '../../services/adminService.js';

export default function AdminSettings() {
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    freeUserRequestLimit: 2,
    premiumUserRequestLimit: 20,
  });
  const [appSettings, setAppSettings] = useState({ enabledFilters: {}, profileDisplayFields: {} });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([getSettings(), getAppSettings()]);
      setSettings(s || settings);
      setAppSettings(a || { enabledFilters: {}, profileDisplayFields: {} });
    } catch (e) {
      setInfo(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings(settings);
      setInfo('Settings updated');
    } catch (e) {
      setInfo('Failed to update settings: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleFilterControlsSave = async () => {
    try {
      await updateAppSettings({ enabledFilters: appSettings.enabledFilters || {} });
      setInfo('Filter controls saved');
    } catch (e) {
      setInfo('Failed to save filter controls: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleProfileDisplaySave = async () => {
    try {
      await updateAppSettings({ profileDisplayFields: appSettings.profileDisplayFields || {} });
      setInfo('Profile display settings saved');
    } catch (e) {
      setInfo('Failed to save profile display settings: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <MdSettings /> Request Limit Settings
      </h3>

      {info && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">{info}</div>
      )}

      {/* Request Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Free User Daily Request Limit
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.freeUserRequestLimit}
            onChange={(e) => setSettings({ ...settings, freeUserRequestLimit: parseInt(e.target.value || '0', 10) })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-sm text-gray-500 mt-1">Number of follow requests free users can send per day</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Premium User Daily Request Limit
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={settings.premiumUserRequestLimit}
            onChange={(e) => setSettings({ ...settings, premiumUserRequestLimit: parseInt(e.target.value || '0', 10) })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-sm text-gray-500 mt-1">Number of follow requests premium users can send per day</p>
        </div>
      </div>

      <button
        onClick={handleSettingsUpdate}
        className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
      >
        Save Settings
      </button>

      {/* Filter Controls */}
      <div className="mt-10 border-t pt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Filter Controls</h3>
        <p className="text-sm text-gray-500 mb-4">Toggle which filters appear on the user dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['age','Age'],
            ['education','Education'],
            ['occupation','Occupation'],
            ['nameSearch','Name Search']
          ].map(([key,label]) => (
            <label key={key} className="flex items-center gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={!!appSettings.enabledFilters?.[key]}
                onChange={(e) => setAppSettings({
                  ...appSettings,
                  enabledFilters: { ...(appSettings.enabledFilters || {}), [key]: e.target.checked }
                })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleFilterControlsSave}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Save Filter Controls
        </button>
      </div>

      {/* Profile Display Controls */}
      <div className="mt-10 border-t pt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Profile Display Controls</h3>
        <p className="text-sm text-gray-500 mb-4">Toggle which fields are visible on user cards in the dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            ['name','Name'],
            ['profilePhoto','Profile Photo'],
            ['age','Age'],
            ['location','Location'],
            ['education','Education'],
            ['occupation','Occupation'],
            ['about','About'],
            ['fatherName','Father\'s Name'],
            ['motherName','Mother\'s Name'],
            ['contact','Contact'],
            ['email','Email'],
            ['itNumber','IT Number']
          ].map(([key,label]) => (
            <label key={key} className="flex items-center gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={!!appSettings.profileDisplayFields?.[key]}
                onChange={(e) => setAppSettings({
                  ...appSettings,
                  profileDisplayFields: { ...(appSettings.profileDisplayFields || {}), [key]: e.target.checked }
                })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleProfileDisplaySave}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Save Profile Display
        </button>
      </div>
    </div>
  );
}
