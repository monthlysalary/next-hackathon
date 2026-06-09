/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#fdf6f0',
        surface: '#ffffff',
        'surface-raised': '#f5ede8',
        border: '#e8ddd8',
        accent: '#F28155',
        'accent-hover': '#e06d3f',
        'text-primary': '#1a1a1a',
        'text-secondary': '#888888',
        success: '#34A853',
        'tag-bg': '#f5ede8',
        'tag-text': '#666666',
      },
      boxShadow: {
        phone: '0 2px 32px rgba(0,0,0,0.08)',
        card: '0 2px 16px rgba(0,0,0,0.06)',
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
