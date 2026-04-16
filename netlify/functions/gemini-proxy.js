const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  if (type === 'case') {
    prompt = buildCasePrompt(data);
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
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

  return `당신은 NEXO KOREA 전자칠판 설치사례 글을 작성합니다.

## 설치 정보
- 기관명: ${storeName || '미입력'}
- 지역: ${location || '미입력'}
- 모델: ${model || '미입력'}
- 벽걸이: ${wallMount || '없음'}
- 스탠드: ${stand || '없음'}
- 추가 케이블: ${additionalCables || '없음'}
- 특이사항: ${notes || '없음'}
- 첨부 이미지: ${imgCount}장

## 반드시 지켜야 할 작성 규칙

1. **HTML body 내용만 출력** — DOCTYPE, html, head, body, style 태그 절대 포함하지 마세요. p, h3, img 태그만 사용.
2. **사진-글 교차 구조**: 반드시 아래 패턴을 따르세요:
${Array.from({length: imgCount}, (_, i) => `   [이미지${i+1}]\n   <p>이 사진에 대한 설명 1~2문장</p>`).join('\n')}
3. **글 시작**: 첫 줄에 <h3>기관명 + 모델명 설치 완료</h3>, 그 아래 <p>로 설치 개요 2~3문장</p>
4. **각 이미지 아래 설명**: 해당 사진과 관련된 설치 내용만 1~2문장. 제품 홍보 금지.
5. **글 끝**: 마지막에 <p>문의: 032-569-5771 | nexokorea@gmail.com</p> 한 줄만.
6. **총 분량**: 300~500자 이내. 짧고 간결하게.
7. **어투**: "~했습니다" 존칭체.
8. **금지**: 마크다운 문법(\`\`\`, #, **, - 등), 제품 스펙 나열, 장황한 홍보 문구, DOCTYPE/head/style 태그.
9. **[이미지N] 플레이스홀더는 반드시 ${imgCount}개 전부 사용**하세요. 하나도 빠뜨리지 마세요.`;
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
