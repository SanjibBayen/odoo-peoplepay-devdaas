import React from 'react';
import { Link } from 'react-router-dom';

export default function RolesSection() {
  const roles = [
    {
      name: 'Employee',
      desc: 'Clock in, request time off, and download digital payslips anytime.',
      badge: 'Self-Service',
      icon: (
        <svg
          className='w-5 h-5 text-emerald-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
        </svg>
      ),
      cardStyle:
        'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300',
      badgeStyle: 'bg-emerald-100 text-emerald-800',
      route: '/login/employee',
    },

    {
      name: 'HR Manager',
      desc: 'Manage staff profiles, department structures, and approve leave requests.',
      badge: 'People Ops',
      icon: (
        <svg
          className='w-5 h-5 text-blue-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      ),
      cardStyle:
        'bg-blue-50/60 border-blue-200/80 hover:border-blue-300',
      badgeStyle: 'bg-blue-100 text-blue-800',
      route: '/login/hr-manager',
    },

    {
      name: 'Payroll User',
      desc: 'Reconcile attendance logs and compute monthly salary batches.',
      badge: 'Calculations',
      icon: (
        <svg
          className='w-5 h-5 text-amber-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <line x1='12' x2='12' y1='2' y2='22' />
          <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
        </svg>
      ),
      cardStyle:
        'bg-amber-50/60 border-amber-200/80 hover:border-amber-300',
      badgeStyle: 'bg-amber-100 text-amber-800',
      route: '/login/hr-payroll-user',
    },

    {
      name: 'Payroll Manager',
      desc: 'Verify wage computations and authorize final pay disbursements.',
      badge: 'Authorization',
      icon: (
        <svg
          className='w-5 h-5 text-purple-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' />
        </svg>
      ),
      cardStyle:
        'bg-purple-50/60 border-purple-200/80 hover:border-purple-300',
      badgeStyle: 'bg-purple-100 text-purple-800',
      route: '/login/hr-payroll-manager',
    },

    {
      name: 'Admin',
      desc: 'Configure organization settings, roles, and system security controls.',
      badge: 'Management',
      icon: (
        <svg
          className='w-5 h-5 text-rose-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='12' cy='12' r='3' />

          <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
        </svg>
      ),
      cardStyle:
        'bg-rose-50/60 border-rose-200/80 hover:border-rose-300',
      badgeStyle: 'bg-rose-100 text-rose-800',
      route: '/login/admin',
    },
  ];

  return (
    <section
      id='solutions'
      className='pt-16 pb-6 bg-[#FAF8F5] relative overflow-hidden'
      aria-labelledby='roles-title'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>

        {/* Header */}
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

        {/* Role Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
          {roles.map((role) => (
            <div
              key={role.name}
              className={`
                rounded-2xl
                p-5
                border
                ${role.cardStyle}
                shadow-2xs
                hover:shadow-md
                transition-all
                duration-200
                flex
                flex-col
                justify-between
                group
                hover:-translate-y-1
                overflow-hidden
              `}
            >
              <div>
                {/* Icon + Badge */}
                <div className='flex items-center justify-between mb-3'>
                  <div
                    className='
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      bg-white
                      shadow-2xs
                      border
                      border-gray-100
                      group-hover:scale-105
                      transition-transform
                    '
                  >
                    {role.icon}
                  </div>

                  <span
                    className={`
                      text-[10px]
                      font-bold
                      px-2
                      py-0.5
                      rounded-full
                      ${role.badgeStyle}
                    `}
                  >
                    {role.badge}
                  </span>
                </div>

                {/* Role Name */}
                <h3 className='text-base font-bold text-[#1E293B]'>
                  {role.name}
                </h3>

                {/* Description */}
                <p className='mt-2 text-xs text-gray-600 leading-relaxed font-normal'>
                  {role.desc}
                </p>
              </div>

              {/* Portal Link */}
              <Link
                to={role.route}
                className='
                  mt-4
                  pt-2
                  border-t
                  border-gray-200/40
                  text-[11px]
                  font-bold
                  text-[#714B67]
                  hover:underline
                  flex
                  items-center
                  justify-between
                  group-hover:text-[#5E3E56]
                '
              >
                <span>Access Portal</span>

                <span className='transition-transform group-hover:translate-x-0.5'>
                  →
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}