import React, { useState, useEffect } from 'react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen p-8 transition-colors duration-200 
                    bg-[var(--color-odoo-light-bg)] dark:bg-[var(--color-odoo-dark-bg)] 
                    text-[var(--color-odoo-light-text)] dark:text-[var(--color-odoo-dark-text)]">
      
      {/* Toggle Button */}
      <div className="max-w-md mx-auto mb-6 flex justify-between items-center">
        <span className="text-sm font-semibold">
          Active Mode: {darkMode ? 'Dark 🌙' : 'Light ☀️'}
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all 
                     bg-[var(--color-odoo-secondary)] hover:bg-[var(--color-odoo-secondary-hover)] 
                     cursor-pointer shadow-sm"
        >
          Toggle Theme
        </button>
      </div>

      {/* Card Preview */}
      <div className="max-w-md mx-auto p-6 rounded-xl transition-colors duration-200 
                      bg-[var(--color-odoo-light-surface)] dark:bg-[var(--color-odoo-dark-surface)] 
                      border border-[var(--color-odoo-light-border)] dark:border-[var(--color-odoo-dark-border)] 
                      shadow-sm">
        <h2 className="text-xl font-semibold">
          PeoplePay360 Portal
        </h2>
        <p className="mt-2 text-sm text-[var(--color-odoo-light-muted)] dark:text-[var(--color-odoo-dark-muted)]">
          Integrated HR & Payroll platform dashboard preview.
        </p>

        <div className="mt-5 flex gap-3">
          <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all 
                             bg-[var(--color-odoo-primary)] hover:bg-[var(--color-odoo-primary-hover)] 
                             shadow-sm cursor-pointer">
            Run Payrun
          </button>
        </div>
      </div>
    </div>
  );
}