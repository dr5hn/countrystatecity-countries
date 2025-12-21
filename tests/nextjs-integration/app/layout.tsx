export const metadata = {
  title: 'NextJS Integration Test',
  description: 'Testing @countrystatecity/countries in NextJS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
