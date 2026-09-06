import React from 'react';

/**
 * Shimmer pulse effect container.
 */
export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`bg-gray-200/70 animate-pulse rounded-xl ${className}`}
      aria-hidden='true'
    />
  );
}

/**
 * Compact skeleton for dashboard layouts (4 KPIs, 2 content cards, 3 quick actions).
 */
export function DashboardSkeleton() {
  return (
    <div className='space-y-6' aria-label='Loading dashboard'>
      {/* Header skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='space-y-2'>
          <SkeletonBlock className='h-6 w-48' />
          <SkeletonBlock className='h-3.5 w-72' />
        </div>
        <SkeletonBlock className='h-8 w-28' />
      </div>

      {/* 4 KPI cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-white rounded-2xl border border-[#EAE6DF] p-4 space-y-3'
          >
            <div className='flex items-center justify-between'>
              <SkeletonBlock className='h-3.5 w-24' />
              <SkeletonBlock className='w-8 h-8 rounded-xl' />
            </div>
            <SkeletonBlock className='h-7 w-28' />
            <SkeletonBlock className='h-3 w-36' />
          </div>
        ))}
      </div>

      {/* 2 Content sections */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        {[1, 2].map((i) => (
          <div
            key={i}
            className='bg-white rounded-2xl border border-[#EAE6DF] p-5 space-y-4'
          >
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <SkeletonBlock className='h-4 w-36' />
              <SkeletonBlock className='h-3 w-16' />
            </div>
            <div className='space-y-2.5'>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className='flex items-center justify-between py-1'>
                  <SkeletonBlock className='h-3.5 w-40' />
                  <SkeletonBlock className='h-3.5 w-20' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Quick actions */}
      <div className='space-y-3'>
        <SkeletonBlock className='h-4 w-28' />
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='bg-white rounded-2xl border border-[#EAE6DF] p-4 flex items-center gap-3.5'
            >
              <SkeletonBlock className='w-10 h-10 rounded-xl shrink-0' />
              <div className='space-y-1.5 flex-1'>
                <SkeletonBlock className='h-3.5 w-24' />
                <SkeletonBlock className='h-3 w-32' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for data table pages (filter bar + header + rows).
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className='space-y-4' aria-label='Loading table data'>
      {/* Top Filter skeleton */}
      <div className='bg-white p-3.5 rounded-2xl border border-[#EAE6DF] flex flex-col sm:flex-row gap-3 items-center justify-between'>
        <SkeletonBlock className='h-8 w-full sm:w-64' />
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <SkeletonBlock className='h-8 w-28' />
          <SkeletonBlock className='h-8 w-28' />
        </div>
      </div>

      {/* Table container */}
      <div className='bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden'>
        <div className='bg-gray-50/70 px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
          <SkeletonBlock className='h-3.5 w-32' />
          <SkeletonBlock className='h-3.5 w-20' />
        </div>
        <div className='divide-y divide-gray-50'>
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className='px-4 py-3 flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3 flex-1'>
                <SkeletonBlock className='w-8 h-8 rounded-xl shrink-0' />
                <div className='space-y-1.5 flex-1'>
                  <SkeletonBlock className='h-3.5 w-36' />
                  <SkeletonBlock className='h-3 w-48' />
                </div>
              </div>
              <SkeletonBlock className='h-4 w-20' />
              <SkeletonBlock className='h-6 w-16 rounded-lg' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for profile/detail views.
 */
export function DetailSkeleton() {
  return (
    <div className='space-y-5' aria-label='Loading details'>
      {/* Back button skeleton */}
      <SkeletonBlock className='h-7 w-32' />

      {/* Profile header card */}
      <div className='bg-white rounded-3xl p-6 border border-[#EAE6DF] flex flex-col sm:flex-row items-center gap-5'>
        <SkeletonBlock className='w-16 h-16 rounded-2xl shrink-0' />
        <div className='space-y-2 flex-1 text-center sm:text-left'>
          <SkeletonBlock className='h-6 w-48 mx-auto sm:mx-0' />
          <SkeletonBlock className='h-4 w-64 mx-auto sm:mx-0' />
        </div>
        <SkeletonBlock className='h-8 w-24' />
      </div>

      {/* Tab strip skeleton */}
      <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-2'>
        <SkeletonBlock className='h-8 w-24 rounded-xl' />
        <SkeletonBlock className='h-8 w-24 rounded-xl' />
        <SkeletonBlock className='h-8 w-24 rounded-xl' />
      </div>

      {/* Main card skeleton */}
      <div className='bg-white rounded-2xl border border-[#EAE6DF] p-6 space-y-4'>
        <SkeletonBlock className='h-4 w-40' />
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className='space-y-1.5'>
              <SkeletonBlock className='h-3 w-24' />
              <SkeletonBlock className='h-4 w-40' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generic card skeleton.
 */
export function CardSkeleton({ className = 'h-40' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#EAE6DF] p-5 ${className}`}>
      <SkeletonBlock className='h-4 w-32 mb-3' />
      <SkeletonBlock className='h-3 w-full mb-2' />
      <SkeletonBlock className='h-3 w-4/5' />
    </div>
  );
}

const LoadingSkeleton = {
  DashboardSkeleton,
  TableSkeleton,
  DetailSkeleton,
  CardSkeleton,
  SkeletonBlock,
};

export default LoadingSkeleton;
