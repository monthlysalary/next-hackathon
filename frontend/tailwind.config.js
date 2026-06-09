/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
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
      boxShadow: {
        phone: '0 0 0 12px #1a1a2e, 0 25px 80px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
