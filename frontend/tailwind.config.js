/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        surface: '#161b22',
        'surface-raised': '#21262d',
        border: '#30363d',
        accent: '#f97316',
        'accent-hover': '#ea6c0a',
        'text-primary': '#f0f6fc',
        'text-secondary': '#8b949e',
        success: '#3fb950',
        'tag-bg': '#1f2937',
        'tag-text': '#d1d5db',
      },
    },
  },
  plugins: [],
}
