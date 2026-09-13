import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Agreements } from './pages/Agreements'
import { Chores } from './pages/Chores'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'
import { Guide } from './pages/Guide'
import { Settings } from './pages/Settings'
import { Supplies } from './pages/Supplies'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/chores" element={<Chores />} />
        <Route path="/supplies" element={<Supplies />} />
        <Route path="/agreements" element={<Agreements />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
