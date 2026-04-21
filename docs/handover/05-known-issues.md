# 05. 인계 시점 알려진 이슈·미검증 항목

> 2026-04-21 기준. 인계자가 배포 후 우선 확인·대응할 목록.

## 배포 전 반드시 해결 (Critical)

- [ ] **`supabase/migrations/20260421_secure_nexo_videos.sql` 실DB 적용**
  - `nexo_videos` RLS 차단
  - `youtube_url` unique 제약 추가
  - 중복 `youtube_url` 정리 후 unique 강제

Codex 가 2026-04-21 기준 SQL 파일 작성 완료. 다만 현재 작업 환경에는 Supabase CLI / DB 접속 정보가 없어 원격 적용은 아직 안 됨.

## 배포 후 모니터링 (High)

실제 브라우저 UI 로 수동 E2E 가 필요한 구간 (2026-04-21 검증 시 자동화 도구 부재로 미커버):

- [ ] 관리자 에디터의 드래그앤드롭 기능 (이미지 순서 재정렬 등)
- [ ] 비주얼 편집기 커서 동작 (에디터 있는 경우)
- [ ] 모바일 터치 인터랙션 — iPad·갤럭시 탭 등에서 콘텐츠 등록·수정
- [ ] Cloudinary 실제 이미지 업로드 전체 경로 — 파일 선택 → Cloudinary 업로드 → URL 반영 → 저장

## 기존 담당자가 확인 필요 (User 가 채울 것)

- [ ] Netlify 결제 카드 명의 — 만료 시 누가 대응?
- [ ] 도메인 등록 대행사 로그인 정보
- [ ] 견적 Google Sheets 소유권 이전 계획
- [ ] info@nexokorea.co.kr 메일 운영 방식 (Gmail / Google Workspace / 자체 메일 서버)
- [ ] 외주 개발자·디자이너 계약 상태 (존재 시)
- [ ] 연락처 (응급 상황 전화 받을 사람)

## 기술 부채·개선 제안 (Medium, 나중에)

- [ ] Supabase 테이블·정책 마이그레이션 파일로 정리 (현재 대시보드 수동 관리면 재현 어려움)
- [ ] 환경변수 문서화 — `.env.example` 에 모든 변수 주석 포함
- [ ] E2E 테스트 자동화 — Playwright 등으로 관리자 CRUD 스모크 테스트
- [ ] 모니터링 — Sentry / Netlify Analytics / UptimeRobot 등 최소 1개 연결
- [ ] 이미지 대용량 업로드 시 압축·리사이즈 자동화 (현재 원본 그대로 Cloudinary 저장 시 쿼터 부담)

## 낮음 (Low, 여유 있을 때)

- [ ] 리포 루트의 가이드 문서들을 `docs/` 아래로 이동하고 README 에서 링크
- [ ] 미사용 파일·폴더 정리 (예: `blog.html` 삭제됨 — 관련 링크 잔존 여부 확인)
- [ ] TypeScript 도입 또는 JSDoc 주석 강화
- [ ] i18n (영문 지원) 검토

## 과거 이슈 기록 (참고)

> [TODO: 인계 전까지 겪었던 장애·대응 내역 아는 대로 추가 — "2025-XX 이미지 안 뜸 → Cloudinary preset 바꾸고 해결" 같은 짧은 메모라도 귀함]
