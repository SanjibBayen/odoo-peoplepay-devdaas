import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import { INITIAL_SETTINGS } from '../../data/adminData.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className='space-y-5 max-w-4xl'>
      <PageHeader
        title='System Settings'
        subtitle='Organization profile, payroll fiscal rules, and automated integration policies.'
      />

      {savedMessage && (
        <div className='p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn'>
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className='space-y-6 text-xs'>
        {/* Organization Identity */}
        <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
          <h3 className='text-sm font-black text-[#1E293B] border-b border-gray-100 pb-2.5'>
            Organization Profile
          </h3>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Legal Business Name</label>
              <input
                type='text'
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Tax Registration Number (GSTIN/EIN)</label>
              <input
                type='text'
                value={settings.taxRegistrationNumber}
                onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
          </div>
        </div>

        {/* Payroll Rules */}
        <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
          <h3 className='text-sm font-black text-[#1E293B] border-b border-gray-100 pb-2.5'>
            Payroll Disbursal Configuration
          </h3>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Currency</label>
              <input
                type='text'
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Monthly Cutoff Day</label>
              <input
                type='number'
                min='1'
                max='31'
                value={settings.payrunCutoffDay}
                onChange={(e) => setSettings({ ...settings, payrunCutoffDay: Number(e.target.value) })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Standard Working Days</label>
              <input
                type='number'
                min='1'
                max='31'
                value={settings.workingDaysPerMonth}
                onChange={(e) => setSettings({ ...settings, workingDaysPerMonth: Number(e.target.value) })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            className='px-5 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer'
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
