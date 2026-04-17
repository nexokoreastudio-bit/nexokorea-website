/**
 * NEXO KOREA 통합 관리자 시스템
 * Supabase Auth + CRUD + Cloudinary 이미지 + Gemini AI
 */

const SUPABASE_URL = 'https://qwyeanxbtkzompzxndhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eWVhbnhidGt6b21wenhuZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTE5ODcsImV4cCI6MjA4NzEyNzk4N30.qj1dUEokDkvWN_Ukw1nkDqj_aSNwpgTZv7Qti9R5hro';
const CLOUDINARY_CLOUD_NAME = 'dthtfs1mf';
const CLOUDINARY_UPLOAD_PRESET = 'nexo-reviews-unsigned';

let sb = null;
let currentUser = null;
let currentToken = null;
let currentTab = 'reviews';
let pendingImages = [];
let adminInitialized = false;
let editingId = null;
const ADMIN_EMAIL = 'admin@nexokorea.co.kr';
const VIDEO_CATEGORIES = ['빠른 시작', '무선 연결·공유', '수업 활용', '관리 팁', '도입·구매'];
const LEGACY_VIDEO_CATEGORY_MAP = {
  제품소개: '도입·구매',
  사용법: '빠른 시작',
  설치영상: '빠른 시작',
  외관: '빠른 시작',
  기능: '',
  응용: '수업 활용',
  기타: '',
};

// ============ INIT ============

async function initAdmin() {
  if (adminInitialized) return;
  adminInitialized = true;

  if (typeof window.supabase === 'undefined') {
    console.warn('Supabase SDK not loaded');
    return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    currentToken = session.access_token;
    try {
      await checkAdminRole();
      openAdminPanel();
    } catch (e) {
      currentUser = null;
      currentToken = null;
    }
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      currentToken = session.access_token;
      try {
        await checkAdminRole();
        closeModal('adminLoginModal');
        openAdminPanel();
      } catch (e) {
        currentUser = null;
        currentToken = null;
      }
    }
    if (event === 'TOKEN_REFRESHED' && session) {
      currentToken = session.access_token;
    }
  });

  loadPublicReviews();

  setupTabs();
  setupForms();
  setupImageHandlers();
  setupGlobalPaste();
}

// ============ AUTH ============

async function handleEmailLogin() {
  const email = document.getElementById('adminEmail')?.value;
  const password = document.getElementById('adminPassword')?.value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  if (!email || !password) { if (errEl) { errEl.textContent = '이메일과 비밀번호를 입력하세요.'; errEl.classList.remove('hidden'); } return; }
  try {
    btn.textContent = '로그인 중...';
    btn.disabled = true;
    await adminLogin(email, password);
    closeModal('adminLoginModal');
    if (errEl) errEl.classList.add('hidden');
    openAdminPanel();
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
  } finally {
    btn.textContent = '로그인';
    btn.disabled = false;
  }
}

async function adminLogin(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    throw new Error(`관리자 로그인은 ${ADMIN_EMAIL} 계정만 사용할 수 있습니다.`);
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  await checkAdminRole();
}

async function checkAdminRole() {
  if (!currentUser) return;
  const normalizedEmail = (currentUser.email || '').trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    await sb.auth.signOut();
    currentUser = null;
    currentToken = null;
    throw new Error(`관리자 로그인은 ${ADMIN_EMAIL} 계정만 사용할 수 있습니다.`);
  }
  const { data } = await sb.from('users').select('role').eq('id', currentUser.id).single();
  if (!data || data.role !== 'admin') {
    await sb.auth.signOut();
    currentUser = null;
    currentToken = null;
    throw new Error('관리자 권한이 없습니다.');
  }
}

async function adminLogout() {
  await sb.auth.signOut();
  currentUser = null;
  closeModal('adminPanelModal');
}

function openAdminLogin() {
  if (currentUser) {
    openAdminPanel();
  } else {
    const emailInput = document.getElementById('adminEmail');
    if (emailInput) emailInput.value = ADMIN_EMAIL;
    openModal('adminLoginModal');
  }
}

function openAdminPanel() {
  const emailEl = document.getElementById('adminUserEmail');
  if (emailEl) emailEl.textContent = currentUser.email;
  openModal('adminPanelModal');
  switchTab(currentTab);
}

