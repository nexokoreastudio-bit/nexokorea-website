/**
 * 현장소식 텍스트 파싱 (jeonchilpan 포팅)
 * 카톡 메시지 형식의 자유 텍스트를 구조화된 데이터로 변환
 */

function parseFieldNewsText(text) {
  const result = {};
  if (!text || !text.trim()) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const match = (pattern) => line.match(pattern);

    const m1 = match(/^상점명\s*[:：]\s*(.+)$/i);
    if (m1) { result.storeName = m1[1].trim(); continue; }

    const m2 = match(/[\(（]?\s*지역\s*[:：]\s*(.+?)[\)）]?$/i);
    if (m2) { result.location = m2[1].trim().replace(/[\(\)（）]/g, ''); continue; }

    const m3 = match(/^추가\s*케이블\s*[:：]\s*(.+)$/i);
    if (m3) { result.additionalCables = m3[1].trim(); continue; }

    const m4 = match(/^스탠드\s*[:：]\s*(.*)$/i);
    if (m4 && m4[1].trim()) { result.stand = m4[1].trim(); continue; }

    const m5 = match(/^벽걸이\s*[:：]\s*(.+)$/i);
    if (m5) { result.wallMount = m5[1].trim(); continue; }

    const m6 = match(/^모델\s*[:：]\s*(.+)$/i);
    if (m6) { result.model = m6[1].trim(); continue; }

    const m7 = match(/^결제\s*[:：]\s*(.*)$/i);
    if (m7 && m7[1].trim()) { result.payment = m7[1].trim(); continue; }

    const m8 = match(/^특이사항\s*[:：]\s*(.*)$/i);
    if (m8) {
      let notes = m8[1].trim();
      let skip = 0;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^(상점명|지역|추가\s*케이블|스탠드|벽걸이|모델|결제|특이사항)\s*[:：]/i)) break;
        notes += '\n' + lines[j];
        skip++;
      }
      if (notes.trim()) result.notes = notes.trim();
      i += skip;
      continue;
    }
  }

  return result;
}

function generateTitle(parsed) {
  return parsed.storeName ? `${parsed.storeName} 설치 완료` : '현장 설치 완료';
}

window.parseFieldNewsText = parseFieldNewsText;
window.generateTitle = generateTitle;
