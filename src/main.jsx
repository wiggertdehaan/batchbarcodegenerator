import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import RealtimeBarcode from './RealtimeBarcode.jsx'
import BarcodeApi from './BarcodeApi.jsx'
import ErrorPage from './ErrorPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/realtime/:barcode" element={<RealtimeBarcode />} />
        <Route path="/realtime/:barcode.png" element={<BarcodeApi />} />
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
