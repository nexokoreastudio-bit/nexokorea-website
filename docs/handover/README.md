# 넥소코리아 랜딩페이지 — 인수인계 문서

> **작성 시작일**: 2026-04-21
> **대상 인계자**: (미정 — 여기에 이름·연락처 기입)
> **인계 완료 예정**: (미정)

이 문서는 `nexokorea-website` 리포 운영·관리를 이어받을 담당자가 **첫날부터 배포·콘텐츠 수정·장애 대응을 할 수 있도록** 돕기 위한 것입니다.

## 먼저 읽을 순서

1. **[01-accounts.md](./01-accounts.md)** — 필수 계정·접근권한 체크리스트 (여기 먼저 확보)
2. **[02-deploy.md](./02-deploy.md)** — 배포·롤백 절차
3. **[03-admin-editor.md](./03-admin-editor.md)** — 관리자 에디터 사용법 (후기/동영상/기술자료/매뉴얼/설치사례 CRUD)
4. **[04-security.md](./04-security.md)** — 보안 현황·RLS 정책·키 관리
5. **[05-known-issues.md](./05-known-issues.md)** — 인계 시점 알려진 이슈·미검증 항목

## 프로젝트 한 줄 요약

정적 HTML + Netlify Functions + Supabase(PostgreSQL) + Cloudinary(이미지) + Gemini API(AI 설치사례 생성) 구조의 넥소코리아 제품·서비스 랜딩페이지. 관리자 에디터로 후기·동영상·기술자료·매뉴얼·설치사례 콘텐츠를 운영함.

- **도메인**: nexokorea.co.kr
- **호스팅**: Netlify (Serverless Functions 포함)
- **DB**: Supabase (reviews / videos / tech_docs / manuals / cases 테이블)
- **이미지 저장**: Cloudinary
- **AI 기능**: Netlify Function `/.netlify/functions/gemini-proxy` 로 Gemini 호출

## 관리자 에디터

- 2026-04-17~21 Codex 구현 + 전체 플로우 검증 완료
- 로그인: admin 페이지 (경로는 [03-admin-editor.md](./03-admin-editor.md) 참조)
- 관리자 계정: `admin@nexokorea.co.kr` — **배포 후 반드시 비밀번호 변경 필요** ([04-security.md](./04-security.md))

## 기존 가이드 문서 (보존)

리포 루트에 이미 있는 실무 가이드들:

- [Cloudinary 회사계정 변경 가이드](../../Cloudinary_회사계정_변경_가이드.md)
- [GitHub 연결 가이드](../../GitHub_연결_가이드.md)
- [Netlify 계정변경 가이드](../../Netlify_계정변경_가이드.md)
- [GOOGLE_SHEETS_QUOTE_SETUP](../../GOOGLE_SHEETS_QUOTE_SETUP.md) — 견적 Google Sheets 연동
- [로컬 테스트 가이드](../../로컬_테스트_가이드.md)
- [이미지 업로드 관리가이드](../../이미지%20업로드%20관리가이드.md)
- [홈페이지 개편 분석 보고서](../../홈페이지_개편_분석_보고서.md)
- [홈페이지 업데이트 보고서](../../홈페이지_업데이트_보고서.md)
- [회사계정 변경 완료 보고서](../../회사계정_변경_완료_보고서.md)

인계자가 위 문서 내용을 숙지한 후 이 인수인계 문서의 체크리스트로 실무 진입.

## 응급 연락처

- **기존 담당자 (인계자)**: (이름·휴대폰·이메일·카톡 ID)
- **백업 담당자**: (있으면)
- **외주 개발자**: (있으면)
- **Netlify 결제 관리자**: (누가 카드 등록되어있는지)
- **도메인 등록 대행사 / 연락처**: (카페24·가비아·후이즈 등)

## 이 문서의 유지보수

인계 후 운영 중 새로 발견되는 이슈·절차·계정은 여기 또는 해당 섹션에 계속 기록. 최종 배포 전 마지막 리뷰는 기존 담당자 + 인계자 공동으로 확인.
