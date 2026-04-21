# 03. 관리자 에디터 사용법

> 2026-04-21 Codex 가 전체 플로우 검증 완료. 실제 UI E2E (사람이 버튼 눌러보는 수준) 은 인계자가 배포 초기 며칠 간 모니터링하며 확인 필요.

## 접근 경로

- 공개 사이트: `https://nexokorea.co.kr/`
- 관리자 페이지: [TODO: 실제 admin URL 경로 확인 후 기입 — 예: `/admin.html`]
- 초기 계정: `admin@nexokorea.co.kr` / `1234` — **배포 후 반드시 비밀번호 변경**

## 관리 대상 콘텐츠

| 구분 | 테이블 | 용도 | 공개 페이지 |
|---|---|---|---|
| 후기 | `reviews` | 고객 설치 후기 | `cases.html` 등 |
| 동영상 | `videos` | YouTube 링크 모음 | `video.html` |
| 기술자료 | `tech_docs` | 제품 스펙·연결도 등 PDF·이미지 | `resources.html` |
| 매뉴얼 | `manuals` | 사용 설명서 PDF | `manual.html` |
| 설치사례 | `cases` | 현장 사진 + 서술형 케이스 | `cases.html` |

각 콘텐츠 타입별 공통 액션 (검증 완료):
- **등록** (Create)
- **수정** (Update)
- **공개 상태 변경** (Toggle public/private)
- **삭제** (Delete)

## AI 설치사례 생성

- 설치사례 작성 시 AI 도움 가능 (짧은 메모 → 서술형 케이스 JSON 으로 확장)
- 백엔드: `https://nexokorea.co.kr/.netlify/functions/gemini-proxy` → Gemini API
- 오류 시 체크: Gemini API 쿼터 + 해당 함수 로그 (Netlify Functions → Logs)

## 콘텐츠 운영 팁 (경험 기반)

> [TODO: 기존 담당자가 실제 운영하며 겪은 팁 기입]
>
> 예시:
> - 후기 등록 시 개인정보(이름·주소) 마스킹 필수
> - 동영상은 shorts 와 풀영상 함께 등록 시 순서 주의
> - 설치사례는 먼저 이미지 전부 Cloudinary 업로드 후 등록이 빠름
> - 공개 상태 "비공개" 로 두고 최종 검토 후 공개로 전환

## 이미지 업로드 플로우

1. 관리자 에디터에서 이미지 필드 클릭 → 파일 선택
2. 프론트엔드가 Cloudinary 직접 업로드 (unsigned preset 사용)
3. 업로드 완료 후 반환된 URL 을 DB 에 저장
4. 공개 페이지에서 Cloudinary CDN 경유로 로드

상세: [이미지 업로드 관리가이드](../../이미지%20업로드%20관리가이드.md)

## 알려진 제약 (인계자 주의)

- **미검증 UI 인터랙션** (2026-04-21 검증 시 브라우저 자동화 도구 없이 진행):
  - 드래그앤드롭
  - 비주얼 편집기 커서 동작
  - 모바일 터치 인터랙션
  - Cloudinary 실제 이미지 업로드 전 구간
- 위 항목은 인계자가 실제 브라우저에서 직접 눌러보며 1주일 모니터링 권장

- **보안 이슈 2건 (2026-04-21 발견):**
  - `nexo_videos` RLS / `youtube_url` unique 제약용 마이그레이션 파일은 추가됨
  - 실제 Supabase 프로젝트 반영은 아직 필요

상세: [04-security.md](./04-security.md)

## 비밀번호 분실·관리자 추가

### 관리자 비밀번호 변경
1. Supabase Dashboard → Authentication → Users
2. `admin@nexokorea.co.kr` 선택 → "Send recovery email" 또는 관리자가 직접 비밀번호 리셋

### 신규 관리자 추가
1. Supabase Dashboard → Authentication → Users → "Invite user"
2. 이메일 입력 후 초대 메일 발송
3. 초대 받은 사용자가 비밀번호 설정 완료
4. **중요**: `public.users` 테이블에서 해당 row 찾아 `role` 컬럼을 `admin` 으로 UPDATE
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = '신규관리자@nexokorea.co.kr';
   ```
5. 관리자 페이지 로그인하여 권한 작동 확인

### 관리자 권한 회수
```sql
UPDATE public.users SET role = 'user' WHERE email = '제거대상@nexokorea.co.kr';
-- 또는 계정 자체 삭제: Supabase Dashboard → Authentication → Users → Delete
```
