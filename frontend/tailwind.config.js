/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#2D8CFF', // Bleu Santé
        accent:    '#FF9F43', // Orange Dynamique
        success:   '#2ECC71', // Vert Confiance
        neutral:   '#F5F6FA', // Gris Neutre
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
