/* ========== Storage ========== */
const Store = {
  get(key, def) {
    try { const v = localStorage.getItem('dd_' + key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem('dd_' + key, JSON.stringify(val)); }
};

/* ========== Utils ========== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const showToast = (msg) => {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
};

/* ========== Default Data ========== */
const DEFAULT_TASKS = [
  { id: 't1', name: '软件测试学习', duration: '7h', done: false },
  { id: 't2', name: '投递简历', duration: '2h', done: false },
  { id: 't3', name: '英语学习', duration: '30分钟', done: false }
];

const STAGES = [
  { id: 's1', name: '测试基础' },
  { id: 's2', name: 'Linux & MySQL数据库' },
  { id: 's3', name: '功能测试' },
  { id: 's4', name: 'Python基础 + Pytest框架' },
  { id: 's5', name: '接口自动化测试' },
  { id: 's6', name: '性能自动化测试（JMeter）' },
  { id: 's7', name: 'UI自动化测试（Selenium/Playwright）' },
  { id: 's8', name: 'ERP金融项目实战' },
  { id: 's9', name: '简历优化 & 面试冲刺' }
];

const TAG_NAMES = { knowledge: '知识点', interview: '面试真题', resume: '简历范文' };

/* ========== State ========== */
let state = {
  currentNav: 'home',
  currentStage: null,
  currentCat: null,
  quizMode: false,
  quizIndex: 0,
  quizList: []
};

/* ========== Init ========== */
function init() {
  // 初始化每日任务（当天）
  const taskKey = 'tasks_' + today();
  if (!Store.get(taskKey, null)) Store.set(taskKey, JSON.parse(JSON.stringify(DEFAULT_TASKS)));
  render();
}

/* ========== Render ========== */
function render() {
  const app = $('#app');
  app.innerHTML = renderHeader() + `<div class="main" id="main"></div>` + renderFooter();
  renderPage();
}

function renderHeader() {
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  return `
    <div class="header">
      <h1>🐻 墩墩的工作台</h1>
      <div class="sub">
        <span class="date">${now.getMonth() + 1}月${now.getDate()}日 周${week}</span>
        <span>坚持学习，未来可期</span>
      </div>
    </div>`;
}

function renderFooter() {
  const navs = [
    { key: 'home', icon: '🏠', name: '首页' },
    { key: 'study', icon: '📚', name: '学习' },
    { key: 'interview', icon: '💬', name: '题库' },
    { key: 'review', icon: '📝', name: '复盘' },
    { key: 'more', icon: '✨', name: '更多' }
  ];
  return `<div class="footer-nav">${navs.map(n => `
    <div class="nav-item ${state.currentNav === n.key ? 'active' : ''}" onclick="nav('${n.key}')">
      <span class="icon">${n.icon}</span><span>${n.name}</span>
    </div>`).join('')}</div>`;
}

function nav(key) {
  state.currentNav = key;
  state.currentStage = null;
  state.currentCat = null;
  state.quizMode = false;
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');
  renderPage();
}

function renderPage() {
  const main = $('#main');
  const pages = {
    home: renderHome,
    study: renderStudy,
    interview: renderInterview,
    review: renderReview,
    more: renderMore,
    knowledge: renderKnowledge,
    english: renderEnglish,
    memo: renderMemo
  };
  const fn = pages[state.currentNav] || renderHome;
  main.innerHTML = fn();
  main.scrollTop = 0;
  // 同步底部导航高亮
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { knowledge: 'more', english: 'more', memo: 'more' };
  const activeKey = navMap[state.currentNav] || state.currentNav;
  const idx = ['home', 'study', 'interview', 'review', 'more'].indexOf(activeKey);
  if (idx >= 0) $$('.nav-item')[idx]?.classList.add('active');
}

/* ========== 模块1: 每日计划 ========== */
function renderHome() {
  const tasks = Store.get('tasks_' + today(), []);
  const doneCount = tasks.filter(t => t.done).length;
  const rate = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;

  // 统计
  const allDates = Object.keys(localStorage).filter(k => k.startsWith('dd_tasks_')).map(k => k.slice(8)).sort().reverse();
  const totalDays = allDates.length;
  let totalDone = 0, totalTasks = 0;
  allDates.forEach(d => {
    const ts = Store.get('tasks_' + d, []);
    totalTasks += ts.length;
    totalDone += ts.filter(t => t.done).length;
  });

  return `
    <h2 class="page-title">每日计划</h2>
    <p class="page-desc">完成今日打卡，坚持就是胜利 💪</p>

    <div class="stats-grid">
      <div class="stat-box"><div class="stat-num">${rate}%</div><div class="stat-label">今日完成率</div></div>
      <div class="stat-box"><div class="stat-num">${doneCount}/${tasks.length}</div><div class="stat-label">今日任务</div></div>
      <div class="stat-box"><div class="stat-num">${totalDays}</div><div class="stat-label">累计打卡天数</div></div>
      <div class="stat-box"><div class="stat-num">${totalTasks ? Math.round(totalDone / totalTasks * 100) : 0}%</div><div class="stat-label">总完成率</div></div>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" style="width:${rate}%"></div></div>
      <div class="progress-text"><span>今日进度</span><span>${rate}%</span></div>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="left"><span class="emoji">✅</span>今日任务</span>
        <button class="btn btn-sm btn-outline" onclick="openTaskModal()">+ 新增</button>
      </div>
      <div id="taskList">${tasks.map((t, i) => taskItemHTML(t, i)).join('')}</div>
      ${tasks.length === 0 ? '<div class="empty"><div class="emoji">📋</div><p>暂无任务，点击右上角添加</p></div>' : ''}
    </div>

    <div class="card">
      <div class="card-title"><span class="left"><span class="emoji">📅</span>历史记录</span></div>
      ${allDates.slice(0, 10).map(d => {
        const ts = Store.get('tasks_' + d, []);
        const dn = ts.filter(t => t.done).length;
        return `<div class="history-item">
          <div class="history-date">${fmtDate(d)} ${d === today() ? '（今天）' : ''}</div>
          <div class="history-detail">完成 ${dn}/${ts.length} 项 · ${ts.filter(t => t.done).map(t => t.name).join('、') || '无'}</div>
        </div>`;
      }).join('') || '<div class="empty"><p>暂无历史记录</p></div>'}
    </div>
  `;
}

function taskItemHTML(t, i) {
  return `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="task-checkbox" onclick="toggleTask('${t.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="task-content">
        <div class="task-name">${escapeHtml(t.name)}</div>
        <div class="task-meta">⏱ ${escapeHtml(t.duration)}</div>
      </div>
      <div class="task-actions">
        <button onclick="openTaskModal('${t.id}')">✏️</button>
        <button onclick="deleteTask('${t.id}')">🗑️</button>
      </div>
    </div>`;
}

function toggleTask(id) {
  const tasks = Store.get('tasks_' + today(), []);
  const t = tasks.find(x => x.id === id);
  if (t) {
    t.done = !t.done;
    Store.set('tasks_' + today(), tasks);
    renderPage();
    if (t.done) showToast('🎉 完成一项！加油');
  }
}

function deleteTask(id) {
  if (!confirm('确定删除这个任务吗？')) return;
  let tasks = Store.get('tasks_' + today(), []);
  tasks = tasks.filter(t => t.id !== id);
  Store.set('tasks_' + today(), tasks);
  renderPage();
  showToast('已删除');
}

function openTaskModal(id) {
  const tasks = Store.get('tasks_' + today(), []);
  const t = id ? tasks.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${t ? '编辑任务' : '新增任务'}</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">任务名称</label>
      <input class="form-input" id="taskName" value="${t ? escapeHtml(t.name) : ''}" placeholder="如：刷面试题">
    </div>
    <div class="form-group">
      <label class="form-label">预计时长</label>
      <input class="form-input" id="taskDur" value="${t ? escapeHtml(t.duration) : ''}" placeholder="如：1h / 30分钟">
    </div>
    <button class="btn btn-block" onclick="saveTask('${id || ''}')">保存</button>
  `);
  setTimeout(() => $('#taskName').focus(), 100);
}

function saveTask(id) {
  const name = $('#taskName').value.trim();
  const dur = $('#taskDur').value.trim() || '未设置';
  if (!name) { showToast('请输入任务名称'); return; }
  const tasks = Store.get('tasks_' + today(), []);
  if (id) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.name = name; t.duration = dur; }
  } else {
    tasks.push({ id: uid(), name, duration: dur, done: false });
  }
  Store.set('tasks_' + today(), tasks);
  closeModal();
  renderPage();
  showToast('已保存');
}

/* ========== 模块2: 软件测试学习 ========== */
function renderStudy() {
  if (state.currentStage) return renderStageDetail(state.currentStage);
  const notes = Store.get('study_notes', []);
  return `
    <h2 class="page-title">软件测试学习</h2>
    <p class="page-desc">9大阶段系统学习，记录每个知识点 📚</p>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-num">${notes.length}</div><div class="stat-label">总笔记数</div></div>
      <div class="stat-box"><div class="stat-num">${STAGES.filter(s => notes.some(n => n.stageId === s.id)).length}/9</div><div class="stat-label">已学阶段</div></div>
    </div>
    ${STAGES.map((s, i) => {
      const count = notes.filter(n => n.stageId === s.id).length;
      return `
        <div class="stage-item" id="stage-${s.id}">
          <div class="stage-header" onclick="toggleStage('${s.id}')">
            <div class="stage-num">${i + 1}</div>
            <div class="stage-name">${s.name}</div>
            <span class="stage-count">${count} 篇</span>
            <span class="stage-arrow">▶</span>
          </div>
          <div class="stage-body">
            <button class="btn btn-sm btn-outline" onclick="openNoteModal('${s.id}')">+ 新建笔记</button>
            <button class="btn btn-sm btn-outline" onclick="openLinkModal('${s.id}')">📎 添加视频链接</button>
            ${notes.filter(n => n.stageId === s.id).map(n => noteItemHTML(n)).join('')}
          </div>
        </div>`;
    }).join('')}
  `;
}

function toggleStage(id) {
  $('#stage-' + id).classList.toggle('open');
}

function noteItemHTML(n) {
  const tagClass = n.tag ? `tag-${n.tag}` : 'tag-default';
  const tagName = TAG_NAMES[n.tag] || '其他';
  return `
    <div class="note-item">
      <div class="note-title">
        <span>${escapeHtml(n.title)}</span>
        <span class="tag ${tagClass}">${tagName}</span>
      </div>
      <div class="note-content">${escapeHtml(n.content)}</div>
      ${n.link ? `<div class="link-badge">📎 视频链接已归档</div>` : ''}
      <div class="note-meta">
        <span>${n.date ? fmtDate(n.date) : ''}</span>
        <span>
          <button class="btn-ghost" onclick="openNoteModal(null,'${n.id}')">编辑</button>
          <button class="btn-ghost" onclick="deleteNote('${n.id}')">删除</button>
        </span>
      </div>
    </div>`;
}

function openNoteModal(stageId, noteId) {
  const notes = Store.get('study_notes', []);
  const n = noteId ? notes.find(x => x.id === noteId) : null;
  const sid = n ? n.stageId : stageId;
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${n ? '编辑笔记' : '新建笔记'}</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">所属阶段</label>
      <select class="form-select" id="noteStage">
        ${STAGES.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">标题</label>
      <input class="form-input" id="noteTitle" value="${n ? escapeHtml(n.title) : ''}" placeholder="知识点标题">
    </div>
    <div class="form-group">
      <label class="form-label">分类标签</label>
      <select class="form-select" id="noteTag">
        <option value="knowledge" ${n && n.tag === 'knowledge' ? 'selected' : ''}>知识点</option>
        <option value="interview" ${n && n.tag === 'interview' ? 'selected' : ''}>面试真题</option>
        <option value="resume" ${n && n.tag === 'resume' ? 'selected' : ''}>简历范文</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">内容</label>
      <textarea class="form-textarea" id="noteContent" placeholder="记录知识点内容...">${n ? escapeHtml(n.content) : ''}</textarea>
    </div>
    <button class="btn btn-block" onclick="saveNote('${noteId || ''}')">保存</button>
  `);
}

function saveNote(noteId) {
  const stageId = $('#noteStage').value;
  const title = $('#noteTitle').value.trim();
  const tag = $('#noteTag').value;
  const content = $('#noteContent').value.trim();
  if (!title) { showToast('请输入标题'); return; }
  const notes = Store.get('study_notes', []);
  if (noteId) {
    const n = notes.find(x => x.id === noteId);
    if (n) { n.stageId = stageId; n.title = title; n.tag = tag; n.content = content; }
  } else {
    notes.push({ id: uid(), stageId, title, tag, content, date: today() });
  }
  Store.set('study_notes', notes);
  closeModal();
  renderPage();
  showToast('已保存');
}

function deleteNote(id) {
  if (!confirm('确定删除这条笔记吗？')) return;
  let notes = Store.get('study_notes', []);
  notes = notes.filter(n => n.id !== id);
  Store.set('study_notes', notes);
  renderPage();
  showToast('已删除');
}

function openLinkModal(stageId) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">📎 添加视频链接</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">视频链接</label>
      <input class="form-input" id="linkUrl" placeholder="粘贴抖音/B站视频链接">
    </div>
    <div class="form-group">
      <label class="form-label">知识点标题</label>
      <input class="form-input" id="linkTitle" placeholder="如：接口测试入门">
    </div>
    <div class="form-group">
      <label class="form-label">提取的知识点（可选）</label>
      <textarea class="form-textarea" id="linkContent" placeholder="手动记录视频中的知识点，或粘贴文案"></textarea>
    </div>
    <button class="btn btn-block" onclick="saveLink('${stageId}')">归档到本阶段</button>
  `);
}

function saveLink(stageId) {
  const url = $('#linkUrl').value.trim();
  const title = $('#linkTitle').value.trim();
  const content = $('#linkContent').value.trim();
  if (!url || !title) { showToast('请填写链接和标题'); return; }
  const notes = Store.get('study_notes', []);
  notes.push({
    id: uid(), stageId, title, tag: 'knowledge',
    content: content || '（视频知识点待补充）',
    link: url, date: today()
  });
  Store.set('study_notes', notes);
  closeModal();
  renderPage();
  showToast('📎 已归档');
}

function renderStageDetail(stageId) {
  const stage = STAGES.find(s => s.id === stageId);
  const notes = Store.get('study_notes', []).filter(n => n.stageId === stageId);
  return `
    <div style="margin-bottom:16px;">
      <button class="btn-ghost" onclick="state.currentStage=null;renderPage();">← 返回</button>
    </div>
    <h2 class="page-title">${stage.name}</h2>
    <p class="page-desc">本阶段共 ${notes.length} 篇笔记</p>
    <button class="btn btn-block" onclick="openNoteModal('${stageId}')">+ 新建笔记</button>
    <div style="margin-top:14px;">
      ${notes.map(n => noteItemHTML(n)).join('') || '<div class="empty"><div class="emoji">📖</div><p>暂无笔记</p></div>'}
    </div>
  `;
}

/* ========== 模块3: 面试题库 ========== */
function renderInterview() {
  if (state.quizMode) return renderQuiz();
  const questions = Store.get('questions', []);
  const cats = ['测试基础', 'Linux&MySQL', '功能测试', 'Python&Pytest', '接口自动化', '性能测试', 'UI自动化', '项目实战', '综合素质'];
  const favCount = questions.filter(q => q.fav).length;

  return `
    <h2 class="page-title">面试核心题库</h2>
    <p class="page-desc">收录面试题，随机抽题模拟面试 💬</p>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-num">${questions.length}</div><div class="stat-label">题目总数</div></div>
      <div class="stat-box"><div class="stat-num">${favCount}</div><div class="stat-label">收藏题目</div></div>
    </div>
    <button class="btn btn-block btn-success" onclick="startQuiz(false)" style="margin-bottom:10px;">🎲 随机抽题自测</button>
    ${favCount > 0 ? `<button class="btn btn-block btn-outline" onclick="startQuiz(true)" style="margin-bottom:14px;">⭐ 仅练收藏题（${favCount}题）</button>` : ''}
    <div class="card">
      <div class="card-title">
        <span class="left"><span class="emoji">📝</span>题目列表</span>
        <button class="btn btn-sm btn-outline" onclick="openQuestionModal()">+ 添加</button>
      </div>
      <div class="search-box">
        <span class="icon">🔍</span>
        <input type="text" id="qSearch" placeholder="搜索题目..." oninput="filterQuestions()">
      </div>
      <div id="qList">${questions.map((q, i) => questionHTML(q, i)).join('')}</div>
      ${questions.length === 0 ? '<div class="empty"><div class="emoji">💬</div><p>暂无题目，点击右上角添加</p></div>' : ''}
    </div>
  `;
}

function questionHTML(q, i) {
  return `
    <div class="q-card" data-search="${escapeHtml(q.question + q.answer + q.cat)}">
      <div class="q-question">
        <span class="tag tag-${q.cat ? 'interview' : 'default'}">${escapeHtml(q.cat || '未分类')}</span>
        <span>${i + 1}. ${escapeHtml(q.question)}</span>
      </div>
      <div class="q-answer">${escapeHtml(q.answer)}</div>
      <div class="q-actions">
        <button class="btn btn-sm ${q.fav ? 'btn-success' : 'btn-outline'}" onclick="toggleFav('${q.id}')">${q.fav ? '⭐ 已收藏' : '☆ 收藏'}</button>
        <button class="btn btn-sm btn-outline" onclick="openQuestionModal('${q.id}')">编辑</button>
        <button class="btn btn-sm btn-ghost" onclick="deleteQuestion('${q.id}')">删除</button>
      </div>
    </div>`;
}

function filterQuestions() {
  const kw = $('#qSearch').value.toLowerCase();
  $$('#qList .q-card').forEach(c => {
    c.style.display = c.dataset.search.toLowerCase().includes(kw) ? '' : 'none';
  });
}

function openQuestionModal(id) {
  const questions = Store.get('questions', []);
  const q = id ? questions.find(x => x.id === id) : null;
  const cats = ['测试基础', 'Linux&MySQL', '功能测试', 'Python&Pytest', '接口自动化', '性能测试', 'UI自动化', '项目实战', '综合素质'];
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${q ? '编辑题目' : '添加题目'}</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">分类</label>
      <select class="form-select" id="qCat">
        ${cats.map(c => `<option value="${c}" ${q && q.cat === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">问题</label>
      <input class="form-input" id="qQuestion" value="${q ? escapeHtml(q.question) : ''}" placeholder="面试问题">
    </div>
    <div class="form-group">
      <label class="form-label">标准答案</label>
      <textarea class="form-textarea" id="qAnswer" placeholder="参考答案..." style="min-height:120px;">${q ? escapeHtml(q.answer) : ''}</textarea>
    </div>
    <button class="btn btn-block" onclick="saveQuestion('${id || ''}')">保存</button>
  `);
}

function saveQuestion(id) {
  const cat = $('#qCat').value;
  const question = $('#qQuestion').value.trim();
  const answer = $('#qAnswer').value.trim();
  if (!question || !answer) { showToast('请填写问题和答案'); return; }
  const questions = Store.get('questions', []);
  if (id) {
    const q = questions.find(x => x.id === id);
    if (q) { q.cat = cat; q.question = question; q.answer = answer; }
  } else {
    questions.push({ id: uid(), cat, question, answer, fav: false });
  }
  Store.set('questions', questions);
  closeModal();
  renderPage();
  showToast('已保存');
}

function toggleFav(id) {
  const questions = Store.get('questions', []);
  const q = questions.find(x => x.id === id);
  if (q) { q.fav = !q.fav; Store.set('questions', questions); renderPage(); }
}

function deleteQuestion(id) {
  if (!confirm('确定删除这道题吗？')) return;
  let questions = Store.get('questions', []);
  questions = questions.filter(q => q.id !== id);
  Store.set('questions', questions);
  renderPage();
  showToast('已删除');
}

function startQuiz(favOnly) {
  let questions = Store.get('questions', []);
  if (favOnly) questions = questions.filter(q => q.fav);
  if (questions.length === 0) { showToast('暂无题目'); return; }
  // 随机打乱
  state.quizList = questions.sort(() => Math.random() - 0.5);
  state.quizIndex = 0;
  state.quizMode = true;
  renderPage();
}

function renderQuiz() {
  const q = state.quizList[state.quizIndex];
  if (!q) {
    state.quizMode = false;
    renderPage();
    return;
  }
  return `
    <div style="margin-bottom:16px;">
      <button class="btn-ghost" onclick="state.quizMode=false;renderPage();">← 退出</button>
    </div>
    <h2 class="page-title">模拟面试</h2>
    <p class="page-desc">第 ${state.quizIndex + 1} / ${state.quizList.length} 题</p>
    <div class="progress-bar" style="margin-bottom:16px;"><div class="progress-fill" style="width:${(state.quizIndex + 1) / state.quizList.length * 100}%"></div></div>
    <div class="q-card">
      <div class="q-question">
        <span class="tag tag-interview">${escapeHtml(q.cat)}</span>
      </div>
      <div class="q-question" style="font-size:17px;margin-top:8px;">${escapeHtml(q.question)}</div>
      <div id="quizAnswer" style="display:none;">
        <div class="q-answer" style="margin-top:12px;">${escapeHtml(q.answer)}</div>
      </div>
      <div class="q-actions" style="margin-top:16px;">
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('quizAnswer').style.display='block';this.style.display='none'">👁️ 查看答案</button>
        <button class="btn btn-sm ${q.fav ? 'btn-success' : 'btn-outline'}" onclick="toggleFav('${q.id}');renderQuiz()">${q.fav ? '⭐ 已收藏' : '☆ 收藏'}</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;">
      ${state.quizIndex > 0 ? `<button class="btn btn-outline" style="flex:1;" onclick="state.quizIndex--;renderQuiz()">上一题</button>` : ''}
      <button class="btn" style="flex:1;" onclick="state.quizIndex++;renderQuiz()">${state.quizIndex < state.quizList.length - 1 ? '下一题 →' : '完成 ✅'}</button>
    </div>
  `;
}

/* ========== 模块4: 内容复盘 ========== */
function renderReview() {
  const reviews = Store.get('reviews', []).sort((a, b) => b.date.localeCompare(a.date));
  return `
    <h2 class="page-title">内容复盘</h2>
    <p class="page-desc">每日学习总结，持续改进 📝</p>
    <button class="btn btn-block" onclick="openReviewModal()">+ 写今日复盘</button>
    <div class="search-box" style="margin-top:14px;">
      <span class="icon">🔍</span>
      <input type="text" id="rSearch" placeholder="按日期或内容检索..." oninput="filterReviews()">
    </div>
    <div id="reviewList" style="margin-top:6px;">
      ${reviews.map(r => `
        <div class="review-item" data-search="${escapeHtml(r.date + r.summary + r.content)}">
          <div class="review-summary">${escapeHtml(r.summary)}</div>
          <div class="review-content">${escapeHtml(r.content)}</div>
          <div class="review-date">📅 ${r.date} ${r.date === today() ? '（今天）' : ''}</div>
        </div>
      `).join('') || '<div class="empty"><div class="emoji">📝</div><p>暂无复盘记录</p></div>'}
    </div>
  `;
}

function filterReviews() {
  const kw = $('#rSearch').value.toLowerCase();
  $$('#reviewList .review-item').forEach(c => {
    c.style.display = c.dataset.search.toLowerCase().includes(kw) ? '' : 'none';
  });
}

function openReviewModal() {
  const reviews = Store.get('reviews', []);
  const existing = reviews.find(r => r.date === today());
  showModal(`
    <div class="modal-header">
      <div class="modal-title">今日复盘 · ${fmtDate(today())}</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">今日总结（一句话）</label>
      <input class="form-input" id="rSummary" value="${existing ? escapeHtml(existing.summary) : ''}" placeholder="如：完成接口测试章节学习">
    </div>
    <div class="form-group">
      <label class="form-label">详细复盘</label>
      <textarea class="form-textarea" id="rContent" placeholder="今天学了什么？遇到什么问题？明天怎么改进？" style="min-height:150px;">${existing ? escapeHtml(existing.content) : ''}</textarea>
    </div>
    <button class="btn btn-block" onclick="saveReview()">保存复盘</button>
  `);
}

function saveReview() {
  const summary = $('#rSummary').value.trim();
  const content = $('#rContent').value.trim();
  if (!summary) { showToast('请输入总结'); return; }
  const reviews = Store.get('reviews', []);
  const idx = reviews.findIndex(r => r.date === today());
  if (idx >= 0) reviews[idx] = { ...reviews[idx], summary, content };
  else reviews.push({ id: uid(), date: today(), summary, content });
  Store.set('reviews', reviews);
  closeModal();
  renderPage();
  showToast('复盘已保存');
}

/* ========== 模块5/6/7: 更多 ========== */
function renderMore() {
  return `
    <h2 class="page-title">更多功能</h2>
    <p class="page-desc">知识库 · 英语学习 · 备忘录</p>
    <div class="cat-grid">
      <div class="cat-box" onclick="state.currentNav='knowledge';renderPage()">
        <div class="emoji">🗂️</div><div class="name">知识库</div>
        <div class="count">${Store.get('knowledge', []).length} 条记录</div>
      </div>
      <div class="cat-box" onclick="state.currentNav='english';renderPage()">
        <div class="emoji">🔤</div><div class="name">英语学习</div>
        <div class="count">${Store.get('english', []).length} 条记录</div>
      </div>
      <div class="cat-box" onclick="state.currentNav='memo';renderPage()">
        <div class="emoji">📌</div><div class="name">备忘录</div>
        <div class="count">${Store.get('memos', []).length} 条记录</div>
      </div>
      <div class="cat-box" onclick="state.currentNav='home';renderPage()">
        <div class="emoji">🏠</div><div class="name">返回首页</div>
        <div class="count">每日打卡</div>
      </div>
    </div>
  `;
}

/* ========== 模块5: 知识库 ========== */
function renderKnowledge() {
  const items = Store.get('knowledge', []);
  const cats = [...new Set(items.map(i => i.cat))];
  return `
    <div style="margin-bottom:16px;">
      <button class="btn-ghost" onclick="state.currentNav='more';renderPage()">← 返回</button>
    </div>
    <h2 class="page-title">🗂️ 知识库</h2>
    <p class="page-desc">自由分类，存放零散知识点和踩坑记录</p>
    <button class="btn btn-block" onclick="openKnowledgeModal()">+ 新增知识点</button>
    ${cats.length ? `<div class="section-label">分类筛选</div>
    <div class="tabs">
      <div class="tab active" onclick="filterKnowledge('',this)">全部</div>
      ${cats.map(c => `<div class="tab" onclick="filterKnowledge('${escapeHtml(c)}',this)">${escapeHtml(c)}</div>`).join('')}
    </div>` : ''}
    <div id="kList" style="margin-top:6px;">
      ${items.map((k, i) => knowledgeHTML(k, i)).join('') || '<div class="empty"><div class="emoji">🗂️</div><p>暂无记录</p></div>'}
    </div>
  `;
}

function knowledgeHTML(k, i) {
  return `
    <div class="q-card" data-cat="${escapeHtml(k.cat)}">
      <div class="q-question">
        <span class="tag tag-default">${escapeHtml(k.cat)}</span>
        <span>${i + 1}. ${escapeHtml(k.title)}</span>
      </div>
      <div class="q-answer">${escapeHtml(k.content)}</div>
      <div class="q-actions">
        <button class="btn btn-sm btn-outline" onclick="openKnowledgeModal('${k.id}')">编辑</button>
        <button class="btn btn-sm btn-ghost" onclick="deleteKnowledge('${k.id}')">删除</button>
      </div>
    </div>`;
}

function filterKnowledge(cat, el) {
  $$('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  $$('#kList .q-card').forEach(c => {
    c.style.display = (!cat || c.dataset.cat === cat) ? '' : 'none';
  });
}

function openKnowledgeModal(id) {
  const items = Store.get('knowledge', []);
  const k = id ? items.find(x => x.id === id) : null;
  const cats = [...new Set(items.map(i => i.cat))];
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${k ? '编辑知识点' : '新增知识点'}</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">分类</label>
      <input class="form-input" id="kCat" list="catList" value="${k ? escapeHtml(k.cat) : ''}" placeholder="如：踩坑记录 / 工具技巧">
      <datalist id="catList">${cats.map(c => `<option value="${escapeHtml(c)}">`).join('')}</datalist>
    </div>
    <div class="form-group">
      <label class="form-label">标题</label>
      <input class="form-input" id="kTitle" value="${k ? escapeHtml(k.title) : ''}" placeholder="知识点标题">
    </div>
    <div class="form-group">
      <label class="form-label">内容</label>
      <textarea class="form-textarea" id="kContent" placeholder="详细内容...">${k ? escapeHtml(k.content) : ''}</textarea>
    </div>
    <button class="btn btn-block" onclick="saveKnowledge('${id || ''}')">保存</button>
  `);
}

