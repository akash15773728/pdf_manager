import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ToolPage from './pages/ToolPage'
import AllToolsPage from './pages/AllToolsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tools" element={<AllToolsPage />} />
        <Route path="tools/:toolId" element={<ToolPage />} />
      </Route>
    </Routes>
  )
}
