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

  return `당신은 NEXO KOREA 전자칠판 설치사례 데이터를 정리합니다.

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

1. 반드시 **JSON 하나만 출력**하세요. 마크다운 코드블록(\`\`\`) 금지.
2. 아래 shape를 정확히 지키세요.
{
  "description": "설치사례 요약 2~3문장",
  "category": "학원 | 유치원/어린이집 | 학교 | 기업 | 관공서 | 기타 중 하나",
  "equipment_model": "설치 모델명",
  "installation_size": "설치 면적/사이즈 또는 대수",
  "content": "HTML body 내용만"
}
3. content는 DOCTYPE, html, head, body, style 태그 없이 p, h3, img 태그만 사용하세요.
4. content는 반드시 아래 사진-글 교차 패턴을 따르세요:
${Array.from({length: imgCount}, (_, i) => `   [이미지${i+1}]\n   <p>이 사진에 대한 설명 1~2문장</p>`).join('\n')}
5. content 시작은 <h3>기관명 + 모델명 설치 완료</h3>, 그 아래 <p>로 설치 개요 2~3문장</p>입니다.
6. 각 이미지 아래 설명은 해당 사진과 관련된 설치 내용만 1~2문장으로 쓰고, 마지막에는 <p>문의: 032-569-5771 | nexokorea@gmail.com</p> 한 줄만 넣으세요.
7. description은 공개 모달 상단에 들어갈 짧은 요약입니다. 홍보 문구보다 현장 특성과 설치 목적 중심으로 2~3문장 작성하세요.
8. category는 설치 기관 성격에 맞게 하나만 선택하세요.
9. equipment_model은 모델명이 보이면 그대로 쓰고, 불명확하면 빈 문자열로 두세요.
10. installation_size는 인치, 대수, 설치 수량이 보이면 자연스럽게 정리하고, 없으면 빈 문자열로 두세요.
11. 전체 어투는 "~했습니다" 존칭체로 유지하세요.
12. [이미지N] 플레이스홀더는 반드시 ${imgCount}개 전부 사용하세요.`;
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