function saveKnowledge(id) {
  const cat = $('#kCat').value.trim() || '未分类';
  const title = $('#kTitle').value.trim();
  const content = $('#kContent').value.trim();
  if (!title) { showToast('请输入标题'); return; }
  const items = Store.get('knowledge', []);
  if (id) {
    const k = items.find(x => x.id === id);
    if (k) { k.cat = cat; k.title = title; k.content = content; }
  } else {
    items.push({ id: uid(), cat, title, content, date: today() });
  }
  Store.set('knowledge', items);
  closeModal();
  renderPage();
  showToast('已保存');
}

function deleteKnowledge(id) {
  if (!confirm('确定删除吗？')) return;
  let items = Store.get('knowledge', []);
  items = items.filter(k => k.id !== id);
  Store.set('knowledge', items);
  renderPage();
  showToast('已删除');
}

/* ========== 模块6: 英语学习 ========== */
function renderEnglish() {
  const words = Store.get('english', []);
  const records = Store.get('english_records', []);
  const todayRecord = records.find(r => r.date === today());
  return `
    <div style="margin-bottom:16px;">
      <button class="btn-ghost" onclick="state.currentNav='more';renderPage()">← 返回</button>
    </div>
    <h2 class="page-title">🔤 英语学习</h2>
    <p class="page-desc">单词短句笔记，每日打卡</p>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-num">${words.length}</div><div class="stat-label">单词/短句</div></div>
      <div class="stat-box"><div class="stat-num">${records.length}</div><div class="stat-label">打卡天数</div></div>
    </div>
    <button class="btn ${todayRecord ? 'btn-success' : ''} btn-block" onclick="englishCheckin()" style="margin-bottom:14px;">
      ${todayRecord ? '✅ 今日已打卡' : '📸 今日打卡'}
    </button>
    <div class="card">
      <div class="card-title">
        <span class="left"><span class="emoji">📖</span>单词短句本</span>
        <button class="btn btn-sm btn-outline" onclick="openEnglishModal()">+ 添加</button>
      </div>
      <div class="search-box">
        <span class="icon">🔍</span>
        <input type="text" id="eSearch" placeholder="搜索单词..." oninput="filterEnglish()">
      </div>
      <div id="eList">${words.map((w, i) => englishHTML(w, i)).join('')}</div>
      ${words.length === 0 ? '<div class="empty"><div class="emoji">🔤</div><p>暂无记录，开始添加单词吧</p></div>' : ''}
    </div>
  `;
}

