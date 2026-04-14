const SPREADSHEET_ID = '1egc4hm4w-SK6aAK8PK9mysxOaKUoQrlugZZ-XuHXxgw';
const NOTIFICATION_EMAIL = 'nexo.korea.studio@gmail.com';
const HEADER_ROW = [
  '접수일시',
  '이름',
  '회사/기관명',
  '연락처',
  '이메일',
  '관심 제품',
  '설치 주소',
  '문의 내용',
  '유입 페이지',
  '페이지 URL'
];

function getTargetSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  } else {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  }

  return sheet;
}

function sendNotificationEmail(payload) {
  const subject = `[넥소코리아] 견적문의 접수 - ${payload.name || '이름 미입력'}`;
  const body = [
    '새 견적문의가 접수되었습니다.',
    '',
    `접수일시: ${payload.submitted_at || new Date().toISOString()}`,
    `이름: ${payload.name || ''}`,
    `회사/기관명: ${payload.company || ''}`,
    `연락처: ${payload.phone || ''}`,
    `이메일: ${payload.email || ''}`,
    `관심 제품: ${payload.product || ''}`,
    `설치 주소: ${payload.address || ''}`,
    `문의 내용: ${payload.message || ''}`,
    `유입 페이지: ${payload.source_page || ''}`,
    `페이지 URL: ${payload.page_url || ''}`
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = getTargetSheet();

    sheet.appendRow([
      payload.submitted_at || new Date().toISOString(),
      payload.name || '',
      payload.company || '',
      payload.phone || '',
      payload.email || '',
      payload.product || '',
      payload.address || '',
      payload.message || '',
      payload.source_page || '',
      payload.page_url || ''
    ]);

    sendNotificationEmail(payload);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
