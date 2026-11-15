import { useRef, useState } from 'react'
import './App.css'

// ── 부스 설정 ─────────────────────────────────────────────
const COUNT = 9 // 측정 횟수
const STEP_CM = 5 // 측정 간격 (cm)
const START_CM = 5 // 첫 측정 위치 (cm)
const SOUND_CM_PER_US = 0.0343 // 음속 343 m/s (약 20°C 공기)
const TIME_MIN = 500 // 그래프 세로축 기본 범위 (µs). 범위 밖 값이 있을 때만 넓어진다
const TIME_MAX = 2000
const TIME_TICK = 250 // 세로축 눈금 간격 (µs)
const DIST_TICK = 5 // 거리 환산 시 눈금 간격 (cm)
// ─────────────────────────────────────────────────────────

const POSITIONS = Array.from({ length: COUNT }, (_, i) => START_CM + i * STEP_CM)

// echo 시간은 왕복이므로 거리 = 음속 × 시간 / 2
const toDistance = (us) => (us * SOUND_CM_PER_US) / 2

const range = (from, to, step) => {
  const out = []
  for (let v = from; v <= to + 1e-9; v += step) out.push(+v.toFixed(6))
  return out
}

// 눈금이 너무 많아지면 간격을 2배씩 넓힌다
const ticksIn = (lo, hi, base) => {
  let step = base
  while ((hi - lo) / step > 8) step *= 2
  return range(Math.ceil(lo / step - 1e-9) * step, hi, step)
}

// 세로축: 기본은 TIME_MIN~TIME_MAX 고정, 범위 밖 측정값이 있을 때만 그 값까지 넓힌다.
// 두 모드 모두 같은 구간을 가리키므로 그래프 모양이 같다.
function makeAxis(mode, times) {
  const lo = Math.min(TIME_MIN, Math.floor(Math.min(...times) / TIME_TICK) * TIME_TICK)
  const hi = Math.max(TIME_MAX, Math.ceil(Math.max(...times) / TIME_TICK) * TIME_TICK)
  if (mode === 'time') {
    return { label: 'echo 시간 (µs)', digits: 0, domain: [lo, hi], ticks: ticksIn(lo, hi, TIME_TICK) }
  }
  const dLo = toDistance(lo)
  const dHi = toDistance(hi)
  return { label: '거리 (cm)', digits: 1, domain: [dLo, dHi], ticks: ticksIn(dLo, dHi, DIST_TICK) }
}

const POINT_GAP = 0.22 // 점 하나가 찍히는 간격 (초)
const LINE_TIME = 1.6 // 선이 이어지는 시간 (초)