// ============ MODAL HELPERS ============

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    el.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

// ============ TABS ============

function setupTabs() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.toggle('hidden', c.id !== `tab-${tab}`));
  loadTabData(tab);
}

async function loadTabData(tab) {
  const config = {
    reviews: { table: 'nexo_reviews', listEl: 'reviewsList', order: 'created_at' },
    videos: { table: 'nexo_videos', listEl: 'videosList', order: 'sort_order' },
    'tech-docs': { table: 'nexo_tech_docs', listEl: 'techDocsList', order: 'sort_order' },
    manuals: { table: 'nexo_manuals', listEl: 'manualsList', order: 'created_at' },
    cases: { table: 'nexo_cases', listEl: 'casesList', order: 'created_at' },
  };
  const c = config[tab];
  if (!c || !sb) return;

  const { data, error } = await sb.from(c.table).select('*').order(c.order, { ascending: false });
  if (error) { console.error(error); return; }

  const el = document.getElementById(c.listEl);
  if (!el) return;

  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-slate-500 text-sm">등록된 항목이 없습니다.</p>';
    return;
  }

  el.innerHTML = data.map(item => renderListItem(tab, item)).join('');
}

function renderListItem(tab, item) {
  const published = item.is_published !== false;
  const badge = published
    ? '<span class="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded">공개</span>'
    : '<span class="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded">비공개</span>';

  let title = item.title || item.name || item.slug || 'Untitled';
  let subtitle = '';

  if (tab === 'reviews') {
    title = `${item.name} (${'★'.repeat(item.rating || 0)})`;
    subtitle = item.text ? item.text.substring(0, 80) + '...' : '';
  } else if (tab === 'videos') {
    const format = inferVideoFormat(item.youtube_url);
    const category = normalizeVideoCategory(item.category, item.title, item.youtube_url, format);
    subtitle = [format === 'shorts' ? 'Shorts' : '롱폼', category || '미분류'].join(' · ');
  } else if (tab === 'cases') {
    subtitle = item.location || '';
  }

  const table = {
    reviews: 'nexo_reviews', videos: 'nexo_videos', 'tech-docs': 'nexo_tech_docs',
    manuals: 'nexo_manuals', cases: 'nexo_cases'
  }[tab];

  return `<div class="flex items-center justify-between bg-slate-800 rounded-lg p-4 border border-slate-700">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-white font-medium text-sm truncate">${escapeHtml(title)}</span>
        ${badge}
      </div>
      ${subtitle ? `<p class="text-slate-400 text-xs truncate">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    <div class="flex gap-2 ml-3 shrink-0">
      <button onclick="editItem('${tab}','${item.id}')" class="text-xs px-3 py-1 rounded bg-blue-900 text-blue-200 hover:opacity-80 transition-opacity">수정</button>
      <button onclick="togglePublish('${table}','${item.id}',${!published})" class="text-xs px-3 py-1 rounded ${published ? 'bg-yellow-800 text-yellow-200' : 'bg-green-800 text-green-200'} hover:opacity-80 transition-opacity">
        ${published ? '숨기기' : '공개'}
      </button>
      <button onclick="deleteItem('${table}','${item.id}')" class="text-xs px-3 py-1 rounded bg-red-900 text-red-200 hover:opacity-80 transition-opacity">삭제</button>
    </div>
  </div>`;
}

// ============ GENERIC CRUD ============

async function insertItem(table, data) {
  console.log('[admin] insertItem:', table, data);
  if (!currentToken) throw new Error('로그인 세션 없음');

  if (table === 'nexo_videos') {
    await assertUniqueVideoEntry(data.youtube_url);
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[admin] insert error:', res.status, err);
    throw new Error(`등록 실패 (${res.status}): ${err}`);
  }

  const result = await res.json();
  console.log('[admin] insert success:', table, result);
}

async function togglePublish(table, id, publish) {
  if (!currentToken) return;
  const update = { is_published: publish };
  if (publish && table === 'nexo_cases') {
    update.published_at = new Date().toISOString();
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(update)
    });
    if (!res.ok) { const err = await res.text(); alert(`수정 실패: ${err}`); return; }
  } catch (e) { alert(e.message); return; }
  loadTabData(currentTab);
}

async function editItem(tab, id) {
  const tableMap = {
    reviews: 'nexo_reviews', videos: 'nexo_videos', 'tech-docs': 'nexo_tech_docs',
    manuals: 'nexo_manuals', cases: 'nexo_cases'
  };
  const table = tableMap[tab];
  if (!table || !currentToken) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=*`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${currentToken}` }
    });
    const rows = await res.json();
    if (!rows || rows.length === 0) return;
    const item = rows[0];

    const formMap = {
      reviews: 'reviewForm', videos: 'videoForm', 'tech-docs': 'techDocForm',
      manuals: 'manualForm', cases: 'caseForm'
    };
    const form = document.getElementById(formMap[tab]);
    if (!form) return;

    editingId = id;
    Object.keys(item).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input && item[key] != null) {
        input.value = item[key];
      }
    });

    if (tab === 'videos') {
      const normalizedCategory = normalizeVideoCategory(item.category, item.title, item.youtube_url);
      const categoryInput = form.querySelector('[name="category"]');
      const formatInput = form.querySelector('[name="video_format"]');
      const statusEl = document.getElementById('videoAutoStatus');
      if (categoryInput) categoryInput.value = normalizedCategory;
      if (formatInput) formatInput.value = inferVideoFormat(item.youtube_url) === 'shorts' ? 'Shorts' : '롱폼';
      if (statusEl) {
        statusEl.textContent = item.category !== normalizedCategory
          ? `기존 카테고리 "${item.category}"를 "${normalizedCategory}" 기준으로 표시 중입니다. 저장하면 새 구조로 정리됩니다.`
          : '현재 카테고리가 새 구조와 일치합니다.';
        statusEl.classList.remove('hidden', 'text-slate-400', 'text-nexo-cyan', 'text-amber-400', 'text-red-400');
        statusEl.classList.add(item.category !== normalizedCategory ? 'text-amber-400' : 'text-nexo-cyan');
      }
    }

    if (item.images && item.images.length > 0) {
      pendingImages = [...item.images];
      const previewId = tab === 'reviews' ? 'reviewImagePreview' : tab === 'cases' ? 'caseImagePreview' : null;
      if (previewId) renderImagePreview(previewId);
    }

    const submitBtn = form.querySelector('button[type="submit"], .admin-btn-primary');
    if (submitBtn && !submitBtn.dataset.originalText) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = '수정 저장';
      submitBtn.classList.add('bg-blue-600');
    }

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    alert('데이터 불러오기 실패: ' + e.message);
  }
}

async function updateItem(table, id, data) {
  if (!currentToken) throw new Error('로그인 세션 없음');
  if (table === 'nexo_videos') {
    await assertUniqueVideoEntry(data.youtube_url, id);
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`수정 실패 (${res.status}): ${err}`);
  }
  editingId = null;
}

function resetEditMode(form) {
  editingId = null;
  const submitBtn = form.querySelector('button[type="submit"], .admin-btn-primary');
  if (submitBtn && submitBtn.dataset.originalText) {
    submitBtn.textContent = submitBtn.dataset.originalText;
    submitBtn.classList.remove('bg-blue-600');
    delete submitBtn.dataset.originalText;
  }
}

async function deleteItem(table, id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  if (!currentToken) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${currentToken}`
      }
    });
    if (!res.ok) { const err = await res.text(); alert(`삭제 실패: ${err}`); return; }
  } catch (e) { alert(e.message); return; }
  loadTabData(currentTab);
}

