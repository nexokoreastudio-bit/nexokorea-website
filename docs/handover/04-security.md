# 04. 보안 현황 · RLS · 키 관리

## 2026-04-21 검증 결과 요약

- ✅ 관리자 로그인·권한 체크 정상
- ✅ `reviews / videos / tech_docs / manuals / cases` CRUD 권한 검증 완료
- ⚠️ **`nexo_videos` 보안 마이그레이션 파일 추가 완료** — `supabase/migrations/20260421_secure_nexo_videos.sql`
- ⚠️ **실DB 적용은 별도 실행 필요** — 현재 작업 환경에 Supabase CLI / DB 접속 정보가 없어 원격 적용은 미완료

위 보안 수정 SQL 은 커밋 대상에 포함됨. 실제 Supabase 프로젝트에는 인계자 또는 배포 담당자가 SQL Editor / migration 적용으로 반영해야 함.

## Supabase RLS (Row Level Security) 정책

각 테이블의 정책은 Supabase Dashboard → Authentication → Policies 에서 확인·수정.

**기본 원칙**:
- `SELECT`: 공개 콘텐츠는 익명 허용 (`is_public = true` 조건 등)
- `INSERT / UPDATE / DELETE`: **관리자만** (`role = 'admin'` 체크)

**점검 쿼리 예시** (Supabase SQL Editor 에서 수시로 점검):
```sql
-- 각 테이블의 RLS 활성화 여부
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 각 테이블의 정책 목록
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 환경변수·키 유출 방지

**절대 하지 말 것**:
- `SUPABASE_SERVICE_KEY` 를 프론트엔드 코드·HTML 에 하드코딩
- GitHub 에 `.env` 파일 커밋 (`.gitignore` 확인)
- 스크린샷·채팅에 키 값 노출

**주기적 점검**:
- `git log -p` 또는 `git grep -i "service_key\|api_key"` 로 커밋 히스토리 유출 여부 확인
- 의심되면 해당 키 **즉시 Rotate** (Supabase·Gemini·Cloudinary 각 대시보드에서 재발급) + Netlify 환경변수 업데이트

## 관리자 계정 관리

- 초기 계정: `admin@nexokorea.co.kr` / `1234`
- **배포 후 즉시**:
  1. 인계자에게 비밀번호 변경 지시
  2. 강력한 비밀번호로 교체 (14자 이상, 대소문자·숫자·기호 혼합)
  3. 1Password 등 비밀번호 관리자에 저장
  4. 불필요한 관리자 계정은 삭제 또는 role 을 `user` 로 다운그레이드

## 정기 점검 항목 (월 1회 권장)

- [ ] RLS 정책 변경 없는지 Supabase Dashboard 확인
- [ ] 관리자 계정 목록 (`SELECT * FROM public.users WHERE role = 'admin';`) 최신화
- [ ] Supabase `auth.users` 중 의심스러운 신규 가입자 없는지 확인
- [ ] Cloudinary 업로드 할당량·의심스러운 대용량 업로드 확인
- [ ] Gemini API 사용량·쿼터 경고 확인
- [ ] Netlify Function 로그에 에러·비정상 요청 스파이크 있는지 확인
- [ ] GitHub 리포 Collaborators·Access 권한 현황 확인
- [ ] 도메인 만료일 확인

## 침해 의심 시 대응

1. **즉시 차단**: 관리자 비밀번호 변경 + `SUPABASE_SERVICE_KEY` Rotate
2. **로그 확인**: Supabase Dashboard → Logs / Netlify Functions Logs 에서 의심 시각 전후 요청 분석
3. **데이터 복구 준비**: Supabase Backups → 가장 최근 정상 상태로 point-in-time recovery 가능한지 확인
4. **외부 도움**: 필요 시 Supabase·Netlify·Cloudinary 고객지원 개별 연락
5. **사후 기록**: 발생 시점·원인·대응·재발 방지 대책을 이 문서 또는 별도 인시던트 로그에 남김
