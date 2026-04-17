const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CASE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    category: { type: 'string', enum: ['학원', '유치원/어린이집', '학교', '기업', '관공서', '기타'] },
    equipment_model: { type: 'string' },
    installation_size: { type: 'string' },
    captions: { type: 'array', items: { type: 'string' } },
    intro: { type: 'string' },
    site_intro: { type: 'string' },
    progress_notes: { type: 'array', items: { type: 'string' } },
    outro_point: { type: 'string' },
  },
  required: ['description', 'category', 'captions', 'intro', 'site_intro', 'progress_notes', 'outro_point'],
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.startsWith('AIza')) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
      const match = envFile.match(/GEMINI_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim();
    } catch {}
  }
  if (!apiKey || !apiKey.startsWith('AIza')) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { type, data } = body;

  let prompt;
  let generationConfig = { temperature: 0.7, maxOutputTokens: 4096 };
  if (type === 'case') {
    prompt = buildCasePrompt(data);
    generationConfig = {
      ...generationConfig,
      responseMimeType: 'application/json',
      responseJsonSchema: CASE_RESPONSE_SCHEMA,
    };
  } else if (type === 'blog') {
    prompt = buildBlogPrompt(data);
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'type must be "case" or "blog"' }) };
  }

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });

      if (res.status === 429 && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        return { statusCode: res.status, body: JSON.stringify({ error: `Gemini API error: ${err}` }) };
      }

      const json = await res.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, content }),
      };
    } catch (err) {
      if (attempt === maxRetries - 1) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }
  }
};

function buildCasePrompt(data) {
  const { storeName, location, model, wallMount, stand, additionalCables, notes, imageCount } = data;
  const imgCount = parseInt(imageCount) || 0;
  const imageRoleGuide = imgCount <= 2
    ? '이미지 1~2장은 마무리 섹션 중심으로 배치하고, 설치 완료 모습을 후기처럼 정리하세요.'
    : imgCount <= 4
      ? '이미지 1장은 도착/현장 소개, 2~3장은 설치 진행, 마지막 1장은 설치 완료로 배치하세요.'
      : '이미지 1장은 도착 직후, 2~4장은 설치 진행, 마지막 1~2장은 설치 완료와 외관/사이니지로 자연스럽게 배치하세요.';

  return `당신은 NEXO KOREA 전자칠판 설치 후기를 정리하는 에디터입니다.
출력 결과는 기업 공지문이 아니라 네이버 카페 후기글처럼 친근하고 읽기 쉬운 톤이어야 합니다.
하지만 HTML은 절대 만들지 말고, 반드시 구조화된 JSON 필드만 채우세요.

## 설치 정보
- 기관명: ${storeName || '미입력'}
- 지역: ${location || '미입력'}
- 모델: ${model || '미입력'}
- 벽걸이: ${wallMount || '없음'}
- 스탠드: ${stand || '없음'}
- 추가 케이블: ${additionalCables || '없음'}
- 특이사항: ${notes || '없음'}
- 첨부 이미지: ${imgCount}장

## 반드시 지켜야 할 출력 규칙

1. 반드시 JSON 필드만 채우세요. HTML, 마크다운, 코드블록을 절대 쓰지 마세요.
2. description은 공개 모달 상단에 들어갈 요약 2~3문장입니다. 현장 특징, 설치 목적, 기대 효과를 자연스럽게 정리하세요.
3. category는 설치 기관 성격에 맞게 하나만 선택하세요.
4. equipment_model은 모델명이 보이면 그대로 쓰고, 없으면 빈 문자열로 두세요.
5. installation_size는 인치, 대수, 벽걸이/스탠드 수량이 보이면 자연스럽게 정리하고, 없으면 빈 문자열로 두세요.
6. intro는 네이버 카페 후기글 첫 인사 문단입니다. "안녕하세요, NEXO KOREA입니다 😊" 류의 친근한 도입 1~2문장으로 작성하세요.
7. site_intro는 현장 정보 섹션에 들어갈 2~3문장입니다. 기관명, 지역, 이번 설치 의미, 특이사항을 정보 중심으로 친근하게 정리하세요.
8. progress_notes는 사진 N장에 대응하는 본문 단락 배열입니다. 길이는 반드시 ${imgCount}개로 맞추고, 각 항목은 사진 1장에 대응하는 1~2문장으로 작성하세요.
9. captions도 길이를 반드시 ${imgCount}개로 맞추세요. 각 캡션은 12~25자 사이의 짧은 사진 라벨이고, progress_notes와 같은 문장을 반복하면 안 됩니다.
10. outro_point는 마무리 blockquote에 들어갈 1~2문장입니다. "특히 ~한 점이 인상적이었어요"처럼 현장 포인트를 부드럽게 써주세요.
11. 전체 어투는 "~했어요 / ~드렸습니다 / ~보실 수 있어요" 같은 부드러운 존칭체로 유지하세요.
12. 이모지는 과하지 않게 intro나 문장 첫머리에만 자연스럽게 사용하세요. 예: 😊 ✨ 📍 🛠️
13. ${imageRoleGuide}
14. progress_notes는 캡션과 다른 역할입니다.
- captions: 사진 한 장의 짧은 제목
- progress_notes: 그 사진에 대한 본문 설명
15. 사진이 적더라도 억지로 장황하게 쓰지 말고, 실제 후기처럼 짧고 읽기 쉽게 작성하세요.`;
}

function buildBlogPrompt(data) {
  const { topic, keywords, targetLength } = data;

  return `당신은 NEXO KOREA의 전자칠판 전문 블로그 에디터입니다. SEO 최적화된 블로그 포스트를 작성해주세요.

## 주제
${topic}

## 타겟 키워드
${(keywords || []).join(', ')}

## 작성 규칙
1. HTML 형식 (h2, h3, p, ul, li, strong 사용)
2. ${targetLength || 2000}자 내외
3. 서론-본론-결론 구조
4. 타겟 키워드를 자연스럽게 3~5회 포함
5. 실용적 정보 중심 (기술 사양보다는 활용 가치)
6. 하단에 NEXO 제품 소개 + 문의 유도 블록 (전화: 032-569-5771)
7. 어투: "~합니다" 존칭체, 정보성 블로그 톤`;
}