// ============ FORM HANDLERS ============

function setupForms() {
  const loginForm = document.getElementById('adminLoginForm');
  console.log('[admin] loginForm found:', !!loginForm);
  const emailInput = document.getElementById('adminEmail');
  if (emailInput) emailInput.value = ADMIN_EMAIL;
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[admin] login form submitted');
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      const errEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');
      try {
        btn.textContent = '로그인 중...';
        btn.disabled = true;
        await adminLogin(email, password);
        closeModal('adminLoginModal');
        loginForm.reset();
        if (errEl) errEl.classList.add('hidden');
        openAdminPanel();
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
      } finally {
        btn.textContent = '로그인';
        btn.disabled = false;
      }
    });
  }

  setupFormHandler('reviewForm', 'nexo_reviews', (fd) => ({
    name: fd.get('name'),
    rating: parseInt(fd.get('rating')),
    text: fd.get('text'),
    images: [...pendingImages],
  }));

  setupFormHandler('videoForm', 'nexo_videos', (fd) => ({
    title: fd.get('title'),
    youtube_url: fd.get('youtube_url'),
    category: normalizeVideoCategory(fd.get('category'), fd.get('title'), fd.get('youtube_url')),
    sort_order: parseInt(fd.get('sort_order') || '0'),
    description: fd.get('description') || null,
  }));

  setupVideoFormAutomation();

  setupFormHandler('techDocForm', 'nexo_tech_docs', (fd) => ({
    title: fd.get('title'),
    download_url: fd.get('download_url'),
    category: fd.get('category'),
    version: fd.get('version') || null,
    description: fd.get('description') || null,
  }));

  setupFormHandler('manualForm', 'nexo_manuals', (fd) => ({
    title: fd.get('title'),
    pdf_url: fd.get('pdf_url'),
    category: fd.get('category'),
    description: fd.get('description') || null,
  }));

  const caseForm = document.getElementById('caseForm');
  if (caseForm) {
    caseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(caseForm);
      const action = e.submitter?.value || 'draft';
      try {
        const caseData = {
          title: fd.get('title') || '설치사례',
          content: fd.get('content') || '',
          description: fd.get('description') || null,
          raw_input: document.getElementById('caseRawInput')?.value || null,
          location: window._caseParsed?.location || null,
          category: fd.get('category') || '기타',
          installation_date: fd.get('installation_date') || null,
          equipment_model: fd.get('equipment_model') || null,
          installation_size: fd.get('installation_size') || null,
          images: [...pendingImages],
          is_published: action === 'publish',
          published_at: action === 'publish' ? new Date().toISOString() : null,
        };
        if (editingId) {
          await updateItem('nexo_cases', editingId, caseData);
          resetEditMode(caseForm);
        } else {
          await insertItem('nexo_cases', caseData);
        }
        caseForm.reset();
        pendingImages = [];
        clearImagePreview('caseImagePreview');
        loadTabData('cases');
      } catch (err) { alert(err.message); }
    });
  }

}

