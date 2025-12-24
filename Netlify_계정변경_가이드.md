# Netlify 계정 변경 가이드

## 📋 개요
개인 계정에서 회사 계정(nexo.korea.studio@gmail.com)으로 프로젝트를 이전하는 방법입니다.

## 🔄 계정 변경 방법

### 방법 1: 새 프로젝트 생성 (권장)

#### 1단계: 현재 계정에서 로그아웃
```bash
netlify logout
```

#### 2단계: 회사 계정으로 로그인
```bash
netlify login
```
- 브라우저가 열리면 `nexo.korea.studio@gmail.com` 계정으로 로그인
- CLI 인증 완료

#### 3단계: 새 프로젝트 생성 및 배포
```bash
cd "/Users/soriul79/Library/Mobile Documents/com~apple~CloudDocs/넥소코리아/Nexo_web_bro_1"

# 새 프로젝트로 초기화 (기존 .netlify 폴더는 백업 후 삭제)
netlify init
```
- 프로젝트 이름: `nexokorea` (또는 원하는 이름)
- 배포 디렉토리: 현재 디렉토리 선택

#### 4단계: 프로덕션 배포
```bash
netlify deploy --prod
```

#### 5단계: 도메인 연결
1. Netlify 대시보드 접속: https://app.netlify.com
2. 프로젝트 선택
3. **Domain management** → **Add custom domain**
4. `nexokorea.co.kr` 입력
5. 가비아에서 DNS 설정:
   - 네임서버를 Netlify가 제공한 네임서버로 변경
   - 또는 A 레코드/CNAME 레코드 설정

---

### 방법 2: 기존 프로젝트 소유권 이전 (Netlify 지원 필요)

#### 1단계: Netlify 지원팀에 문의
1. https://app.netlify.com/support 접속
2. "Transfer site ownership" 요청
3. 다음 정보 제공:
   - 현재 사이트 ID: `4cd33e21-fe02-4776-84eb-9c9da4af38e5`
   - 현재 계정: soriul123456@gmail.com
   - 이전할 계정: nexo.korea.studio@gmail.com

#### 2단계: 소유권 이전 완료 후
```bash
netlify logout
netlify login  # 회사 계정으로
netlify link   # 기존 프로젝트에 연결
```

---

## ⚠️ 주의사항

### 도메인 연결
- 도메인(`nexokorea.co.kr`)은 가비아에서 관리 중
- Netlify 계정 변경 시 도메인 연결도 다시 설정 필요
- DNS 전파 시간: 24-48시간 소요 가능

### 데이터 백업
- ✅ 모든 파일은 로컬에 있음 (안전)
- ✅ Git 히스토리 보존
- ⚠️ Netlify Forms 데이터는 계정별로 분리됨
- ⚠️ 배포 히스토리는 새 프로젝트에서 새로 시작

### 폼 데이터
- 기존 폼 제출 내역은 개인 계정에 남아있음
- 필요시 Netlify 대시보드에서 CSV로 다운로드 가능

---

## 📝 단계별 체크리스트

### 사전 준비
- [ ] 회사 계정(nexo.korea.studio@gmail.com) 생성 확인
- [ ] 현재 프로젝트 파일 백업 확인
- [ ] Git 커밋 완료 확인

### 계정 변경
- [ ] `netlify logout` 실행
- [ ] `netlify login` (회사 계정)
- [ ] 새 프로젝트 생성 또는 기존 프로젝트 연결

### 배포 및 설정
- [ ] 프로덕션 배포 완료
- [ ] 도메인 연결 확인
- [ ] SSL 인증서 자동 발급 확인
- [ ] 사이트 접속 테스트

### 최종 확인
- [ ] https://nexokorea.co.kr 접속 확인
- [ ] 모바일 메뉴 작동 확인
- [ ] 폼 제출 테스트
- [ ] 이메일 알림 수신 확인

---

## 🔧 문제 해결

### 문제: 도메인이 연결되지 않음
**해결책:**
1. 가비아에서 DNS 설정 확인
2. Netlify 대시보드에서 도메인 상태 확인
3. DNS 전파 대기 (최대 48시간)

### 문제: SSL 인증서 발급 실패
**해결책:**
1. 도메인 연결 완료 후 자동 발급 (보통 몇 분 소요)
2. Netlify 대시보드 → Domain management → SSL/TLS 확인

### 문제: 폼이 작동하지 않음
**해결책:**
1. Netlify Forms 활성화 확인
2. 이메일 알림 설정 확인
3. 폼 필드 이름 확인

---

## 📞 참고 정보

### Netlify 지원
- **문서**: https://docs.netlify.com
- **지원**: https://app.netlify.com/support
- **도메인 가이드**: https://docs.netlify.com/domains-https/custom-domains/

### 현재 프로젝트 정보
- **사이트 ID**: 4cd33e21-fe02-4776-84eb-9c9da4af38e5
- **프로젝트명**: nexokorea
- **도메인**: nexokorea.co.kr

---

**작성일**: 2024년 12월
**작성자**: NEXO KOREA 개발팀

