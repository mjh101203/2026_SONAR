# 2026_SONAR

초음파 센서로 SONAR를 모방하는 부스용 그래프 페이지.
5cm 간격으로 잰 echo 시간 9개를 입력하면 점이 차례로 찍히고 선으로 이어진다.

## 실행

```
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속.

- `/` : 측정값 입력 + 그래프 (메인)
- `/qr` : 메인 페이지로 가는 QR 연결 화면 (접속한 도메인으로 QR 자동 생성)

## 설정

`src/App.jsx` 상단 상수로 측정 횟수(`COUNT`), 간격(`STEP_CM`), 시작 위치(`START_CM`)를 바꿀 수 있다.