function setupVideoFormAutomation() {
  const form = document.getElementById('videoForm');
  if (!form) return;

  const urlInput = form.querySelector('[name="youtube_url"]');
  const titleInput = form.querySelector('[name="title"]');
  const categoryInput = form.querySelector('[name="category"]');
  const descriptionInput = form.querySelector('[name="description"]');
  const formatInput = form.querySelector('[name="video_format"]');
  const statusEl = document.getElementById('videoAutoStatus');

  if (!urlInput || !titleInput || !categoryInput || !descriptionInput || !formatInput || !statusEl) return;

  let lastAnalyzedUrl = '';

  const setStatus = (message, tone = 'muted') => {
    statusEl.textContent = message || '';
    statusEl.classList.toggle('hidden', !message);
    statusEl.classList.remove('text-slate-400', 'text-nexo-cyan', 'text-amber-400', 'text-red-400');
    statusEl.classList.add(
      tone === 'success' ? 'text-nexo-cyan' :
      tone === 'warn' ? 'text-amber-400' :
      tone === 'error' ? 'text-red-400' :
      'text-slate-400'
    );
  };

  const applyVideoHints = async () => {
    const youtubeUrl = normalizeYouTubeUrl(urlInput.value);
    if (!youtubeUrl || youtubeUrl === lastAnalyzedUrl) return;

    lastAnalyzedUrl = youtubeUrl;
    urlInput.value = youtubeUrl;

    const format = inferVideoFormat(youtubeUrl);
    formatInput.value = format === 'shorts' ? 'Shorts' : '롱폼';
    setStatus('영상 정보를 분석하는 중입니다...', 'muted');

    const meta = await fetchYouTubeOEmbed(youtubeUrl);
    const suggestedTitle = meta?.title || buildVideoTitleFallback(youtubeUrl);
    const suggestedCategory = suggestVideoCategory(suggestedTitle, youtubeUrl, format);

    if (!titleInput.value.trim() || titleInput.dataset.autofill === 'true') {
      titleInput.value = suggestedTitle;
      titleInput.dataset.autofill = 'true';
    }

    if (!descriptionInput.value.trim() || descriptionInput.dataset.autofill === 'true') {
      descriptionInput.value = buildVideoDescription(suggestedTitle, format, suggestedCategory);
      descriptionInput.dataset.autofill = 'true';
    }

    categoryInput.value = suggestedCategory;
    setStatus(
      meta?.title
        ? `${format === 'shorts' ? 'Shorts' : '롱폼'}로 인식했고 제목과 카테고리를 자동 추천했습니다.`
        : `${format === 'shorts' ? 'Shorts' : '롱폼'}로 인식했고 기본 제목과 카테고리를 추천했습니다.`,
      meta?.title ? 'success' : 'warn'
    );
  };

  urlInput.addEventListener('blur', () => { void applyVideoHints(); });
  urlInput.addEventListener('change', () => { lastAnalyzedUrl = ''; void applyVideoHints(); });

  titleInput.addEventListener('input', () => { titleInput.dataset.autofill = 'false'; });
  descriptionInput.addEventListener('input', () => { descriptionInput.dataset.autofill = 'false'; });

  form.addEventListener('reset', () => {
    lastAnalyzedUrl = '';
    formatInput.value = '';
    setStatus('');
    delete titleInput.dataset.autofill;
    delete descriptionInput.dataset.autofill;
  });

  const normalizeBtn = document.getElementById('normalizeVideoCategoriesBtn');
  if (normalizeBtn) {
    normalizeBtn.addEventListener('click', async () => {
      const originalText = normalizeBtn.textContent;
      normalizeBtn.disabled = true;
      normalizeBtn.textContent = '정리 중...';
      try {
        const changed = await normalizeExistingVideoCategories();
        setStatus(changed > 0 ? `${changed}개 영상 카테고리를 새 구조로 정리했습니다.` : '정리할 기존 카테고리 항목이 없습니다.', changed > 0 ? 'success' : 'muted');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '카테고리 정리 중 오류가 발생했습니다.', 'error');
      } finally {
        normalizeBtn.disabled = false;
        normalizeBtn.textContent = originalText;
      }
    });
  }
}

