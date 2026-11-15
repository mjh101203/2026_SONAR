import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Connect from './Connect.jsx'

// 경로 라우팅: /qr → QR 연결 화면, 그 외 → 메인(그래프) 페이지
const isQr = window.location.pathname.replace(/\/+$/, '') === '/qr'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isQr ? <Connect /> : <App />}</React.StrictMode>,
)
