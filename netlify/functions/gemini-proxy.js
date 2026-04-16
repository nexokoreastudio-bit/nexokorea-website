const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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

  return `당신은 NEXO KOREA 전자칠판 설치 전문 블로그 작가입니다. B2B 고객(학교 관계자, 기업 구매 담당자)이 읽었을 때 신뢰감을 주는 전문적이면서도 친근한 설치 사례 글을 작성해주세요.

## 설치 정보
- 기관명: ${storeName || '미입력'}
- 지역: ${location || '미입력'}
- 모델: ${model || '미입력'}
- 벽걸이: ${wallMount || '없음'}
- 스탠드: ${stand || '없음'}
- 추가 케이블: ${additionalCables || '없음'}
- 특이사항: ${notes || '없음'}
- 첨부 이미지 수: ${imageCount || 0}장

## 작성 규칙
1. HTML 형식으로 작성 (h2, h3, p, ul, li 사용)
2. 이미지가 있으면 적절한 위치에 [이미지1], [이미지2] 등 플레이스홀더 배치
3. 설치 과정, 제품 특징, 고객 만족 포인트를 자연스럽게 포함
4. NEXO 전자칠판의 핵심 강점(4K UHD, Zero Gap Bonding, AI 카메라, 무선 미러링) 중 관련 항목 언급
5. 문의 유도 블록을 글 하단에 1회 삽입 (전화: 032-569-5771, 이메일: nexokorea@gmail.com)
6. 1000~1500자 분량
7. 어투: "~합니다" 존칭체, 전문적이지만 딱딱하지 않게`;
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
