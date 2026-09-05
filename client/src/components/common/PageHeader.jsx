import React from 'react';

/**
 * Compact, modern PageHeader with restrained typography and subtle handwritten accent.
 *
 * @param {Object} props
 * @param {string} props.title - Page heading
 * @param {string} [props.subtitle] - Supporting description
 * @param {string} [props.handwrittenNote] - Optional subtle handwritten accent text
 * @param {React.ReactNode} [props.actions] - Right-aligned action slot
 */
export default function PageHeader({
  title,
  subtitle,
  handwrittenNote,
  actions,
}) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#EAE6DF]/70'>
      <div>
        <div className='flex items-center gap-3 flex-wrap'>
          <h1 className='text-lg sm:text-xl font-black text-[#1E293B] tracking-tight'>
            {title}
          </h1>

          {handwrittenNote && (
            <span className='font-handwriting text-base text-[#714B67] marker-yellow px-2 py-0.2 select-none font-bold'>
              {handwrittenNote}
            </span>
          )}
        </div>

        {subtitle && (
          <p className='text-xs text-gray-500 font-normal mt-0.5'>{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className='flex items-center gap-2 shrink-0 self-start sm:self-auto'>
          {actions}
        </div>
      )}
    </div>
  );
}