function englishHTML(w, i) {
  return `
    <div class="word-item" data-search="${escapeHtml(w.en + w.zh + (w.note || ''))}">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div style="flex:1;">
          <div class="word-en">${escapeHtml(w.en)}</div>
          <div class="word-zh">${escapeHtml(w.zh)}</div>
          ${w.note ? `<div class="word-note">📝 ${escapeHtml(w.note)}</div>` : ''}
        </div>
        <div>
          <button class="btn-ghost" onclick="openEnglishModal('${w.id}')">✏️</button>
          <button class="btn-ghost" onclick="deleteEnglish('${w.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
}

function filterEnglish() {
  const kw = $('#eSearch').value.toLowerCase();
  $$('#eList .word-item').forEach(c => {
    c.style.display = c.dataset.search.toLowerCase().includes(kw) ? '' : 'none';
  });
}

function openEnglishModal(id) {
  const words = Store.get('english', []);
  const w = id ? words.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${w ? '编辑' : '添加'}单词/短句</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">英文</label>
      <input class="form-input" id="eEn" value="${w ? escapeHtml(w.en) : ''}" placeholder="如：test case">
    </div>
    <div class="form-group">
      <label class="form-label">中文</label>
      <input class="form-input" id="eZh" value="${w ? escapeHtml(w.zh) : ''}" placeholder="如：测试用例">
    </div>
    <div class="form-group">
      <label class="form-label">笔记（可选）</label>
      <textarea class="form-textarea" id="eNote" placeholder="例句、用法等">${w ? escapeHtml(w.note || '') : ''}</textarea>
    </div>
    <button class="btn btn-block" onclick="saveEnglish('${id || ''}')">保存</button>
  `);
}

