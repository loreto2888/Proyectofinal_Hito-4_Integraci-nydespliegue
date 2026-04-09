import { Navbar } from '../common/Navbar'

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content container py-4">{children}</main>
    </div>
  )
}
