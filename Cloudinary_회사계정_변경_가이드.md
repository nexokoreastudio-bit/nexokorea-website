# Cloudinary 회사 계정 변경 가이드

## 📋 개요
후기 이미지 호스팅을 개인 계정에서 회사 계정으로 변경하는 방법

**현재 설정**:
- Cloud Name: `dthtfs1mf`
- Upload Preset: `nexo-reviews-unsigned`
- 계정: 개인 계정

**변경 목표**:
- 회사 계정으로 새 Cloudinary 계정 생성
- 새 Cloud Name 및 Upload Preset 설정
- 코드 업데이트

---

## 🔄 변경 단계

### 1단계: 회사 계정으로 Cloudinary 계정 생성

1. **Cloudinary 가입**
   - https://cloudinary.com 접속
   - "Sign Up" 클릭
   - 회사 이메일로 가입: `nexo.korea.studio@gmail.com`

2. **계정 확인**
   - 이메일 인증 완료
   - 대시보드 접속: https://console.cloudinary.com

---

### 2단계: Cloudinary 설정 확인

1. **Dashboard 접속**
   - https://console.cloudinary.com
   - 회사 계정으로 로그인

2. **Cloud Name 확인**
   - Dashboard 상단에 표시됨
   - 예: `dthtfs1mf` (현재 개인 계정)
   - 새 계정의 Cloud Name 복사

3. **Upload Preset 생성**
   - **Settings** → **Upload** 클릭
   - **Upload presets** 섹션으로 이동
   - **Add upload preset** 클릭
   - 설정:
     - **Preset name**: `nexo-reviews-unsigned`
     - **Signing mode**: `Unsigned` (필수!)
     - **Folder**: `nexo-reviews` (선택)
     - **Format**: `Auto` (선택)
     - **Quality**: `Auto` (선택)
   - **Save** 클릭

---

### 3단계: 코드 업데이트

#### index.html 수정

**위치**: `index.html` 약 1292-1293줄

**현재 코드**:
```javascript
const CLOUDINARY_CLOUD_NAME = 'dthtfs1mf'; // Cloudinary Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'nexo-reviews-unsigned'; // Upload Preset (unsigned)
```

**변경할 코드**:
```javascript
const CLOUDINARY_CLOUD_NAME = '새로운-cloud-name'; // Cloudinary Cloud Name (회사 계정)
const CLOUDINARY_UPLOAD_PRESET = 'nexo-reviews-unsigned'; // Upload Preset (unsigned)
```

**주의사항**:
- `CLOUDINARY_CLOUD_NAME`만 새 계정의 Cloud Name으로 변경
- `CLOUDINARY_UPLOAD_PRESET`은 동일한 이름으로 유지 (새로 생성한 preset 이름)

---

### 4단계: 기존 이미지 마이그레이션 (선택사항)

#### 옵션 1: 기존 이미지 유지 (권장)
- 기존 개인 계정의 이미지는 그대로 유지
- 새로 추가되는 이미지만 회사 계정에 저장
- 기존 후기는 계속 정상 표시됨

#### 옵션 2: 기존 이미지 마이그레이션
1. **개인 계정에서 이미지 다운로드**
   - https://console.cloudinary.com (개인 계정)
   - Media Library → `nexo-reviews` 폴더
   - 이미지 다운로드

2. **회사 계정에 업로드**
   - https://console.cloudinary.com (회사 계정)
   - Media Library → `nexo-reviews` 폴더
   - 이미지 업로드

3. **코드에서 URL 업데이트** (복잡함)
   - localStorage에 저장된 기존 이미지 URL 수동 변경
   - 또는 기존 후기 삭제 후 재등록

**권장**: 옵션 1 (기존 이미지 유지)

---

## ✅ 변경 완료 체크리스트

