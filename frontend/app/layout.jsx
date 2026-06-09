import './globals.css'

export const metadata = {
  title: 'TableFor — Group Dining Agent',
  description: 'Find the perfect restaurant for your whole group',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
