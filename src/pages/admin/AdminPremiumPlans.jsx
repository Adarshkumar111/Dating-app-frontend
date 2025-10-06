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
    duration: 1,
    price: 0,
    discount: 0,
    requestLimit: 50,
    features: [],
  });

  useEffect(() => {
    loadPremiumPlans();
  }, []);

  const loadPremiumPlans = async () => {
    try {
      setLoading(true);
      const data = await getPremiumPlans();
      setPremiumPlans(data);
    } catch (e) {
      setInfo('Failed to load premium plans: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await createPremiumPlan(planForm);
      setInfo('Premium plan created successfully');
      setShowPlanModal(false);
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to create premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleUpdatePlan = async () => {
    try {
      await updatePremiumPlan(editingPlan._id, planForm);
      setInfo('Premium plan updated successfully');
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
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
      duration: plan.duration,
      price: plan.price,
      discount: plan.discount,
      requestLimit: plan.requestLimit,
      features: plan.features || [],
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
            setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
            setEditingPlan(null);
            setShowPlanModal(true);
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
        >
          <MdAdd /> Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {premiumPlans.map(plan => (
          <div key={plan._id} className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-gray-800">{plan.name}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditPlan(plan)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <MdEdit />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-600">Duration: <span className="font-semibold">{plan.duration} month(s)</span></p>
              <p className="text-gray-600">Price: <span className="font-semibold text-green-600">${plan.price}</span></p>
              {plan.discount > 0 && (
                <p className="text-gray-600">Discount: <span className="font-semibold text-orange-600">{plan.discount}%</span></p>
              )}
              <p className="text-gray-600">Daily Requests: <span className="font-semibold text-purple-600">{plan.requestLimit}</span></p>
            </div>
            
            {plan.features && plan.features.length > 0 && (
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
        ))}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="e.g., 1 Month Premium"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (months)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({...planForm, duration: parseInt(e.target.value || '1', 10)})}
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
                    onChange={(e) => setPlanForm({...planForm, features: e.target.value.split('\n').filter(f => f.trim())})}
                    placeholder="Unlimited messages&#10;Priority support&#10;Advanced search filters"
                    rows="4"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
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
