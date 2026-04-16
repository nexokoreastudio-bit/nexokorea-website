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

async function adminGoogleLogin() {
  if (!sb) { alert('시스템 초기화 중입니다. 잠시 후 다시 시도하세요.'); return; }
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) alert(error.message);
}

async function adminLogin(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  await checkAdminRole();
}

async function checkAdminRole() {
  if (!currentUser) return;
  const { data } = await sb.from('users').select('role').eq('id', currentUser.id).single();
  if (!data || data.role !== 'admin') {
    await sb.auth.signOut();
    currentUser = null;
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
    blog: { table: 'nexo_blog_posts', listEl: 'blogList', order: 'created_at' },
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
    subtitle = item.category || '';
  } else if (tab === 'cases') {
    subtitle = item.location || '';
  } else if (tab === 'blog') {
    subtitle = item.category || '';
  }

  const table = {
    reviews: 'nexo_reviews', videos: 'nexo_videos', 'tech-docs': 'nexo_tech_docs',
    manuals: 'nexo_manuals', cases: 'nexo_cases', blog: 'nexo_blog_posts'
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
  if (publish && (table === 'nexo_cases' || table === 'nexo_blog_posts')) {
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
    manuals: 'nexo_manuals', cases: 'nexo_cases', blog: 'nexo_blog_posts'
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
      manuals: 'manualForm', cases: 'caseForm', blog: 'blogForm'
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
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
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
    category: fd.get('category'),
    sort_order: parseInt(fd.get('sort_order') || '0'),
    description: fd.get('description') || null,
  }));

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
          raw_input: document.getElementById('caseRawInput')?.value || null,
          location: window._caseParsed?.location || null,
          category: fd.get('category') || '기타',
          installation_date: fd.get('installation_date') || null,
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

  const blogForm = document.getElementById('blogForm');
  if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(blogForm);
      const action = e.submitter?.value || 'draft';
      try {
        await insertItem('nexo_blog_posts', {
          title: fd.get('title'),
          slug: fd.get('slug'),
          content: fd.get('content'),
          summary: fd.get('summary') || null,
          category: fd.get('category'),
          is_published: action === 'publish',
          published_at: action === 'publish' ? new Date().toISOString() : null,
        });
        blogForm.reset();
        loadTabData('blog');
      } catch (err) { alert(err.message); }
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
  if (titleInput && !titleInput.value) {
    titleInput.value = window.generateTitle ? window.generateTitle(parsed) : (parsed.storeName || '');
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
      let content = cleanAiContent(json.content);
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

async function generateBlogContent() {
  const btn = document.getElementById('blogAiBtn');
  const textarea = document.querySelector('#blogForm textarea[name="content"]');
  const topicInput = document.getElementById('blogAiTopic');
  if (!btn || !textarea || !topicInput) return;

  const topic = topicInput.value;
  if (!topic) { alert('주제 키워드를 입력하세요.'); return; }

  btn.textContent = 'AI 생성 중...';
  btn.disabled = true;

  try {
    const res = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'blog',
        data: { topic, keywords: topic.split(' ') },
      }),
    });
    const json = await res.json();
    if (json.success && json.content) {
      textarea.value = cleanAiContent(json.content);
    } else {
      alert(json.error || 'AI 생성 실패');
    }
  } catch (err) {
    alert('AI 서버 연결 실패: ' + err.message);
  } finally {
    btn.textContent = 'AI 생성';
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

function toggleBlogPreview() {
  const editor = document.getElementById('blogContentEditor');
  const preview = document.getElementById('blogContentPreview');
  if (!editor || !preview) return;

  if (preview.classList.contains('hidden')) {
    preview.innerHTML = editor.value || '<p style="color:#999;">내용이 없습니다.</p>';
    preview.classList.remove('hidden');
    editor.classList.add('hidden');
  } else {
    preview.classList.add('hidden');
    editor.classList.remove('hidden');
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