function saveEnglish(id) {
  const en = $('#eEn').value.trim();
  const zh = $('#eZh').value.trim();
  const note = $('#eNote').value.trim();
  if (!en || !zh) { showToast('请填写英文和中文'); return; }
  const words = Store.get('english', []);
  if (id) {
    const w = words.find(x => x.id === id);
    if (w) { w.en = en; w.zh = zh; w.note = note; }
  } else {
    words.push({ id: uid(), en, zh, note, date: today() });
  }
  Store.set('english', words);
  closeModal();
  renderPage();
  showToast('已保存');
}

function deleteEnglish(id) {
  if (!confirm('确定删除吗？')) return;
  let words = Store.get('english', []);
  words = words.filter(w => w.id !== id);
  Store.set('english', words);
  renderPage();
  showToast('已删除');
}

function englishCheckin() {
  const records = Store.get('english_records', []);
  if (records.find(r => r.date === today())) { showToast('今天已经打卡啦'); return; }
  records.push({ id: uid(), date: today() });
  Store.set('english_records', records);
  renderPage();
  showToast('📸 打卡成功！');
}

/* ========== 模块7: 备忘录 ========== */
function renderMemo() {
  const memos = Store.get('memos', []).sort((a, b) => b.time.localeCompare(a.time));
  return `
    <div style="margin-bottom:16px;">
      <button class="btn-ghost" onclick="state.currentNav='more';renderPage()">← 返回</button>
    </div>
    <h2 class="page-title">📌 备忘录</h2>
    <p class="page-desc">HR沟通、面试时间、待办事项，随手记</p>
    <div class="quick-add">
      <input class="form-input" id="quickMemo" placeholder="快速记录，回车保存..." onkeydown="if(event.key==='Enter')quickAddMemo()">
      <button class="btn" onclick="quickAddMemo()">+</button>
    </div>
    <div class="search-box">
      <span class="icon">🔍</span>
      <input type="text" id="mSearch" placeholder="搜索备忘..." oninput="filterMemos()">
    </div>
    <div id="mList">
      ${memos.map(m => `
        <div class="memo-item" data-search="${escapeHtml(m.content)}">
          <div class="memo-content">${escapeHtml(m.content)}</div>
          <div class="memo-time" style="display:flex;justify-content:space-between;">
            <span>🕒 ${m.time.replace('T', ' ').slice(0, 16)}</span>
            <button class="btn-ghost" onclick="deleteMemo('${m.id}')">删除</button>
          </div>
        </div>
      `).join('') || '<div class="empty"><div class="emoji">📌</div><p>暂无备忘，开始记录吧</p></div>'}
    </div>
  `;
}

