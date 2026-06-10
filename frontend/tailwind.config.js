/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        bg: '#fdf6f0',
        surface: '#ffffff',
        'surface-raised': '#faf3ec',
        border: '#e8ddd4',
        accent: '#d4763a',
        'accent-hover': '#b8612c',
        'accent-light': '#fef0e6',
        'text-primary': '#2c1810',
        'text-secondary': '#7a6558',
        success: '#5a8a4a',
        'tag-bg': '#faf3ec',
        'tag-text': '#6b5545',
      },
      boxShadow: {
        phone: '0 4px 40px rgba(44,24,16,0.08)',
        card: '0 1px 12px rgba(44,24,16,0.05)',
        'card-hover': '0 4px 20px rgba(44,24,16,0.08)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '40px',
      },
    },
  },
  plugins: [],
}
