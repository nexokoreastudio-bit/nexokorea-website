# 02. 배포·롤백 절차

## 배포 방식

Netlify Git 연동 자동 배포 (또는 수동 배포). 커밋이 `main` 에 push 되면 자동으로 Netlify 가 빌드·배포.

## 평상시 콘텐츠 수정 배포

**대부분의 경우 코드 수정이 필요 없고**, 관리자 에디터([03-admin-editor.md](./03-admin-editor.md)) 로 콘텐츠만 수정하면 됩니다 — 실시간 반영 (Supabase DB 직접 쓰기).

코드 수정이 필요한 경우(레이아웃·정적 텍스트·컴포넌트):

```
cd ~/Desktop/Nexo_workspace/00_회사/🟢_작업중/nexokorea-website
# 로컬 테스트
netlify dev   # 또는 npm run dev (package.json 참조)
# 변경 사항 검토 후
git add <변경된 파일>
git commit -m "descriptive message"
git push origin main
# → Netlify 가 자동 빌드·배포 (1~3분 소요)
```

로컬 테스트 상세: [로컬 테스트 가이드](../../로컬_테스트_가이드.md)

## 배포 상태 확인

- Netlify Dashboard → 해당 사이트 → Deploys 탭
- 각 배포별 "Published / Failed / Canceled" 상태 확인 가능
- 빌드 로그에서 오류 원인 추적

## 빌드 실패 시 체크

1. **환경변수 누락** — Netlify Settings → Environment variables 확인
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY` 등
2. **Node 버전** — `netlify.toml` 에 명시된 버전과 Netlify 설정 일치 확인
3. **함수 번들링 오류** — `netlify/functions/` 아래 코드 문제
4. **도메인·SSL 설정** — 자주 있는 원인 아님. Domain management 확인

## 롤백

Netlify Dashboard → Deploys → 원하는 이전 배포 → "Publish deploy" 클릭
- 즉시 해당 배포 상태로 되돌림
- Git 히스토리는 건드리지 않음 (코드는 그대로)

## 긴급 장애 시 대응 순서

1. **사이트 접속 안 됨** → Netlify Status Page + 자사 Netlify 대시보드 확인
2. **관리자 에디터 로그인 안 됨** → Supabase Dashboard 상태 + `users` 테이블 role 확인
3. **이미지 업로드 실패** → Cloudinary 계정·API key·쿼터 확인
4. **AI 설치사례 생성 실패** → Gemini API 쿼터·`gemini-proxy` 함수 로그 확인
5. **DB 데이터 사라짐** → Supabase Dashboard → Database → Backups 에서 복구

## 배포 전 체크리스트 (코드 변경 시)

- [ ] 로컬에서 `netlify dev` 로 동작 확인
- [ ] 관리자 로그인 + 각 콘텐츠 타입 CRUD 1회씩 확인
- [ ] 관리자 페이지·공개 페이지 모두 브라우저에서 열어봄
- [ ] 모바일 뷰 (DevTools 디바이스 모드) 확인
- [ ] Cloudinary 이미지 업로드 1회 테스트
- [ ] Git commit 메시지는 descriptive 하게 (왜 바꿨는지)
- [ ] push 후 Netlify 배포 성공 확인 → 프로덕션 URL 에서 재확인

## 환경변수 (요약)

Netlify Dashboard → Site Settings → Environment variables 에 등록:

| 변수 | 용도 | 노출 범위 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL | Build + Functions |
| `SUPABASE_SERVICE_KEY` | 서버 측 관리자 권한 | **Functions 전용 — 프론트 노출 금지** |
| `SUPABASE_ANON_KEY` | 프론트 anon key | Build + Functions |
| `GEMINI_API_KEY` | Gemini API 호출 | Functions 전용 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 이름 | Build |
| `CLOUDINARY_UPLOAD_PRESET` | 업로드 프리셋 | Build |

(실제 환경변수명은 `netlify/functions/` 코드에서 재확인 — 위는 참고용)
