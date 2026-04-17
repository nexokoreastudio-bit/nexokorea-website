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
  const imageRoleGuide = imgCount <= 2
    ? '이미지 1~2장은 마무리 섹션 중심으로 배치하고, 설치 완료 모습을 후기처럼 정리하세요.'
    : imgCount <= 4
      ? '이미지 1장은 도착/현장 소개, 2~3장은 설치 진행, 마지막 1장은 설치 완료로 배치하세요.'
      : '이미지 1장은 도착 직후, 2~4장은 설치 진행, 마지막 1~2장은 설치 완료와 외관/사이니지로 자연스럽게 배치하세요.';

  return `당신은 NEXO KOREA 전자칠판 설치 후기를 작성하는 에디터입니다.
출력 결과는 기업 공지문이 아니라 네이버 카페 후기글처럼 친근하고 읽기 쉬워야 합니다.

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
  "captions": ["캡션1", "캡션2"],
  "content": "HTML body 내용만"
}
3. content는 DOCTYPE, html, head, body, style 태그 없이 **h3, h4, p, img, figure, figcaption, strong, em, ul, li, blockquote, hr** 만 사용하세요.
4. content는 반드시 4단 구조를 따르세요: **인사 → 현장 소개 → 시공 진행 → 마무리 + 문의 유도**
5. 첫 문장은 반드시 친근한 인사로 시작하세요. 예: "안녕하세요, NEXO KOREA입니다 😊"
6. 어투는 사무적인 "~했습니다" 위주가 아니라 후기글처럼 **"~했어요 / ~드렸습니다 / ~보실 수 있어요"** 를 자연스럽게 섞어 부드럽게 쓰세요.
7. 이모지는 과하지 않게 섹션 헤더나 첫 문장에만 사용하세요. 사용 가능 예: ✅ 📍 🛠️ ✨ 😊
8. 문단은 1~2문장씩 짧게 끊고, 핵심 표현은 <strong>로 강조하세요.
9. content 안에는 아래 구조를 반드시 반영하세요.
<p>👋 인사 + 이번 시공 한 줄 소개</p>
<h4>📍 현장 정보</h4>
<p>기관명 · 지역 · 특이사항 짧게</p>
<h4>🛠️ 설치 진행</h4>
${Array.from({ length: imgCount }, (_, i) => `<figure>[이미지${i + 1}]<figcaption>캡션 ${i + 1}</figcaption></figure>`).join('\n')}
<h4>✨ 설치 완료</h4>
<blockquote>💡 이번 현장 포인트 1~2문장</blockquote>
<hr>
<p>📞 <strong>설치 문의</strong> 032-569-5771 / nexokorea@gmail.com</p>
10. ${imageRoleGuide}
11. captions 배열 길이는 반드시 ${imgCount}개여야 하며, 각 캡션은 **12~25자** 사이의 자연스러운 후기형 문장 조각으로 작성하세요.
12. [이미지N] 플레이스홀더는 반드시 ${imgCount}개 전부 사용하세요. 하나도 빠뜨리지 마세요.
13. blockquote는 반드시 1개 넣고, 마지막에는 반드시 hr 뒤에 문의 문장을 1개 넣으세요.
14. description은 공개 모달 상단에 들어갈 짧은 요약입니다. 현장 특징, 설치 목적, 고객이 체감할 포인트를 2~3문장으로 작성하세요.
15. category는 설치 기관 성격에 맞게 하나만 선택하세요.
16. equipment_model은 모델명이 보이면 그대로 쓰고, 불명확하면 빈 문자열로 두세요.
17. installation_size는 인치, 대수, 벽걸이/스탠드 수량이 보이면 자연스럽게 정리하고, 없으면 빈 문자열로 두세요.`;
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