function quickAddMemo() {
  const content = $('#quickMemo').value.trim();
  if (!content) return;
  const memos = Store.get('memos', []);
  memos.push({ id: uid(), content, time: new Date().toISOString() });
  Store.set('memos', memos);
  renderPage();
  showToast('已记录');
}

function deleteMemo(id) {
  if (!confirm('确定删除吗？')) return;
  let memos = Store.get('memos', []);
  memos = memos.filter(m => m.id !== id);
  Store.set('memos', memos);
  renderPage();
  showToast('已删除');
}

function filterMemos() {
  const kw = $('#mSearch').value.toLowerCase();
  $$('#mList .memo-item').forEach(c => {
    c.style.display = c.dataset.search.toLowerCase().includes(kw) ? '' : 'none';
  });
}

/* ========== Modal ========== */
function showModal(html) {
  let mask = $('#modalMask');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'modalMask';
    mask.className = 'modal-mask';
    mask.innerHTML = `<div class="modal" id="modalContent"></div>`;
    mask.addEventListener('click', e => { if (e.target === mask) closeModal(); });
    document.body.appendChild(mask);
  }
  $('#modalContent').innerHTML = html;
  setTimeout(() => mask.classList.add('show'), 10);
}

function closeModal() {
  const mask = $('#modalMask');
  if (mask) {
    mask.classList.remove('show');
    setTimeout(() => mask.remove(), 200);
  }
}

/* ========== Boot ========== */
document.addEventListener('DOMContentLoaded', init);
