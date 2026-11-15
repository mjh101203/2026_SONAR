import { QRCodeSVG } from 'qrcode.react'
import './App.css'

// QR에 담을 주소. 비워 두면 지금 접속한 주소(배포 후엔 Vercel 도메인)를 그대로 쓴다.
// 특정 주소로 고정하려면 예: 'https://sonar.vercel.app/'
const SITE_URL = ''

export default function Connect() {
  const url = SITE_URL || `${window.location.origin}/`

  return (
    <main className="connect">
      <h1>SONAR 탐사 그래프</h1>
      <p className="lead">휴대폰 카메라로 QR을 찍으면 측정값 입력 페이지로 연결됩니다.</p>

      <div className="qr-box">
        <QRCodeSVG value={url} size={320} level="M" marginSize={2} />
      </div>

      <p className="url">{url}</p>
      <a className="go" href="/">
        이 화면에서 바로 시작하기
      </a>
    </main>
  )
}
