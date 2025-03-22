/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import aspectRatio from '@tailwindcss/aspect-ratio'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.5s ease-out',
        'smoke-left': 'smoke-left 3s ease-in-out infinite',
        'smoke-right': 'smoke-right 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'smoke-left': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '0' },
          '50%': { transform: 'translateX(-20px) scale(1.2)', opacity: '0.5' },
          '100%': { transform: 'translateX(-40px) scale(1)', opacity: '0' },
        },
        'smoke-right': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '0' },
          '50%': { transform: 'translateX(20px) scale(1.2)', opacity: '0.5' },
          '100%': { transform: 'translateX(40px) scale(1)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
} 