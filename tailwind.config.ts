import type { Config } from 'tailwindcss';

const config: Config = {
     content: [
          './app/**/*.{js,ts,jsx,tsx,mdx}',
          './components/**/*.{js,ts,jsx,tsx,mdx}',
     ],
     theme: {
          extend: {
               colors: {
                    'dark-bg': '#0F0F0F',
                    'dark-surface': '#1A1A1A',
                    'dark-border': '#2A2A2A',
                    'accent-amber': '#F59E0B',
                    'accent-indigo': '#6366F1',
               },
               fontFamily: {
                    serif: ['Instrument Serif', 'serif'],
                    sans: ['DM Sans', 'sans-serif'],
               },
               animation: {
                    'flip': 'flip 0.4s ease-in-out',
                    'fade-in': 'fadeIn 0.5s ease-in',
               },
               keyframes: {
                    flip: {
                         '0%': { transform: 'rotateY(0deg)' },
                         '100%': { transform: 'rotateY(180deg)' },
                    },
                    fadeIn: {
                         '0%': { opacity: '0' },
                         '100%': { opacity: '1' },
                    },
               },
               backgroundColor: {
                    DEFAULT: '#0F0F0F',
               },
          },
     },
     plugins: [],
};

export default config;
