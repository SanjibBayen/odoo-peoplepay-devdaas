/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        odoo: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        odoo: {
          primary: '#714B67',
          'primary-hover': '#5E3E56',
          secondary: '#017E84',
          'secondary-hover': '#00656A',
          light: {
            bg: '#F8F9FA',
            surface: '#FFFFFF',
            border: '#E2E8F0',
            text: '#212529',
            muted: '#6C757D',
          },
          dark: {
            bg: '#121417',
            surface: '#1E2125',
            border: '#2E343A',
            text: '#F8F9FA',
            muted: '#9CA3AF',
          },
          success: '#28A745',
          warning: '#E59935',
          danger: '#DC3545',
          info: '#17A2B8',
        },
      },
    },
  },
  plugins: [],
};