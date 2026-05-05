/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2D8CFF',
        accent:  '#FF9F43',
        success: '#2ECC71',
        neutral: '#F5F6FA',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
      minHeight: { tap: '44px' },
      height:    { btn: '60px' },
    },
  },
  plugins: [],
};
