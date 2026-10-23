/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        ocean: {
          950: '#04121c',
          900: '#05131f',
          800: '#0a2135',
          700: '#0f3452',
          600: '#144c77',
          500: '#1a6398',
        },
        cyanNeon: '#00F0FF',
        yellowNeon: '#FFD600',
        orangeNeon: '#FF6D00',
        pinkNeon: '#FF007A',
        emeraldNeon: '#00FF9D',
      },
      animation: {
        'float-bob': 'floatBob 3s ease-in-out infinite',
        'sink-down': 'sinkDown 1.8s forwards ease-in-out',
        'float-surface': 'floatSurface 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'pop-in': 'popIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'count-pop': 'countPop 0.8s ease-out forwards',
      },
      keyframes: {
        floatBob: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg) scale(1)' },
          '50%': { transform: 'translateY(-14px) rotate(5deg) scale(1.05)' },
        },
        sinkDown: {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '60%': { transform: 'translateY(135px) rotate(-20deg)' },
          '80%': { transform: 'translateY(120px) rotate(-10deg)' },
          '100%': { transform: 'translateY(130px) rotate(-14deg)' },
        },
        floatSurface: {
          '0%': { transform: 'translateY(-5px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(6deg)' },
          '100%': { transform: 'translateY(-5px) rotate(0deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        countPop: {
          '0%': { transform: 'scale(2.5)', opacity: '0' },
          '30%': { transform: 'scale(1)', opacity: '1' },
          '80%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.6)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
