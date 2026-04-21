# 01. 계정·접근권한 체크리스트

> 이 리스트는 **인계 시작 전 모든 칸이 채워져야** 합니다. 빈 칸은 인계자가 대응할 수 없는 사각지대입니다.

## 도메인

| 항목 | 관리 업체 | 계정 ID | 비밀번호 공유 방식 | 만료일 | 비고 |
|---|---|---|---|---|---|
| nexokorea.co.kr | (카페24/가비아/후이즈 등) | | (1Password/회사 공유/메모장) | | 결제카드 명의 확인 필요 |

## 호스팅 (Netlify)

| 항목 | 내용 |
|---|---|
| Netlify 계정 이메일 | |
| 팀·사이트 이름 | |
| 결제 카드 명의 | |
| 플랜 (Free/Pro 등) | |
| Functions 사용량 한도 | |
| 배포 브랜치 연결 방식 | (Git 자동 / 수동 CLI) |

참고: [Netlify 계정변경 가이드](../../Netlify_계정변경_가이드.md)

## 데이터베이스 (Supabase)

| 항목 | 내용 |
|---|---|
| Supabase 프로젝트 URL | |
| 프로젝트 이름 | |
| 관리 계정 이메일 | |
| 결제 플랜 | |
| 주요 테이블 | users, reviews, videos, tech_docs, manuals, cases, nexo_videos |
| RLS 정책 관리 위치 | Supabase Dashboard → Authentication → Policies |
| 백업 설정 | |

**필수 환경변수** (Netlify 에 등록되어 있음):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (서버 전용, 유출 금지)
- `SUPABASE_ANON_KEY` (프론트 노출 OK)

## 이미지 저장 (Cloudinary)

| 항목 | 내용 |
|---|---|
| Cloudinary 계정 이메일 | |
| Cloud name | |
| API key / secret 보관 위치 | |
| 업로드 프리셋 이름 | |

참고: [Cloudinary 회사계정 변경 가이드](../../Cloudinary_회사계정_변경_가이드.md), [이미지 업로드 관리가이드](../../이미지%20업로드%20관리가이드.md)

## Google 서비스

| 서비스 | 용도 | 계정 | 비고 |
|---|---|---|---|
| Google Apps Script | 견적 양식 → Google Sheets 저장 | | [GOOGLE_SHEETS_QUOTE_SETUP](../../GOOGLE_SHEETS_QUOTE_SETUP.md) |
| Google Sheets (견적서) | | | 시트 URL·편집 권한 |
| Google Analytics / Search Console | 있으면 기입 | | |

## Gemini API (AI 설치사례 생성)

| 항목 | 내용 |
|---|---|
| Google AI Studio 계정 | |
| API Key 등록 위치 | Netlify 환경변수 `GEMINI_API_KEY` |
| 무료 할당량 초과 시 과금 | (Yes/No) |
| 사용처 | `/.netlify/functions/gemini-proxy` |

## GitHub

| 항목 | 내용 |
|---|---|
| 리포 URL | |
| 조직/소유자 | |
| 메인 브랜치 | main (또는 master) |
| 관리자 권한 계정 | |
| 배포 연동 (Netlify) | 자동 / 수동 |

참고: [GitHub 연결 가이드](../../GitHub_연결_가이드.md)

## 관리자 계정 (Supabase users)

| 항목 | 내용 |
|---|---|
| 이메일 | `admin@nexokorea.co.kr` |
| 임시 비밀번호 | `1234` |
| **배포 후 조치** | **반드시 비밀번호 변경 후 인계자 전달** |
| role | `admin` (users 테이블 role 컬럼) |

**관리자 추가 방법**: Supabase Dashboard → Authentication → Users → Invite user → 생성 후 `public.users` 테이블에서 해당 row 의 `role` 을 `admin` 으로 UPDATE.

## 이메일·연락처 (홈페이지 노출)

| 항목 | 내용 |
|---|---|
| 대표 이메일 | (info@nexokorea.co.kr 등) |
| 대표 전화 | 032-569-5771~2 |
| 견적 문의 수신처 | Google Sheets 또는 이메일 |

## 인계 체크리스트 (배포 전)

- [ ] 위 표의 빈 칸 전부 채움
- [ ] 인계자가 각 서비스에 **직접 로그인 성공** 확인
- [ ] 관리자 비밀번호 변경 완료 후 인계자에게 안전 경로로 전달
- [ ] Netlify 결제 카드 명의·연락처 확인 (만료 시 대응 가능해야 함)
- [ ] 도메인 만료일 체크 — 6개월 이하면 갱신 일정 알림
- [ ] GitHub 리포 접근권한 인계자에게 부여
- [ ] Supabase 프로젝트 소유권 이전 또는 팀 멤버 추가
- [ ] Cloudinary 팀 멤버 추가 또는 계정 이관
- [ ] 1Password / 비밀번호 관리자 공유 vault 에 전부 저장