- [ ] 회사 계정으로 Cloudinary 가입 완료
- [ ] Cloud Name 확인 및 복사
- [ ] Upload Preset 생성 완료 (`nexo-reviews-unsigned`)
- [ ] `index.html`에서 Cloud Name 업데이트
- [ ] 변경사항 커밋 및 배포
- [ ] 새 후기 이미지 업로드 테스트
- [ ] 이미지가 정상적으로 표시되는지 확인

---

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# 로컬 서버 실행
python3 -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

### 2. 테스트 단계
1. 웹사이트에서 관리자 로그인
2. 후기 추가 버튼 클릭
3. 이미지 1개 선택하여 업로드
4. Cloudinary 대시보드에서 이미지 확인
5. 웹사이트에서 이미지가 정상 표시되는지 확인

### 3. 배포 후 테스트
1. 변경사항 커밋 및 푸시
2. Netlify 자동 배포 완료 대기 (1-2분)
3. 프로덕션 사이트에서 테스트
4. 실제 이미지 업로드 확인

---

## 🔧 문제 해결

### 문제: 이미지가 업로드되지 않음

**원인 확인**:
1. Cloud Name이 올바른지 확인
2. Upload Preset이 존재하는지 확인
3. Upload Preset이 `Unsigned`로 설정되어 있는지 확인

**해결 방법**:
- 브라우저 콘솔(F12)에서 에러 메시지 확인
- Cloudinary 대시보드에서 설정 재확인

### 문제: 이미지가 표시되지 않음

**원인 확인**:
1. 이미지 URL이 올바른지 확인
2. Cloudinary에서 이미지가 존재하는지 확인
3. CORS 문제 확인

**해결 방법**:
- Cloudinary는 CORS를 지원하므로 문제 없어야 함
- 이미지 URL을 브라우저에서 직접 접속해 확인

### 문제: 기존 이미지가 사라짐

**해결 방법**:
- 기존 개인 계정의 이미지는 그대로 유지됨
- 새 이미지만 회사 계정에 저장
- 기존 이미지는 계속 정상 표시됨

---

## 📊 Cloudinary 무료 플랜 제한

### 무료 플랜 제공량
- **저장 용량**: 월 25GB
- **대역폭**: 월 25GB
- **변환**: 월 25,000건
- **관리 API**: 월 5,000건

### 사용량 확인
1. Cloudinary Dashboard → **Usage** 탭
2. 저장 용량, 대역폭, 변환 건수 확인
3. 무료 한도 초과 시 알림

### 한도 초과 시
- 이미지 업로드 불가 또는 느려짐
- 유료 플랜 업그레이드 필요 ($89/월부터)

---

## 🔐 보안 주의사항

### Upload Preset 보안
- ✅ **Unsigned preset** 사용 (서버 없이 업로드 가능)
- ✅ Preset 이름은 프론트엔드에 노출되어도 안전함
- ⚠️ API Key/Secret은 코드에 포함하지 않기

### 권장 사항
- Unsigned preset 사용 (현재 방식)
- 필요시 Signed preset 사용 가능 (더 안전하지만 서버 필요)

---

## 📝 코드 변경 예시

### 변경 전
```javascript
// index.html 1292-1293줄
const CLOUDINARY_CLOUD_NAME = 'dthtfs1mf'; // 개인 계정
const CLOUDINARY_UPLOAD_PRESET = 'nexo-reviews-unsigned';
```

### 변경 후
```javascript
// index.html 1292-1293줄
const CLOUDINARY_CLOUD_NAME = '새로운-cloud-name'; // 회사 계정
const CLOUDINARY_UPLOAD_PRESET = 'nexo-reviews-unsigned';
```

---

## 🔗 참고 링크

- **Cloudinary 대시보드**: https://console.cloudinary.com
- **Cloudinary 문서**: https://cloudinary.com/documentation
- **Upload Preset 설정**: https://cloudinary.com/documentation/upload_presets
- **JavaScript SDK**: https://cloudinary.com/documentation/javascript_integration

---

**작성일**: 2024년 12월  
**작성자**: NEXO KOREA 개발팀


