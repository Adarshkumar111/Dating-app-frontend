import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MdSettings } from 'react-icons/md';
import { getSettings, updateSettings, getAppSettings, updateAppSettings, uploadPreAuthBanner } from '../../services/adminService.js';

export default function AdminSettings() {
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    freeUserRequestLimit: 2,
    premiumUserRequestLimit: 20,
    notifyFollowRequestEmail: false,
  });
  const [appSettings, setAppSettings] = useState({ enabledFilters: {}, profileDisplayFields: {}, preAuthBanner: { enabled: false, imageUrl: '' }, auth: { loginIdentifier: 'email' }, profileIdVisibilityMode: 'public' });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([getSettings(), getAppSettings()]);
      setSettings(prev => ({ ...(prev || {}), ...(s || {}) }));
      setAppSettings({ enabledFilters: {}, profileDisplayFields: {}, preAuthBanner: { enabled: false, imageUrl: '' }, auth: { loginIdentifier: 'email' }, profileIdVisibilityMode: 'public', ...(a || {}) });
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setInfo(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilitySave = async () => {
    try {
      await updateAppSettings({ profileIdVisibilityMode: appSettings.profileIdVisibilityMode || 'public' });
      setInfo('User ID visibility mode saved');
      toast.success('User ID visibility mode saved');
    } catch (e) {
      const msg = 'Failed to save visibility mode: ' + (e.response?.data?.message || e.message);
      setInfo(msg);
      toast.error(msg);
    }
  };

  const onPreAuthFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { imageUrl } = await uploadPreAuthBanner(file)
      setAppSettings(prev => ({ ...prev, preAuthBanner: { ...(prev.preAuthBanner || {}), imageUrl } }))
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      e.target.value = ''
    }
  }

  const handlePreAuthBannerSave = async () => {
    try {
      await updateAppSettings({ preAuthBanner: appSettings.preAuthBanner || { enabled: false, imageUrl: '' } });
      setInfo('Pre-auth banner saved');
      toast.success('Pre-auth banner saved');
      await loadAll();
    } catch (e) {
      const msg = 'Failed to save pre-auth banner: ' + (e.response?.data?.message || e.message);
      setInfo(msg);
      toast.error(msg);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings(settings);
      setInfo('Settings updated');
      toast.success('Settings updated');
      await loadAll();
    } catch (e) {
      const msg = 'Failed to update settings: ' + (e.response?.data?.message || e.message);
      setInfo(msg);
      toast.error(msg);
    }
  };

  const handleFilterControlsSave = async () => {
    try {
      await updateAppSettings({ enabledFilters: appSettings.enabledFilters || {} });
      setInfo('Filter controls saved');
      toast.success('Filter controls saved');
    } catch (e) {
      const msg = 'Failed to save filter controls: ' + (e.response?.data?.message || e.message);
      setInfo(msg);
      toast.error(msg);
    }
  };

  const handleProfileDisplaySave = async () => {
    try {
      await updateAppSettings({ profileDisplayFields: appSettings.profileDisplayFields || {} });
      setInfo('Profile display settings saved');
      toast.success('Profile display settings saved');
    } catch (e) {
      const msg = 'Failed to save profile display settings: ' + (e.response?.data?.message || e.message);
      setInfo(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <MdSettings /> Request & Notification Settings
      </h3>

      {/* Inline info banner removed; toasts will show feedback */}

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

      {/* User ID Visibility Mode */}
      <div className="mt-10 border-t pt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">User ID Visibility</h3>
        <p className="text-sm text-gray-500 mb-4">Choose how profile ID is handled across the app.</p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 p-3 border rounded-lg">
            <input
              type="radio"
              name="idVisibility"
              checked={(appSettings.profileIdVisibilityMode || 'public') === 'public'}
              onChange={() => setAppSettings(prev => ({ ...(prev || {}), profileIdVisibilityMode: 'public' }))}
            />
            <span>
              Public mode — Default is public, and users can choose Public or Private in their settings.
            </span>
          </label>
          <label className="flex items-center gap-2 p-3 border rounded-lg">
            <input
              type="radio"
              name="idVisibility"
              checked={(appSettings.profileIdVisibilityMode || 'public') === 'private'}
              onChange={() => setAppSettings(prev => ({ ...(prev || {}), profileIdVisibilityMode: 'private' }))}
            />
            <span>
              Private mode — All users are forced to Private; user option is hidden.
            </span>
          </label>
        </div>
        <button
          onClick={handleVisibilitySave}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
        >
          Save Visibility Mode
        </button>
      </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Premium User Daily Request Limit (fallback)
          </label>
          <input
            type="number"
            min="1"
            max="500"
            value={settings.premiumUserRequestLimit}
            onChange={(e) => setSettings({ ...settings, premiumUserRequestLimit: parseInt(e.target.value || '0', 10) })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-sm text-gray-500 mt-1">Used when a premium plan doesn’t have its own requestLimit. Plan-specific limit takes priority.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Notifications for Follow Requests
          </label>
          <label className="inline-flex items-center gap-3 p-3 border rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!settings.notifyFollowRequestEmail}
              onChange={(e) => setSettings({ ...settings, notifyFollowRequestEmail: e.target.checked })}
            />
            <span className="text-gray-700">Send email to target user when someone sends a follow request (requires SMTP configured)</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">Admin can toggle whether users receive email notifications for new follow requests.</p>
        </div>
      </div>

      <button
        onClick={handleSettingsUpdate}
        className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
      >
        Save Settings
      </button>

      {/* Auth Settings removed: app uses email-only login */}

      {/* Pre-Auth Banner Controls */}
      <div className="mt-10 border-t pt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Pre-Auth Banner</h3>
        <p className="text-sm text-gray-500 mb-4">If enabled, this image will be shown to users before Login and Signup with an OK button.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <label className="flex items-center gap-2 p-3 border rounded-lg md:col-span-1">
            <input
              type="checkbox"
              checked={!!appSettings.preAuthBanner?.enabled}
              onChange={(e) => setAppSettings({
                ...appSettings,
                preAuthBanner: { ...(appSettings.preAuthBanner || {}), enabled: e.target.checked }
              })}
            />
            <span>Enable Banner</span>
          </label>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={onPreAuthFileSelected}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {!!appSettings.preAuthBanner?.imageUrl && (
              <div className="mt-3">
                {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                <img src={appSettings.preAuthBanner.imageUrl} alt="Preview image" className="max-h-48 rounded border" />
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handlePreAuthBannerSave}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Save Pre-Auth Banner
        </button>
      </div>

      {/* Filter Controls */}
      <div className="mt-10 border-t pt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Filter Controls</h3>
        <p className="text-sm text-gray-500 mb-4">Toggle which filters appear on the user dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['age','Age'],
            ['education','Education'],
            ['state','State'],
            ['district','District'],
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
            ['gender','Gender'],
            ['age','Age'],
            ['dateOfBirth','Date of Birth'],
            ['location','Location'],
            ['state','State'],
            ['district','District'],
            ['city','City'],
            ['area','Area'],
            ['education','Education'],
            ['occupation','Occupation'],
            ['about','About'],
            ['fatherName','Father\'s Name'],
            ['motherName','Mother\'s Name'],
            ['maritalStatus','Marital Status'],
            ['disability','Disability'],
            ['countryOfOrigin','Country of Origin'],
            ['languagesKnown','Languages Known'],
            ['numberOfSiblings','Number of Siblings'],
            ['lookingFor','Looking For'],
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
