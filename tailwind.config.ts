import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAFAFA',
          inset: '#F2F3F5',
          hover: '#EBECEE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FB',
        },
        accent: {
          50: '#F0F3F8',
          100: '#D9E0EC',
          200: '#B3C1D9',
          400: '#6683B3',
          500: '#4A6499',
          600: '#3B4F7A',
          700: '#2D3B5C',
          900: '#1A2338',
        },
        ink: {
          primary: '#1A1C20',
          secondary: '#5F6368',
          muted: '#93989F',
          inverse: '#FFFFFF',
        },
        status: {
          success: '#1B7D5F',
          warning: '#B38A4C',
          error: '#C24A4A',
          info: '#4A6499',
        },
        border: {
          DEFAULT: '#E2E4E8',
          light: '#EEEFF1',
          focus: '#4A6499',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
export default config