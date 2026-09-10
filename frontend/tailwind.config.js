/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0b0b12',
        panel: '#15151f',
        glitch: '#ff3d81',
        toxic: '#b6ff3d',
        zap: '#3dd9ff',
      },
      fontFamily: {
        display: ['"Arial Black"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px) rotate(-1deg)' },
          '40%': { transform: 'translateX(6px) rotate(1deg)' },
          '60%': { transform: 'translateX(-4px) rotate(-1deg)' },
          '80%': { transform: 'translateX(4px) rotate(1deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(255,61,129,0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(255,61,129,0.8)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