function setupFormHandler(formId, table, dataMapper) {
  const form = document.getElementById(formId);
  if (!form) { console.warn('[admin] form not found:', formId); return; }
  console.log('[admin] form handler attached:', formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[admin] form submitted:', formId, editingId ? '(수정)' : '(신규)');
    try {
      const fd = new FormData(form);
      const data = dataMapper(fd);
      if (editingId) {
        await updateItem(table, editingId, data);
      } else {
        await insertItem(table, data);
      }
      resetEditMode(form);
      form.reset();
      pendingImages = [];
      const previewId = formId.replace('Form', 'ImagePreview');
      clearImagePreview(previewId);
      loadTabData(currentTab);
    } catch (err) { alert(err.message); }
  });
}

// ============ IMAGE HANDLING ============

function setupImageHandlers() {
  setupImageDrop('reviewImageDrop', 'reviewImageInput', 'reviewImagePreview', 3);
  setupImageDrop('caseImageDrop', 'caseImageInput', 'caseImagePreview', 10);
}

function setupImageDrop(dropId, inputId, previewId, maxCount) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  if (!drop || !input) return;

  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => handleFileSelect(input.files, previewId, maxCount));
}

function setupGlobalPaste() {
  document.addEventListener('paste', (e) => {
    const panel = document.getElementById('adminPanelModal');
    if (!panel || !panel.classList.contains('flex')) return;

    let targetPreview = null;
    let maxCount = 3;

    if (currentTab === 'reviews') { targetPreview = 'reviewImagePreview'; maxCount = 3; }
    else if (currentTab === 'cases') { targetPreview = 'caseImagePreview'; maxCount = 10; }
    else return;

    handlePaste(e, targetPreview, maxCount);
  });
}

async function handlePaste(e, previewId, maxCount) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/') && pendingImages.length < maxCount) {
      e.preventDefault();
      const file = item.getAsFile();
      await uploadAndPreview(file, previewId);
    }
  }
}

