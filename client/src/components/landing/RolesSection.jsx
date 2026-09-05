import React from 'react';

export default function RolesSection() {
  const roles = [
    {
      name: 'Employee',
      desc: 'Clock in, request time off, and download digital payslips anytime.',
      badge: 'Self-Service',
      icon: '🧑‍💻',
      cardStyle:
        'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300',
      badgeStyle: 'bg-emerald-100 text-emerald-800',
    },
    {
      name: 'HR Manager',
      desc: 'Manage staff profiles, department structures, and approve leave requests.',
      badge: 'People Ops',
      icon: '👩‍💼',
      cardStyle: 'bg-blue-50/60 border-blue-200/80 hover:border-blue-300',
      badgeStyle: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Payroll User',
      desc: 'Reconcile attendance logs and compute monthly salary batches.',
      badge: 'Calculations',
      icon: '📊',
      cardStyle: 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300',
      badgeStyle: 'bg-amber-100 text-amber-800',
    },
    {
      name: 'Payroll Manager',
      desc: 'Verify wage computations and authorize final pay disbursements.',
      badge: 'Authorization',
      icon: '🛡️',
      cardStyle: 'bg-purple-50/60 border-purple-200/80 hover:border-purple-300',
      badgeStyle: 'bg-purple-100 text-purple-800',
    },
    {
      name: 'Admin',
      desc: 'Configure organization settings, roles, and system security controls.',
      badge: 'Management',
      icon: '⚙️',
      cardStyle: 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300',
      badgeStyle: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <section
      id='solutions'
      className='py-20 bg-[#FAF8F5] relative overflow-hidden'
      aria-labelledby='roles-title'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header with Handwritten Label */}
        <div className='text-center max-w-2xl mx-auto mb-14'>
          <div className='inline-block rotate-1 mb-2'>
            <span className='font-handwriting text-2xl font-bold text-[#714B67] marker-pink px-2.5 py-0.5'>
              Personalized Workspaces
            </span>
          </div>
          <h2
            id='roles-title'
            className='text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight'
          >
            Made for every role.
          </h2>
          <p className='mt-3 text-base text-gray-600 font-normal'>
            Everyone in your company gets the exact view and permissions they
            need.
          </p>
        </div>

        {/* 5 Compact Role Cards Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
          {roles.map((role, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border ${role.cardStyle} shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1`}
            >
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-3xl group-hover:scale-110 transition-transform select-none'>
                    {role.icon}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.badgeStyle}`}
                  >
                    {role.badge}
                  </span>
                </div>

                <h3 className='text-base font-bold text-[#1E293B]'>
                  {role.name}
                </h3>

                <p className='mt-2 text-xs text-gray-600 leading-relaxed font-normal'>
                  {role.desc}
                </p>
              </div>

              <div className='mt-4 pt-2 border-t border-gray-200/40 text-[10px] font-bold text-gray-400'>
                <span>● Dedicated View</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
