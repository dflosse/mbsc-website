import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Fixtures from './pages/Fixtures'
import Teams from './pages/Teams'
import Results from './pages/Results'
import Photos from './pages/Photos'
import PitchPage from './pages/PitchPage'
import CoachPortal from './pages/CoachPortal'
import MessageBoard from './pages/MessageBoard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="fixtures" element={<Fixtures />} />
          <Route path="teams" element={<Teams />} />
          <Route path="results" element={<Results />} />
          <Route path="photos" element={<Photos />} />
          <Route path="pitch" element={<PitchPage />} />
          <Route path="coach" element={<CoachPortal />} />
          <Route path="board" element={<MessageBoard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
