import { Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import CorporateSalesDetail from './pages/CorporateSalesDetail'
import KotakDetail from './pages/KotakDetail'
import OffersDetail from './pages/OffersDetail'
import Placeholder from './pages/Placeholder'
import { FilterProvider } from './lib/FilterContext'

// "By payment behaviour" group is fully live: Overview, Corporate Sales,
// Kotak, Offers. Expiry & Risk and Data Health remain disabled stubs for a
// later phase (see Sidebar.jsx). FilterProvider carries the FY/Month
// selection across all of them for the life of the session.
export default function App() {
  return (
    <FilterProvider>
      <div style={{ width: '100%', height: '100dvh', background: '#0D0F12', display: 'flex', color: '#ECEBF2', overflow: 'hidden' }}>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/corporate-sales" element={<CorporateSalesDetail />} />
          <Route path="/kotak" element={<KotakDetail />} />
          <Route path="/offers" element={<OffersDetail />} />
          <Route path="/expiry-risk" element={<Placeholder title="Expiry & Risk" />} />
          <Route path="/data-health" element={<Placeholder title="Data Health" />} />
        </Routes>
      </div>
    </FilterProvider>
  )
}