function Chart({ data, axis, mirrored }) {
  const { label: yLabel, digits, domain, ticks } = axis
  const W = 900
  const H = 470
  const m = { t: 44, r: 36, b: 64, l: 86 }
  const iw = W - m.l - m.r
  const ih = H - m.t - m.b

  const [lo, hi] = domain

  // 좌우반전이면 첫 측정 위치가 오른쪽 끝에 온다
  const x = (i) => m.l + ((mirrored ? COUNT - 1 - i : i) * iw) / (COUNT - 1)
  // 세로축은 뒤집어서 고정: 값이 클수록(멀수록) 아래 → 바닥 지형 모양
  const y = (v) => m.t + ((v - lo) / (hi - lo)) * ih
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="측정 그래프">
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} />
          <text className="tick" x={m.l - 12} y={y(t)} textAnchor="end" dominantBaseline="middle">
            {t}
          </text>
        </g>
      ))}
      {POSITIONS.map((p, i) => (
        <g key={p}>
          <line className="grid faint" x1={x(i)} x2={x(i)} y1={m.t} y2={m.t + ih} />
          <text className="tick" x={x(i)} y={m.t + ih + 24} textAnchor="middle">
            {p}
          </text>
        </g>
      ))}
      <rect className="frame" x={m.l} y={m.t} width={iw} height={ih} />

      <text className="axis-label" x={m.l + iw / 2} y={H - 12} textAnchor="middle">
        위치 (cm)
      </text>
      <text
        className="axis-label"
        transform={`translate(22 ${m.t + ih / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        {yLabel}
      </text>

      <polyline
        className="line"
        points={points}
        pathLength="1"
        style={{ animationDelay: `${COUNT * POINT_GAP}s`, animationDuration: `${LINE_TIME}s` }}
      />

      {data.map((v, i) => (
        <g key={i} className="point" style={{ animationDelay: `${i * POINT_GAP}s` }}>
          <circle cx={x(i)} cy={y(v)} r="8" />
          <text className="value" x={x(i)} y={y(v) - 16} textAnchor="middle">
            {v.toFixed(digits)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function App() {
  const [values, setValues] = useState(Array(COUNT).fill(''))
  const [result, setResult] = useState(null) // 그래프로 확정된 echo 시간 배열 (µs)
  const [runId, setRunId] = useState(0) // 애니메이션 재생용 key
  const [mode, setMode] = useState('time') // 'time' | 'distance'
  const [mirrored, setMirrored] = useState(false)
  const inputs = useRef([])

  const nums = values.map((v) => (v.trim() === '' ? NaN : Number(v)))
  const filled = nums.filter((n) => Number.isFinite(n) && n > 0).length
  const complete = filled === COUNT

  const draw = () => {
    if (!complete) return
    setResult(nums)
    setRunId((k) => k + 1)
  }

  const reset = () => {
    setValues(Array(COUNT).fill(''))
    setResult(null)
    inputs.current[0]?.focus()
  }

  const onChange = (i, v) => {
    if (!/^\d*\.?\d*$/.test(v)) return
    setValues((prev) => prev.map((p, j) => (j === i ? v : p)))
  }

  const onKeyDown = (i, e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (i < COUNT - 1) inputs.current[i + 1]?.focus()
    else draw()
  }

  const data = result && (mode === 'time' ? result : result.map(toDistance))

  return (
    <main className="app">
      <header>
        <a className="qr-link" href="/qr">
          QR 연결 화면
        </a>
        <h1>SONAR 탐사 그래프</h1>
        <p>
          {STEP_CM}cm씩 옮기며 잰 echo 시간을 차례로 입력하세요. Enter로 다음 칸으로 넘어가고,{' '}
          {COUNT}번째에서 Enter를 누르면 그래프가 그려집니다.
        </p>
      </header>

      <section className="inputs">
        {POSITIONS.map((p, i) => (
          <label key={p} className="cell">
            <span>{p} cm</span>
            <input
              ref={(el) => (inputs.current[i] = el)}
              inputMode="decimal"
              autoFocus={i === 0}
              placeholder="µs"
              value={values[i]}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
            />
          </label>
        ))}
      </section>

      <section className="actions">
        <span className="progress">
          {filled} / {COUNT} 입력
        </span>
        <button className="primary" onClick={draw} disabled={!complete}>
          그래프 그리기
        </button>
        <button onClick={reset}>처음부터</button>
      </section>

      <section className="panel">
        {data ? (
          <>
            <div className="options">
              <div className="seg">
                <button className={mode === 'time' ? 'on' : ''} onClick={() => setMode('time')}>
                  echo 시간
                </button>
                <button
                  className={mode === 'distance' ? 'on' : ''}
                  onClick={() => setMode('distance')}
                >
                  거리로 환산
                </button>
              </div>
              <button
                className={`mirror${mirrored ? ' on' : ''}`}
                aria-pressed={mirrored}
                onClick={() => setMirrored((v) => !v)}
              >
                ⇄ 좌우반전
              </button>
              <button onClick={() => setRunId((k) => k + 1)}>다시 재생</button>
            </div>
            <Chart
              key={`${runId}-${mode}-${mirrored}`}
              data={data}
              axis={makeAxis(mode, result)}
              mirrored={mirrored}
            />
            {mode === 'distance' && (
              <p className="note">거리 = 음속(343 m/s) × echo 시간 ÷ 2 — 소리가 갔다가 돌아오므로 2로 나눕니다.</p>
            )}
          </>
        ) : (
          <div className="empty">측정값 {COUNT}개를 모두 입력하면 여기에 그래프가 나타납니다.</div>
        )}
      </section>
    </main>
  )
}
