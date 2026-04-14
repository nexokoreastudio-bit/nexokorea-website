# Google Sheets 견적문의 연동

이 프로젝트의 견적문의 폼은 이제 Google Apps Script 웹앱 URL이 설정되면 해당 URL로 데이터를 전송할 수 있습니다.

## 1. Apps Script 만들기

1. 구글 시트 `1egc4hm4w-SK6aAK8PK9mysxOaKUoQrlugZZ-XuHXxgw` 를 엽니다.
2. 상단 메뉴에서 `확장 프로그램 > Apps Script` 로 이동합니다.
3. 기본 코드를 모두 지우고 [quote-form.gs](/Users/nexo_jo/Desktop/Nexo_workspace/Nexo_web_bro_1/google-apps-script/quote-form.gs) 내용을 붙여넣습니다.
4. 저장합니다.
5. 알림 메일을 바꾸려면 `NOTIFICATION_EMAIL` 값을 원하는 주소로 수정합니다.

## 2. 웹앱 배포

1. Apps Script 우측 상단 `배포 > 새 배포` 를 누릅니다.
2. 유형은 `웹 앱`을 선택합니다.
3. 실행 사용자는 `나`로 둡니다.
4. 액세스 권한은 `모든 사용자`로 설정합니다.
5. 배포 후 생성된 `웹 앱 URL`을 복사합니다.

## 3. 프런트 연결

1. [config.js](/Users/nexo_jo/Desktop/Nexo_workspace/Nexo_web_bro_1/config.js) 파일의 `window.NEXO_QUOTE_ENDPOINT` 값에 웹앱 URL을 넣습니다.
2. 사이트를 다시 배포합니다.

예시:

```js
window.NEXO_QUOTE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec';
```

## 4. 저장 컬럼

첫 번째 시트의 첫 행은 아래 한국어 헤더로 맞춰집니다.

- 접수일시
- 이름
- 회사/기관명
- 연락처
- 이메일
- 관심 제품
- 설치 주소
- 문의 내용
- 유입 페이지
- 페이지 URL

## 5. 메일 알림

견적문의가 들어오면 `NOTIFICATION_EMAIL` 주소로 메일이 발송됩니다.

- 기본값: `nexo.korea.studio@gmail.com`
- 메일 제목 예시: `[넥소코리아] 견적문의 접수 - 홍길동`

## 6. 주의사항

- 현재 코드는 `Google Apps Script URL`이 있으면 구글 시트로 전송합니다.
- URL이 비어 있으면 기존처럼 Netlify 폼 제출을 시도합니다.
- 로컬 테스트(`localhost`, `127.0.0.1`, `?test=true`)에서는 실제 전송 대신 콘솔에 데이터만 출력합니다.
