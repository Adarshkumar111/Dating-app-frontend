import React, { useEffect, useState } from 'react';
import { MdStar, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { getPremiumPlans, createPremiumPlan, updatePremiumPlan, deletePremiumPlan } from '../../services/adminService.js';

export default function AdminPremiumPlans() {
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    tier: '',
    duration: 30,
    price: 0,
    discount: 0,
    requestLimit: 50,
    features: [],
    advancedFeatures: {
      glitteryBackground: false,
      topPriority: false,
      viewAllUsers: false,
      viewFullProfile: false,
      viewAllPhotos: false,
      canMessageWithoutFollow: false,
      canViewFields: {
        name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false,
        itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false,
        countryOfOrigin: false, state: true, district: true, city: true, area: false,
        contact: false, email: false, education: true, occupation: true, languagesKnown: false,
        numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false
      }
    }
  });

  const loadPremiumPlans = async () => {
    try {
      setLoading(true);
      const data = await getPremiumPlans();
      // Force fixed order: diamond, gold, silver, bronze
      const order = ['diamond','gold','silver','bronze'];
      const byTier = Object.fromEntries((data || []).map(p => [String(p.tier || '').toLowerCase(), p]));
      const fixed = order.map(t => byTier[t]).filter(Boolean);
      setPremiumPlans(fixed);
    } catch (e) {
      setInfo('Failed to load premium plans: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPremiumPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      // Filter out empty lines from features
      const cleanedForm = {
        ...planForm,
        features: planForm.features.filter(f => f.trim())
      };
      await createPremiumPlan(cleanedForm);
      setInfo('Premium plan created successfully');
      setShowPlanModal(false);
      setPlanForm({ name: '', tier: '', duration: 30, price: 0, discount: 0, requestLimit: 50, features: [], advancedFeatures: { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canMessageWithoutFollow: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } } });
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to create premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleUpdatePlan = async () => {
    try {
      // Filter out empty lines from features
      const cleanedForm = {
        ...planForm,
        features: planForm.features.filter(f => f.trim())
      };
      await updatePremiumPlan(editingPlan._id, cleanedForm);
      setInfo('Premium plan updated successfully');
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: '', tier: '', duration: 30, price: 0, discount: 0, requestLimit: 50, features: [], advancedFeatures: { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } } });
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to update premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      await deletePremiumPlan(planId);
      setInfo('Premium plan deactivated successfully');
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to deactivate premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      tier: plan.tier || '',
      duration: plan.duration,
      price: plan.price,
      discount: plan.discount,
      requestLimit: plan.requestLimit,
      features: plan.features || [],
      advancedFeatures: plan.advancedFeatures || { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canMessageWithoutFollow: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } }
    });
    setShowPlanModal(true);
  };

  const openCreateForTier = (tier) => {
    setEditingPlan(null);
    setPlanForm({
      name: tier === 'diamond' ? 'Diamond Plan' : tier === 'gold' ? 'Gold Plan' : tier === 'silver' ? 'Silver Plan' : 'Bronze Plan',
      tier,
      duration: 30,
      price: 0,
      discount: 0,
      requestLimit: 50,
      features: [],
      advancedFeatures: { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canMessageWithoutFollow: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } }
    });
    setShowPlanModal(true);
  };

  return (
    <div className="space-y-6">
      {info && (
        <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-center font-medium">
          {info}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MdStar /> Premium Plans Management
        </h3>
        <button
          onClick={() => {
            setPlanForm({ name: '', tier: '', duration: 30, price: 0, discount: 0, requestLimit: 50, features: [], advancedFeatures: { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canMessageWithoutFollow: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } } });
            setEditingPlan(null);
            setShowPlanModal(true);
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
        >
          <MdAdd /> Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['diamond','gold','silver','bronze'].map((tier) => {
          const plan = premiumPlans.find(p => String(p.tier || '').toLowerCase() === tier);
          const palette =
            tier === 'diamond'
              ? { bg: '#E0F7FF', fg: '#0EA5E9', br: '#38BDF8' }
              : tier === 'gold'
              ? { bg: '#FCE7A2', fg: '#8B6B00', br: '#D4AF37' }
              : tier === 'silver'
              ? { bg: '#E5E7EB', fg: '#4B5563', br: '#C0C0C0' }
              : { bg: '#EFD6C2', fg: '#7C4A21', br: '#CD7F32' };
          return (
          <div key={plan?._id || tier} className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {plan?.name || (tier === 'diamond' ? 'Diamond Plan' : tier === 'gold' ? 'Gold Plan' : tier === 'silver' ? 'Silver Plan' : 'Bronze Plan')}
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border" style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.br }}>
                  {tier.toUpperCase()}
                </span>
              </h4>
              <div className="flex gap-2">
                {plan ? (
                  <>
                    <button onClick={() => openEditPlan(plan)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit /></button>
                    <button onClick={() => handleDeletePlan(plan._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><MdDelete /></button>
                  </>
                ) : (
                  <button onClick={() => openCreateForTier(tier)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">Create</button>
                )}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-600">Duration: <span className="font-semibold">{plan ? plan.duration : 0} day(s)</span></p>
              <p className="text-gray-600">Price: <span className="font-semibold text-green-600">${plan ? plan.price : 0}</span></p>
              {plan?.discount > 0 && (
                <p className="text-gray-600">Discount: <span className="font-semibold text-orange-600">{plan.discount}%</span></p>
              )}
              <p className="text-gray-600">Daily Requests: <span className="font-semibold text-purple-600">{plan ? plan.requestLimit : 0}</span></p>
            </div>
            
            {plan?.features && plan.features.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">Features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )})}
      </div>

      {premiumPlans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MdStar className="text-6xl mx-auto mb-4 text-gray-300" />
          <p className="text-xl">No premium plans created yet</p>
          <p>Create your first premium plan to get started</p>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                {editingPlan ? 'Edit Premium Plan' : 'Create New Premium Plan'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      placeholder="e.g., 30 Day Premium"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tier</label>
                    <select
                      value={planForm.tier}
                      onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select tier (optional)</option>
                      <option value="diamond">Diamond</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({...planForm, duration: parseInt(e.target.value || '30', 10)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({...planForm, price: parseFloat(e.target.value || '0')})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={planForm.discount}
                      onChange={(e) => setPlanForm({...planForm, discount: parseInt(e.target.value || '0', 10)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Request Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={planForm.requestLimit}
                      onChange={(e) => setPlanForm({...planForm, requestLimit: parseInt(e.target.value || '50', 10)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Features (one per line)</label>
                  <textarea
                    value={planForm.features.join('\n')}
                    onChange={(e) => setPlanForm({...planForm, features: e.target.value.split('\n')})}
                    placeholder="Unlimited messages&#10;Priority support&#10;Advanced search filters"
                    rows="6"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Advanced Features for all tiers */}
                {planForm.tier && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-lg font-bold text-purple-700 mb-4">Advanced Features ({String(planForm.tier).toUpperCase()})</h4>
                    
                    <div className="space-y-3 mb-4">
                      <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                        <input
                          type="checkbox"
                          checked={planForm.advancedFeatures?.glitteryBackground || false}
                          onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, glitteryBackground: e.target.checked}})}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-semibold text-gray-800">Glittery Background (Transparent GIF)</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                        <input
                          type="checkbox"
                          checked={planForm.advancedFeatures?.topPriority || false}
                          onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, topPriority: e.target.checked}})}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-semibold text-gray-800">Top Priority (Show on very top)</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                        <input
                          type="checkbox"
                          checked={planForm.advancedFeatures?.viewAllUsers || false}
                          onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, viewAllUsers: e.target.checked}})}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-semibold text-gray-800">View All Users</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                        <input
                          type="checkbox"
                          checked={planForm.advancedFeatures?.viewAllPhotos || false}
                          onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, viewAllPhotos: e.target.checked}})}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-semibold text-gray-800">View All Photos (Gallery)</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                        <input
                          type="checkbox"
                          checked={planForm.advancedFeatures?.canMessageWithoutFollow || false}
                          onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, canMessageWithoutFollow: e.target.checked}})}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-semibold text-gray-800">Allow Direct Messaging (without follow)</span>
                      </label>
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="font-bold text-gray-800 mb-3">Fields this tier can view:</h5>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {Object.keys(planForm.advancedFeatures?.canViewFields || {}).map(field => (
                          <label key={field} className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                            <input
                              type="checkbox"
                              checked={planForm.advancedFeatures?.canViewFields?.[field] || false}
                              onChange={(e) => setPlanForm({...planForm, advancedFeatures: {...planForm.advancedFeatures, canViewFields: {...planForm.advancedFeatures.canViewFields, [field]: e.target.checked}}})}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-gray-700">{field}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Note: Chat history is only visible to admin, not diamond users</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setPlanForm({ name: '', tier: '', duration: 30, price: 0, discount: 0, requestLimit: 50, features: [], advancedFeatures: { glitteryBackground: false, topPriority: false, viewAllUsers: false, viewFullProfile: false, viewAllPhotos: false, canMessageWithoutFollow: false, canViewFields: { name: true, age: true, dateOfBirth: false, fatherName: false, motherName: false, itNumber: false, itCardPhoto: false, gender: true, maritalStatus: true, disability: false, countryOfOrigin: false, state: true, district: true, city: true, area: false, contact: false, email: false, education: true, occupation: true, languagesKnown: false, numberOfSiblings: false, about: true, lookingFor: false, profilePhoto: true, galleryImages: false } } });
                    setEditingPlan(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
