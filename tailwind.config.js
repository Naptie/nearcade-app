/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          100: 'rgb(var(--color-base-100) / <alpha-value>)',
          200: 'rgb(var(--color-base-200) / <alpha-value>)',
          300: 'rgb(var(--color-base-300) / <alpha-value>)',
          content: 'rgb(var(--color-base-content) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          content: 'rgb(var(--color-primary-content) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          content: 'rgb(var(--color-secondary-content) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          content: 'rgb(var(--color-accent-content) / <alpha-value>)',
        },
        neutral: {
          DEFAULT: 'rgb(var(--color-neutral) / <alpha-value>)',
          content: 'rgb(var(--color-neutral-content) / <alpha-value>)',
        },
        info: { DEFAULT: 'rgb(var(--color-info) / <alpha-value>)', content: 'rgb(var(--color-info-content) / <alpha-value>)' },
        success: { DEFAULT: 'rgb(var(--color-success) / <alpha-value>)', content: 'rgb(var(--color-success-content) / <alpha-value>)' },
        warning: { DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)', content: 'rgb(var(--color-warning-content) / <alpha-value>)' },
        error: { DEFAULT: 'rgb(var(--color-error) / <alpha-value>)', content: 'rgb(var(--color-error-content) / <alpha-value>)' },
        /* Live-attendance density colors, mirroring the website's
           green/yellow/orange/red-500 card borders. */
        density: {
          1: '#22C55E',
          2: '#EAB308',
          3: '#F97316',
          4: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Sora_400Regular'],
        light: ['Sora_300Light'],
        medium: ['Sora_500Medium'],
        semibold: ['Sora_600SemiBold'],
        bold: ['Sora_700Bold'],
        extrabold: ['Sora_800ExtraBold'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  /* RN resolves weight through per-weight font families (see fontFamily),
     so Tailwind's fontWeight-only utilities would conflict. */
  corePlugins: { fontWeight: false },
};
