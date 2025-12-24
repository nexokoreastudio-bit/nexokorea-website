# GitHub 저장소 생성 및 Netlify 연결 가이드

## 📋 단계별 가이드

### 1단계: GitHub에 새 저장소 생성

1. **GitHub 접속**
   - https://github.com/nexokoreastudio-bit 접속
   - 로그인 확인

2. **새 저장소 생성**
   - 우측 상단 "+" 버튼 클릭 → "New repository" 선택
   - 또는 https://github.com/new 접속

3. **저장소 설정**
   - **Repository name**: `nexokorea-website` (또는 원하는 이름)
   - **Description**: "NEXO KOREA 공식 웹사이트"
   - **Visibility**: Private 또는 Public 선택
   - ⚠️ **중요**: "Initialize this repository with a README" 체크 해제
   - "Create repository" 클릭

4. **저장소 URL 확인**
   - 생성 후 표시되는 페이지에서 저장소 URL 복사
   - 예: `https://github.com/nexokoreastudio-bit/nexokorea-website.git`

---

### 2단계: 로컬 프로젝트를 GitHub에 연결

터미널에서 다음 명령어 실행:

```bash
cd "/Users/soriul79/Library/Mobile Documents/com~apple~CloudDocs/넥소코리아/Nexo_web_bro_1"

# GitHub 원격 저장소 추가 (위에서 복사한 URL 사용)
git remote add origin https://github.com/nexokoreastudio-bit/nexokorea-website.git

# 또는 SSH 사용 시
# git remote add origin git@github.com:nexokoreastudio-bit/nexokorea-website.git

# 브랜치 이름을 main으로 변경 (GitHub 기본값)
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**인증 필요 시:**
- GitHub Personal Access Token 사용
- 또는 SSH 키 설정

---

### 3단계: Netlify에서 GitHub 저장소 연결

1. **Netlify 대시보드 접속**
   - https://app.netlify.com
   - 회사 계정(nexo.korea.studio@gmail.com)으로 로그인 확인

2. **새 사이트 생성**
   - "Add new site" → "Import an existing project" 클릭
   - "GitHub" 선택

3. **GitHub 권한 부여**
   - "Configure the Netlify app on GitHub" 클릭
   - GitHub에서 Netlify 앱 권한 승인
   - 저장소 접근 권한 부여

4. **저장소 선택**
   - `nexokoreastudio-bit` 계정 선택
   - `nexokorea-website` 저장소 선택

5. **빌드 설정**
   - **Branch to deploy**: `main`
   - **Build command**: (비워두기 - 정적 사이트)
   - **Publish directory**: `.` (현재 디렉토리)
   - "Deploy site" 클릭

---

### 4단계: 도메인 연결

1. **Netlify 대시보드**
   - 프로젝트 → "Domain management"
   - "Add custom domain" 클릭
   - `nexokorea.co.kr` 입력

2. **가비아 DNS 설정**
   - 가비아에서 도메인 관리
   - 네임서버를 Netlify가 제공한 네임서버로 변경
   - 또는 A 레코드/CNAME 레코드 설정

---

## 🔧 문제 해결

### GitHub 푸시 실패 시

**Personal Access Token 생성:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` (전체 저장소 접근)
4. 토큰 생성 후 복사
5. 푸시 시 비밀번호 대신 토큰 사용

### Netlify에서 저장소를 찾을 수 없을 때

1. GitHub에서 Netlify 앱 권한 확인
   - GitHub → Settings → Applications → Authorized OAuth Apps
   - Netlify 앱 확인 및 권한 재설정

2. 저장소 접근 권한 확인
   - GitHub 저장소가 Private인 경우, Netlify에 접근 권한 부여 필요

---

## ✅ 완료 체크리스트

- [ ] GitHub 저장소 생성 완료
- [ ] 로컬 프로젝트 GitHub에 푸시 완료
- [ ] Netlify에서 GitHub 저장소 연결 완료
- [ ] 자동 배포 설정 완료
- [ ] 도메인 연결 완료
- [ ] 사이트 접속 테스트 완료

---

**작성일**: 2024년 12월
**작성자**: NEXO KOREA 개발팀