async function handleFileSelect(files, previewId, maxCount) {
  for (const file of files) {
    if (pendingImages.length >= maxCount) break;
    await uploadAndPreview(file, previewId);
  }
}

async function uploadAndPreview(file, previewId) {
  if (file.size > 5 * 1024 * 1024) { alert('파일 크기 5MB 이하만 가능합니다.'); return; }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'nexo-media');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.secure_url) {
      pendingImages.push(data.secure_url);
      renderImagePreview(previewId);
    }
  } catch (err) {
    console.error('Image upload failed:', err);
    alert('이미지 업로드 실패');
  }
}

function renderImagePreview(previewId) {
  const el = document.getElementById(previewId);
  if (!el) return;
  el.innerHTML = pendingImages.map((url, i) => `
    <div class="relative group">
      <img src="${url}" class="w-full h-24 object-cover rounded-lg border border-slate-600">
      <button type="button" onclick="removeImage(${i},'${previewId}')"
              class="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
    </div>
  `).join('');
}

function removeImage(index, previewId) {
  pendingImages.splice(index, 1);
  renderImagePreview(previewId);
}

function clearImagePreview(previewId) {
  const el = document.getElementById(previewId);
  if (el) el.innerHTML = '';
}

// ============ AI GENERATION ============

async function parseCaseInput() {
  const raw = document.getElementById('caseRawInput')?.value;
  if (!raw) return;

  const parsed = window.parseFieldNewsText ? window.parseFieldNewsText(raw) : {};
  window._caseParsed = parsed;

  const titleInput = document.querySelector('#caseForm input[name="title"]');
  const modelInput = document.querySelector('#caseForm input[name="equipment_model"]');
  const sizeInput = document.querySelector('#caseForm input[name="installation_size"]');
  const descriptionInput = document.querySelector('#caseForm textarea[name="description"]');
  if (titleInput && !titleInput.value) {
    titleInput.value = window.generateTitle ? window.generateTitle(parsed) : (parsed.storeName || '');
  }
  if (modelInput && !modelInput.value && parsed.model) {
    modelInput.value = parsed.model;
  }
  if (sizeInput && !sizeInput.value) {
    const sizeParts = [parsed.wallMount ? `벽걸이 ${parsed.wallMount}` : '', parsed.stand ? `스탠드 ${parsed.stand}` : ''].filter(Boolean);
    if (sizeParts.length) sizeInput.value = sizeParts.join(' / ');
  }
  if (descriptionInput && !descriptionInput.value && parsed.notes) {
    descriptionInput.value = parsed.notes;
  }

  const preview = document.getElementById('caseParsedPreview');
  if (preview) {
    const fields = Object.entries(parsed).filter(([,v]) => v).map(([k,v]) => `<b>${k}</b>: ${escapeHtml(v)}`);
    preview.innerHTML = fields.join('<br>') || '파싱 결과 없음';
    preview.classList.remove('hidden');
  }
}

