import './globals.css'

export const metadata = {
  title: 'TableFor — Group Dining Agent',
  description: 'Find the perfect restaurant for your whole group',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
