// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/600.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/vazirmatn/800.css'
import './styles/globals.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)