async function generateCaseContent() {
  const btn = document.getElementById('caseAiBtn');
  const textarea = document.querySelector('#caseForm textarea[name="content"]');
  if (!btn || !textarea) return;

  const parsed = window._caseParsed || {};
  btn.textContent = 'AI 생성 중...';
  btn.disabled = true;

  try {
    const res = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'case',
        data: { ...parsed, imageCount: pendingImages.length },
      }),
    });
    const json = await res.json();
    if (json.success && json.content) {
      let payload = null;
      try {
        payload = JSON.parse(json.content);
      } catch {
        payload = null;
      }

      let content = cleanAiContent(payload?.content || json.content);
      const usedImages = new Set();
      pendingImages.forEach((url, i) => {
        const placeholder = `[이미지${i + 1}]`;
        if (content.includes(placeholder)) {
          content = content.replace(new RegExp(`\\[이미지${i + 1}\\]`, 'g'), `<img src="${url}" alt="설치사진 ${i + 1}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
          usedImages.add(i);
        }
      });
      const remainingImages = pendingImages.filter((_, i) => !usedImages.has(i));
      remainingImages.forEach((url) => {
        content += `\n<img src="${url}" alt="설치사진" style="max-width:100%;border-radius:8px;margin:12px 0;">`;
        content += `\n<p></p>`;
      });
      textarea.value = content;

      const descriptionInput = document.querySelector('#caseForm textarea[name="description"]');
      const categoryInput = document.querySelector('#caseForm select[name="category"]');
      const modelInput = document.querySelector('#caseForm input[name="equipment_model"]');
      const sizeInput = document.querySelector('#caseForm input[name="installation_size"]');

      if (payload?.description && descriptionInput && !descriptionInput.value.trim()) {
        descriptionInput.value = payload.description.trim();
      }
      if (payload?.category && categoryInput) {
        const options = [...categoryInput.options].map(option => option.value);
        if (options.includes(payload.category.trim())) {
          categoryInput.value = payload.category.trim();
        }
      }
      if (payload?.equipment_model && modelInput && !modelInput.value.trim()) {
        modelInput.value = payload.equipment_model.trim();
      }
      if (payload?.installation_size && sizeInput && !sizeInput.value.trim()) {
        sizeInput.value = payload.installation_size.trim();
      }
    } else {
      alert(json.error || 'AI 생성 실패');
    }
  } catch (err) {
    alert('AI 서버 연결 실패: ' + err.message);
  } finally {
    btn.textContent = 'AI 자동 생성';
    btn.disabled = false;
  }
}

// ============ UTILS ============

function toggleCasePreview() {
  const editor = document.getElementById('caseContentEditor');
  const preview = document.getElementById('caseContentPreview');
  const btn = document.getElementById('casePreviewBtn');
  if (!editor || !preview) return;

  if (preview.classList.contains('hidden')) {
    preview.innerHTML = editor.value || '<p style="color:#999;">내용이 없습니다.</p>';
    preview.classList.remove('hidden');
    editor.classList.add('hidden');
    btn.textContent = '편집 모드';
    btn.classList.replace('bg-slate-600', 'bg-green-600');
  } else {
    preview.classList.add('hidden');
    editor.classList.remove('hidden');
    btn.textContent = '미리보기';
    btn.classList.replace('bg-green-600', 'bg-slate-600');
  }
}

function cleanAiContent(text) {
  if (!text) return '';
  let c = text.trim();
  c = c.replace(/^```(?:html|HTML)?\s*\n?/gm, '');
  c = c.replace(/\n?```\s*$/gm, '');
  c = c.replace(/<img\s+src="<img\s+src="([^"]+)"[^>]*>"[^>]*>/g, '<img src="$1" style="max-width:100%;border-radius:8px;margin:12px 0;">');
  c = c.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/gi, '');
  c = c.replace(/<\/body>[\s\S]*?<\/html>/gi, '');
  c = c.replace(/<head>[\s\S]*?<\/head>/gi, '');
  c = c.replace(/<style>[\s\S]*?<\/style>/gi, '');
  return c.trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalizeYouTubeUrl(rawUrl) {
  const value = (rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.replace(/^\/+/, '');
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : value;
    }
    return url.toString();
  } catch {
    return value;
  }
}

function inferVideoFormat(url) {
  return /youtube\.com\/shorts\//i.test(url || '') ? 'shorts' : 'longform';
}

function extractYouTubeVideoId(url) {
  const normalized = normalizeYouTubeUrl(url);
  const match = normalized.match(/(?:watch\?v=|shorts\/|embed\/|youtu\.be\/)([^?&/]+)/i);
  return match ? match[1] : '';
}

function normalizeVideoCategory(category, title, url, format = inferVideoFormat(url)) {
  const trimmed = (category || '').trim();
  if (VIDEO_CATEGORIES.includes(trimmed)) return trimmed;

  const mapped = LEGACY_VIDEO_CATEGORY_MAP[trimmed];
  if (mapped) return mapped;

  return suggestVideoCategory(title, url, format);
}

async function fetchYouTubeOEmbed(url) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.title === 'string' ? data : null;
  } catch {
    return null;
  }
}

function buildVideoTitleFallback(url) {
  const videoIdMatch = (url || '').match(/(?:watch\?v=|shorts\/)([^?&]+)/i);
  return videoIdMatch ? `유튜브 영상 ${videoIdMatch[1]}` : '유튜브 영상';
}

function suggestVideoCategory(title, url, format) {
  const text = `${title || ''} ${url || ''}`.toLowerCase();

  if (/(지원|구매|도입|비교|가격|정부|사업)/.test(text)) return '도입·구매';
  if (/(미러링|공유|qr|녹화|무선|폰 쉐어|e share|eshare)/.test(text)) return '무선 연결·공유';
  if (/(수업|판서|pdf|3d|화면 분할|발표)/.test(text)) return '수업 활용';
  if (/(강화유리|지문|보관|관리|청소|깨질까)/.test(text)) return '관리 팁';
  if (/(처음|설정|홈 화면|런처|앱 편집|기본|시작)/.test(text)) return '빠른 시작';
  if (format === 'shorts') return '빠른 시작';
  return VIDEO_CATEGORIES[0];
}

function buildVideoDescription(title, format, category) {
  const safeTitle = title || '유튜브 영상';
  if (format === 'shorts') {
    return `${safeTitle} 영상을 빠르게 확인할 수 있도록 ${category} 섹션용 짧은 팁 영상으로 정리했습니다.`;
  }
  return `${safeTitle} 영상을 ${category} 흐름에 맞춰 홈페이지 가이드 섹션에서 바로 볼 수 있도록 정리했습니다.`;
}

async function assertUniqueVideoEntry(youtubeUrl, excludeId = null) {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/nexo_videos?select=id,title,youtube_url`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${currentToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`중복 확인 실패: ${err}`);
  }

  const rows = await res.json();
  const duplicate = (Array.isArray(rows) ? rows : []).find((row) => {
    if (excludeId && row.id === excludeId) return false;
    return extractYouTubeVideoId(row.youtube_url) === videoId;
  });

  if (duplicate) {
    throw new Error(`이미 등록된 영상입니다: "${duplicate.title || '제목 없음'}"`);
  }
}

async function normalizeExistingVideoCategories() {
  if (!currentToken) throw new Error('로그인 세션이 없습니다.');
  if (!confirm('기존 영상 카테고리를 새 구조로 정리할까요?')) return 0;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/nexo_videos?select=id,title,youtube_url,category`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${currentToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`기존 영상 조회 실패: ${err}`);
  }

  const rows = await res.json();
  const candidates = (Array.isArray(rows) ? rows : []).filter((row) => {
    const normalized = normalizeVideoCategory(row.category, row.title, row.youtube_url);
    return normalized && normalized !== row.category;
  });

  for (const row of candidates) {
    await updateItem('nexo_videos', row.id, {
      category: normalizeVideoCategory(row.category, row.title, row.youtube_url),
    });
  }

  editingId = null;
  loadTabData('videos');
  return candidates.length;
}

// ============ PUBLIC DATA LOADERS ============

async function loadPublicReviews() {
  if (!sb) return;
  const container = document.getElementById('reviewsContainer');
  const empty = document.getElementById('emptyReviews');
  if (!container) return;

  const { data, error } = await sb.from('nexo_reviews').select('*').eq('is_published', true).order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    if (empty) empty.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (empty) empty.classList.add('hidden');
  container.innerHTML = data.map(r => `
    <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 bg-nexo-cyan/20 rounded-full flex items-center justify-center text-nexo-cyan font-bold">
          ${escapeHtml((r.name || '?')[0])}
        </div>
        <div>
          <p class="font-bold text-white text-sm">${escapeHtml(r.name)}</p>
          <p class="text-nexo-cyan text-xs">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</p>
        </div>
      </div>
      <p class="text-slate-300 text-sm leading-relaxed">${escapeHtml(r.text)}</p>
      ${r.images && r.images.length > 0 ? `
        <div class="grid grid-cols-3 gap-2 mt-3">
          ${r.images.map(img => `<img src="${img}" class="w-full h-20 object-cover rounded-lg border border-slate-600" alt="후기 사진">`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ============ ADMIN MODAL LOADER ============

async function loadAdminModal() {
  try {
    const res = await fetch('components/admin-modal.html');
    if (!res.ok) return;
    const html = await res.text();
    const placeholder = document.getElementById('admin-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      await initAdmin();
    }
  } catch (err) {
    console.error('Admin modal load failed:', err);
  }
}
