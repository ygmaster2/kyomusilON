/**
 * 교무실ON 포털 메인 스크립트 (자료는 학교 계정으로 확인된 뒤 내부자료 시트에서 받아 옴)
 */

// ============================================================================
// 교무실ON 설정
// ----------------------------------------------------------------------------
// 이 포털(GitHub)에는 자료가 없습니다. 모든 자료는 "교무실ON 내부자료" 시트에 있고,
// 학교 계정(@yanggok.hs.kr)으로 로그인한 선생님에게만 아래 GAS 웹 앱이 건네줍니다.
//   .../exec               → 학사일정 입력 화면 (권한 있는 선생님)
//   .../exec?view=bridge   → 포털 안에 숨겨서 여는 자료 전달 창
//   .../exec?view=connect  → [학교 계정으로 연결] 버튼이 여는 작은 창
// ============================================================================
const GYOMUSIL_APP_URL = 'https://script.google.com/a/macros/yanggok.hs.kr/s/AKfycbwVnE2Y-nyeGWnQ6HdVAgD2bWECqoXoi9vCm1PinzqQpV48zCSf8U9QgH81XfsA-z0ueA/exec';
const CALENDAR_ADMIN_URL = GYOMUSIL_APP_URL;
const BRIDGE_URL = GYOMUSIL_APP_URL + '?view=bridge';
const CONNECT_URL = GYOMUSIL_APP_URL + '?view=connect';
const PORTAL_CACHE_KEY = 'gyomusilon_portal_v2';   // 이 컴퓨터에 저장해 두는 자료
const BRIDGE_TIMEOUT_MS = 45000;                   // 확인 창이 아예 안 열릴 때 최대 대기 시간
const BRIDGE_AFTER_LOAD_MS = 8000;                 // 확인 창이 열렸는데 학교 계정 신호가 없으면 이만큼만 더 기다림

// 시트에서 받아 오는 자료 (처음엔 비어 있음)
let DEPARTMENTS = [];
let PROGRAMS = [];
let NOTICE_ITEMS = [];

document.addEventListener('DOMContentLoaded', () => {
  // 상태 변수
  let currentMonth = toYearMonth(new Date());
  let calendarEvents = [];
  let currentProgFilter = 'all';
  let currentProgSearch = '';
  let currentNoticeFilter = 'all';
  let activeEmbeddedProgram = null;
  let currentDeptId = null;
  let portalUser = null;
  let bridgeFrame = null;   // 숨겨진 자료 전달 창
  let bridgeTimer = null;
  let bridgeReady = false;
  let gateTimer = null;
  let askAction = null;

  // ==========================================================================
  // 1. 초기 렌더링 및 이벤트 등록
  // ==========================================================================
  initSidebarDepartmentTree();
  initCalendar();
  initNotices();
  initProgramsList();
  initAnnualHub();
  initTheme();
  setupGlobalEvents();
  initAskModal();
  initPortalData();

  // ==========================================================================
  // 2. 좌측 사이드바: 10개 부서 아코디언 트리 메뉴
  // ==========================================================================
  function initSidebarDepartmentTree() {
    const treeContainer = document.getElementById('departmentTreeList');
    if (!treeContainer) return;

    treeContainer.innerHTML = '';

    DEPARTMENTS.forEach((dept) => {
      // 해당 부서에 속한 프로그램 목록
      const deptProgs = PROGRAMS.filter((p) => p.department === dept.name);

      const li = document.createElement('li');
      li.className = 'tree-node';
      li.id = `deptNode-${dept.id}`;

      // 부서 메인 버튼
      const deptBtn = document.createElement('button');
      deptBtn.className = 'tree-item-btn';
      deptBtn.innerHTML = `
        <div class="tree-left">
          <span class="tree-icon">${dept.icon}</span>
          <span>${dept.name}</span>
        </div>
        <div class="tree-right">
          ${deptProgs.length > 0 ? `<span class="tree-badge">${deptProgs.length}</span>` : ''}
          <span class="nav-chevron">▶</span>
        </div>
      `;

      // 하위 프로그램 서브메뉴
      const subUl = document.createElement('ul');
      subUl.className = 'nav-submenu';

      // 1) 부서 업무 안내 바로가기
      const introLi = document.createElement('li');
      const introBtn = document.createElement('button');
      introBtn.className = 'sub-nav-btn';
      introBtn.textContent = `📋 ${dept.name} 업무 안내`;
      introBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDepartmentPage(dept.id);
      });
      introLi.appendChild(introBtn);
      subUl.appendChild(introLi);

      // 2) 프로그램 목록 바로가기
      deptProgs.forEach((prog) => {
        const subLi = document.createElement('li');
        const subBtn = document.createElement('button');
        subBtn.className = 'sub-nav-btn';
        subBtn.innerHTML = `${prog.category === 'work' ? '💼' : '🎓'} ${prog.title}`;
        subBtn.title = prog.title;
        subBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (prog.launchType === 'EMBED') {
            openEmbeddedProgram(prog);
          } else {
            openDepartmentPage(dept.id, prog.id);
          }
        });
        subLi.appendChild(subBtn);
        subUl.appendChild(subLi);
      });

      // 부서 버튼 클릭 시 아코디언 토글 & 부서 뷰 전환
      deptBtn.addEventListener('click', () => {
        const isExpanded = li.classList.contains('expanded');
        // 다른 열린 부서 닫기
        document.querySelectorAll('#departmentTreeList .tree-node').forEach((node) => {
          if (node !== li) node.classList.remove('expanded');
        });
        li.classList.toggle('expanded', !isExpanded);
        openDepartmentPage(dept.id);
      });

      li.appendChild(deptBtn);
      li.appendChild(subUl);
      treeContainer.appendChild(li);
    });
  }

  // ==========================================================================
  // 3. 뷰 전환: 대시보드 홈 vs 부서별 메인 화면
  // ==========================================================================
  window.showDashboardHome = function () {
    leaveEmbeddedProgram();
    currentDeptId = null;
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('departmentView').style.display = 'none';

    // 사이드바 활성 스타일 조정
    document.querySelectorAll('.tree-item-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById('navDashboardMainBtn').classList.add('active');

    // 브레드크럼
    document.getElementById('breadcrumbDept').textContent = '대시보드';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.openDepartmentPage = function (deptId, targetProgId = null) {
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (!dept) return;
    currentDeptId = deptId;

    leaveEmbeddedProgram();

    // 뷰 전환
    document.getElementById('dashboardView').style.display = 'none';
    const deptView = document.getElementById('departmentView');
    deptView.style.display = 'block';

    // 사이드바 활성화 갱신
    document.querySelectorAll('.tree-item-btn').forEach((btn) => btn.classList.remove('active'));
    const deptNode = document.getElementById(`deptNode-${dept.id}`);
    if (deptNode) {
      deptNode.querySelector('.tree-item-btn').classList.add('active');
      deptNode.classList.add('expanded');
    }

    // 브레드크럼
    document.getElementById('breadcrumbDept').textContent = dept.name;

    // 1) 부서 기본 정보 채우기
    document.getElementById('deptIconEl').textContent = dept.icon;
    document.getElementById('deptTitleEl').textContent = dept.name;
    document.getElementById('deptDescEl').textContent = dept.desc;

    // 2) 계별 업무 분장표 그리드 채우기
    const workGrid = document.getElementById('deptWorkSummaryGrid');
    workGrid.innerHTML = '';
    if (dept.workSummary && dept.workSummary.length > 0) {
      dept.workSummary.forEach((ws) => {
        const item = document.createElement('div');
        item.className = 'work-summary-item';
        item.innerHTML = `
          <div class="work-role-badge">📌 ${ws.role}</div>
          <div class="work-duty-text">${ws.duty}</div>
        `;
        workGrid.appendChild(item);
      });
    }

    // 3) 신학년도 인수인계 팁
    const tipBox = document.getElementById('deptHandoverTipBox');
    const tipText = document.getElementById('deptHandoverTipText');
    if (dept.handoverTip) {
      tipBox.style.display = 'flex';
      tipText.innerHTML = `<strong>신학년도 세팅 팁:</strong> ${dept.handoverTip}`;
    } else {
      tipBox.style.display = 'none';
    }

    // 4) 부서 소속 프로그램 목록 채우기
    const deptProgs = PROGRAMS.filter((p) => p.department === dept.name);
    document.getElementById('deptProgramSectionTitle').textContent = `${dept.name} 소속 프로그램 목록`;
    document.getElementById('deptProgramCountBadge').textContent = `총 ${deptProgs.length}개`;

    const container = document.getElementById('deptProgramsContainer');
    container.innerHTML = '';

    if (deptProgs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-light); color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">📂</div>
          현재 등록된 전용 바이브 코딩 프로그램이 없습니다.<br>
          (업무 효율화를 위한 신규 도구 개발 및 등록이 가능합니다.)
        </div>
      `;
    } else {
      deptProgs.forEach((prog) => {
        const card = createProgramCard(prog);
        card.id = `deptProgCard-${prog.id}`;
        container.appendChild(card);
      });
    }

    // 특정 프로그램 클릭하여 넘어온 경우 스크롤 이동
    if (targetProgId) {
      setTimeout(() => {
        const targetEl = document.getElementById(`deptProgCard-${targetProgId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.style.boxShadow = '0 0 0 3px var(--primary)';
          setTimeout(() => {
            targetEl.style.boxShadow = '';
          }, 1800);
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==========================================================================
  // 4. 대시보드 1: 월별 학사 일정 달력
  // ==========================================================================
  function initCalendar() {
    calendarEvents = [];
    renderCalendar();
    initCalendarAdmin();
  }

  // 학사일정 관리 버튼 → 포털 안에서 입력 화면 열기 (권한 있는 선생님에게만 보임)
  function initCalendarAdmin() {
    const btn = document.getElementById('openCalendarAdminBtn');
    if (!btn) return;
    btn.style.display = 'none';
    btn.addEventListener('click', () => {
      openEmbeddedProgram({ id: 'calendar-admin', title: '학사일정 관리', launchUrl: CALENDAR_ADMIN_URL });
    });
  }

  function renderCalendar() {
    renderMonthNav();
    renderCalendarGrid();
  }

  // ==========================================================================
  // 학교 계정 연결: 자료 받기 · 이 컴퓨터에 저장 · 로그인 안내
  // ==========================================================================
  // 1) 이 컴퓨터에 저장해 둔 자료가 있으면 먼저 바로 보여줌
  // 2) 숨겨진 자료 전달 창(GAS, 학교 계정 전용)을 열어 최신 자료를 받음
  // 3) 학교 계정 확인이 안 되면 저장 자료를 지우고 로그인 안내를 띄움
  function initPortalData() {
    try { localStorage.removeItem('gyomusilon_calendar_v1'); } catch (e) { /* 예전 저장 자료 정리 */ }
    window.addEventListener('message', onBridgeMessage);
    if (!document.getElementById('loginGate')) {
      console.error('[교무실ON] index.html이 예전 버전입니다. 교무실ON.html 내용으로 바꿔 주세요.');
      return;
    }
    document.getElementById('gateConnectBtn').addEventListener('click', openConnectWindow);
    document.getElementById('gateRetryBtn').addEventListener('click', () => { showGate('checking'); loadBridge(); });
    document.getElementById('accountChip').addEventListener('click', confirmForget);

    const cached = readPortalCache();
    if (cached) {
      applyPortalData(cached.data);
      setCalendarStatus(`저장된 자료 · ${formatStamp(cached.savedAt)} · 새로 확인 중…`);
      hideGate();
    } else {
      showGate('checking');
    }
    loadBridge();
  }

  function loadBridge() {
    bridgeReady = false;
    if (bridgeFrame) bridgeFrame.remove();
    bridgeFrame = document.createElement('iframe');
    bridgeFrame.className = 'bridge-frame';
    bridgeFrame.title = '교무실ON 학교 계정 확인';
    bridgeFrame.setAttribute('aria-hidden', 'true');
    // 창이 열렸는데(load) 학교 계정 신호가 없다 = 구글 로그인 화면이나 접근 거부 화면 → 금방 안내
    // (학교 계정이면 창이 열린 뒤 1~3초 안에 신호가 옴. 구글 서버가 느린 시간은 창이 열리기 전이라 영향 없음)
    bridgeFrame.addEventListener('load', () => {
      if (bridgeReady) return;
      clearTimeout(bridgeTimer);
      bridgeTimer = setTimeout(onBridgeTimeout, BRIDGE_AFTER_LOAD_MS);
    });
    bridgeFrame.src = BRIDGE_URL + '&t=' + Date.now();
    document.body.appendChild(bridgeFrame);
    clearTimeout(bridgeTimer);
    bridgeTimer = setTimeout(onBridgeTimeout, BRIDGE_TIMEOUT_MS);
  }

  function isGoogleOrigin(origin) {
    try { return /(^|\.)googleusercontent\.com$/.test(new URL(origin).hostname); } catch (e) { return false; }
  }

  function onBridgeMessage(e) {
    if (!isGoogleOrigin(e.origin) || !e.data) return;
    const msg = e.data;
    // 학사일정 입력 화면에서 저장·삭제 → 자료 다시 받기
    if (msg.source === 'gyomusilon' && msg.type === 'calendar-updated') { loadBridge(); return; }
    if (msg.source !== 'gyomusilon-bridge') return;

    if (msg.type === 'bridge-ready') {
      bridgeReady = true;
      clearTimeout(bridgeTimer);
      bridgeTimer = setTimeout(onBridgeTimeout, BRIDGE_TIMEOUT_MS + 30000); // 자료 읽기까지 조금 더 기다림
      setGateText('학교 계정이 확인되었습니다', '자료를 불러오는 중입니다…');
    } else if (msg.type === 'portal-data' && msg.data) {
      clearTimeout(bridgeTimer);
      applyPortalData(msg.data);
      writePortalCache(msg.data);
      setCalendarStatus(`학교 계정 연결됨 · ${formatStamp(Date.now())}`);
      hideGate();
      if (bridgeFrame) { bridgeFrame.remove(); bridgeFrame = null; }
    } else if (msg.type === 'portal-error') {
      clearTimeout(bridgeTimer);
      lockPortal(msg.message);
    }
  }

  function onBridgeTimeout() {
    if (bridgeFrame) { bridgeFrame.remove(); bridgeFrame = null; }
    if (navigator.onLine === false && readPortalCache()) {
      setCalendarStatus('인터넷 연결 없음 · 저장된 자료 표시 중');
      return;
    }
    lockPortal();
  }

  // 학교 계정 확인 실패 → 저장 자료를 지우고 로그인 안내
  function lockPortal(message) {
    clearPortalCache();
    applyPortalData({ depts: [], programs: [], notices: [], events: [], user: null });
    setCalendarStatus('학교 계정 확인 필요');
    showGate('login', message);
  }

  function openConnectWindow() {
    const w = 480, h = 620;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 3);
    const win = window.open(CONNECT_URL, 'gyomusilon_connect', `width=${w},height=${h},left=${left},top=${top}`);
    if (!win) {
      setGateText('연결 창이 막혔습니다', '브라우저 주소창 오른쪽의 "팝업 차단" 표시를 눌러 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.');
      return;
    }
    showGate('checking');
    setGateText('연결 창에서 학교 계정을 골라 주세요', '구글 계정 선택 화면이 나오면 @yanggok.hs.kr 계정을 고르면 됩니다.');
    clearTimeout(bridgeTimer);
    bridgeTimer = setTimeout(onBridgeTimeout, 180000); // 로그인하는 시간을 넉넉히
  }

  function applyPortalData(data) {
    DEPARTMENTS = Array.isArray(data.depts) ? data.depts : [];
    PROGRAMS = Array.isArray(data.programs) ? data.programs : [];
    NOTICE_ITEMS = Array.isArray(data.notices) ? data.notices : [];
    calendarEvents = Array.isArray(data.events) ? data.events : [];
    portalUser = data.user || null;

    initSidebarDepartmentTree();
    renderCalendar();
    renderNotices();
    renderAllPrograms();
    updateAnnualCounter();

    const adminBtn = document.getElementById('openCalendarAdminBtn');
    if (adminBtn) adminBtn.style.display = portalUser && portalUser.canEditCalendar ? '' : 'none';

    const chip = document.getElementById('accountChip');
    if (chip) {
      chip.style.display = portalUser ? '' : 'none';
      chip.textContent = portalUser ? `👤 ${portalUser.name} 선생님` : '';
      chip.title = portalUser ? `${portalUser.email}\n누르면 이 컴퓨터에 저장된 교무실ON 자료를 지울 수 있습니다.` : '';
    }

    // 부서 화면을 보고 있었다면 새 자료로 다시 그림
    const deptView = document.getElementById('departmentView');
    if (currentDeptId && deptView && deptView.style.display !== 'none') {
      if (DEPARTMENTS.some((d) => d.id === currentDeptId)) openDepartmentPage(currentDeptId);
      else showDashboardHome();
    }
  }

  function readPortalCache() {
    try {
      const raw = localStorage.getItem(PORTAL_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && obj.data ? obj : null;
    } catch (e) {
      return null;
    }
  }

  function writePortalCache(data) {
    try {
      localStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    } catch (e) {
      /* 저장소를 쓸 수 없는 환경이면 그냥 넘어감 */
    }
  }

  function clearPortalCache() {
    try { localStorage.removeItem(PORTAL_CACHE_KEY); } catch (e) { /* 무시 */ }
  }

  // --- 로그인 안내 화면 (진행 중 알림 포함) ---
  function showGate(mode, message) {
    const gate = document.getElementById('loginGate');
    gate.classList.add('show');
    gate.dataset.mode = mode;
    clearInterval(gateTimer);
    if (mode === 'checking') {
      const start = Date.now();
      setGateText('학교 계정을 확인하는 중입니다…', '잠시만 기다려 주세요.');
      gateTimer = setInterval(() => {
        const sec = Math.floor((Date.now() - start) / 1000);
        const sub = document.getElementById('gateSub');
        if (sec >= 10) sub.innerHTML = `${sec}초째 진행 중…<br>구글 서버가 응답을 준비하고 있습니다. 처음 열거나 오랜만에 쓸 때는 30초~1분까지 걸릴 수 있어요.`;
        else if (sec >= 3) sub.textContent = `${sec}초째 진행 중…`;
      }, 1000);
    } else {
      setGateText('학교 계정으로 로그인하면 볼 수 있습니다',
        '교무실ON은 양곡고 선생님 전용입니다. 크롬에 학교 계정(@yanggok.hs.kr)으로 로그인한 뒤 아래 버튼을 눌러 주세요.' +
        (message ? `<br><span class="gate-err">${escapeHtml(message)}</span>` : ''));
    }
  }

  function setGateText(title, sub) {
    document.getElementById('gateTitle').textContent = title;
    document.getElementById('gateSub').innerHTML = sub;
  }

  function hideGate() {
    clearInterval(gateTimer);
    document.getElementById('loginGate').classList.remove('show');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // --- 이 컴퓨터에서 지우기 (확인 모달) ---
  function initAskModal() {
    const box = document.getElementById('confirmBox');
    document.getElementById('cfOk').addEventListener('click', () => closeAsk(true));
    document.getElementById('cfCancel').addEventListener('click', () => closeAsk(false));
    box.addEventListener('click', (e) => { if (e.target === box) closeAsk(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('show')) closeAsk(false); });
  }
  function ask(opt, onOk) {
    askAction = onOk;
    document.getElementById('cfTitle').textContent = opt.title;
    document.getElementById('cfBody').innerHTML = opt.body;
    document.getElementById('cfOk').textContent = opt.ok;
    document.getElementById('cfIcon').textContent = opt.danger ? '⚠️' : '❓';
    document.getElementById('cfPanel').classList.toggle('danger', !!opt.danger);
    document.getElementById('cfIcon').textContent = opt.info ? '💡' : (opt.danger ? '⚠️' : '❓');
    document.getElementById('cfCancel').style.display = opt.info ? 'none' : '';
    document.getElementById('confirmBox').classList.add('show');
    setTimeout(() => document.getElementById(opt.danger ? 'cfCancel' : 'cfOk').focus(), 0);
  }
  function closeAsk(run) {
    document.getElementById('confirmBox').classList.remove('show');
    const fn = askAction; askAction = null;
    if (run && fn) fn();
  }
  function confirmForget() {
    ask({
      title: '이 컴퓨터에서 교무실ON 자료를 지울까요?',
      body: `<b>${escapeHtml(portalUser ? portalUser.email : '')}</b> 계정으로 받아 저장해 둔 자료를 이 컴퓨터에서 지웁니다.\n학교 계정 로그인은 그대로이며, 다음에 포털을 열면 다시 받아 옵니다.\n다른 사람과 같이 쓰는 컴퓨터라면 지워 두세요.`,
      ok: '이 컴퓨터에서 지우기',
      danger: true
    }, () => {
      clearPortalCache();
      applyPortalData({ depts: [], programs: [], notices: [], events: [], user: null });
      setCalendarStatus('저장된 자료를 지웠습니다');
      showGate('login');
      setGateText('이 컴퓨터에 저장된 자료를 지웠습니다', '다시 보려면 아래 [학교 계정으로 연결] 또는 [다시 확인]을 눌러 주세요.');
    });
  }

  function setCalendarStatus(text) {
    const el = document.getElementById('calSyncStatus');
    if (el) el.textContent = text;
  }

  // --- 월 이동 -----------------------------------------------------------------
  function renderMonthNav() {
    const nav = document.querySelector('.cal-month-nav');
    if (!nav) return;
    const thisMonth = toYearMonth(new Date());
    nav.innerHTML = `
      <button class="cal-nav-btn" type="button" data-shift="-1" title="이전 달">‹ 이전</button>
      <button class="cal-nav-btn ${currentMonth === thisMonth ? 'active' : ''}" type="button" data-shift="0" title="이번 달로 이동">이번 달</button>
      <button class="cal-nav-btn" type="button" data-shift="1" title="다음 달">다음 ›</button>
    `;
    nav.querySelectorAll('.cal-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shift = Number(btn.dataset.shift);
        currentMonth = shift === 0 ? toYearMonth(new Date()) : shiftMonth(currentMonth, shift);
        renderCalendar();
      });
    });
  }

  function getMonthData(ym) {
    const [y, m] = ym.split('-').map(Number);
    const prefix = `${y}-${pad2(m)}-`;
    const events = calendarEvents
      .map((e) => ({ ...e, date: normalizeDate(e.date) }))
      .filter((e) => e.date.startsWith(prefix))
      .map((e) => ({ ...e, day: Number(e.date.slice(8, 10)), dept: e.dept || '공통' }));
    return {
      year: y,
      month: m,
      monthName: `${m}월`,
      daysInMonth: new Date(y, m, 0).getDate(),
      startDayOfWeek: new Date(y, m - 1, 1).getDay(),
      events
    };
  }

  // --- 달력 그리기 -------------------------------------------------------------
  function renderCalendarGrid() {
    const data = getMonthData(currentMonth);

    const titleEl = document.getElementById('calCurrentMonthTitle');
    if (titleEl) {
      titleEl.textContent = `${data.year}년 ${data.monthName} 학사 일정 달력`;
    }

    const container = document.getElementById('calendarGridContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const isThisMonth = toYearMonth(today) === currentMonth;

    // 1) 시작 요일 이전의 빈 셀 채우기
    for (let i = 0; i < data.startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      container.appendChild(emptyCell);
    }

    // 2) 날짜 셀 생성 (1일 ~ 말일)
    for (let day = 1; day <= data.daysInMonth; day++) {
      const dayOfWeek = (data.startDayOfWeek + day - 1) % 7;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (dayOfWeek === 0) cell.classList.add('sun');
      if (dayOfWeek === 6) cell.classList.add('sat');
      if (isThisMonth && day === today.getDate()) cell.classList.add('today');

      const numEl = document.createElement('div');
      numEl.className = 'cal-day-num';
      numEl.textContent = day;
      cell.appendChild(numEl);

      // 해당 일자의 학사 일정
      const events = data.events.filter((e) => e.day === day);
      if (events.length > 0) {
        const eventsWrap = document.createElement('div');
        eventsWrap.className = 'cal-events-wrap';

        events.forEach((ev) => {
          const tag = document.createElement('div');
          tag.className = `cal-event-tag ${ev.isImportant ? 'important' : ''}`;
          tag.textContent = ev.title;
          tag.title = `[${ev.dept}] ${ev.title}`;
          tag.addEventListener('click', (e) => {
            e.stopPropagation();
            openNoticeModal({
              title: `[학사 일정] ${ev.title}`,
              dept: ev.dept,
              date: `${data.year}.${data.month}.${day}`,
              content: `부서: ${ev.dept}<br>일정 내용: ${ev.title}<br>구분: ${ev.isImportant ? '주요 학사 일정 (필독)' : '일반 학사 일정'}`
            });
          });
          eventsWrap.appendChild(tag);
        });

        cell.appendChild(eventsWrap);
      }

      container.appendChild(cell);
    }
  }

  // --- 날짜 도우미 -------------------------------------------------------------
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toYearMonth(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function shiftMonth(ym, delta) {
    const [y, m] = ym.split('-').map(Number);
    return toYearMonth(new Date(y, m - 1 + delta, 1));
  }

  // "2026-9-5", "2026.09.05", "2026/9/5" 같은 형식을 "2026-09-05"로 통일
  function normalizeDate(s) {
    const parts = String(s || '').trim().split(/[-./\s]+/).filter(Boolean);
    if (parts.length < 3) return '';
    return `${parts[0]}-${pad2(parts[1])}-${pad2(parts[2])}`;
  }

  function formatStamp(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // ==========================================================================
  // 5. 대시보드 2: 부서별 전달 내용 안내 (공지)
  // ==========================================================================
  function initNotices() {
    renderNotices();

    // 부서 필터 칩 클릭 이벤트
    const chipBtns = document.querySelectorAll('.notice-chip-btn');
    chipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        chipBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentNoticeFilter = btn.getAttribute('data-dept');
        renderNotices();
      });
    });
  }

  function renderNotices() {
    const container = document.getElementById('noticesContainer');
    if (!container) return;

    container.innerHTML = '';

    const filtered = currentNoticeFilter === 'all'
      ? NOTICE_ITEMS
      : NOTICE_ITEMS.filter((n) => n.dept === currentNoticeFilter);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
          해당 부서의 등록된 전달 내용이 없습니다.
        </div>
      `;
      return;
    }

    filtered.forEach((notice) => {
      const card = document.createElement('div');
      card.className = 'notice-card';

      let badgeClass = 'badge-info';
      if (notice.badge === '중요') badgeClass = 'badge-warn';
      if (notice.badge === '점검') badgeClass = 'badge-check';

      card.innerHTML = `
        <div>
          <div class="notice-card-top">
            <span class="badge ${badgeClass}">${notice.badge}</span>
            <span style="font-size:0.76rem; color:var(--text-muted);">${notice.date}</span>
          </div>
          <div class="notice-card-title">${notice.title}</div>
          <div class="notice-card-desc">${notice.content}</div>
        </div>
        <div class="notice-card-footer">
          <span>🏛️ ${notice.dept}</span>
          <span style="color:var(--primary); font-weight:600;">자세히 보기 &rsaquo;</span>
        </div>
      `;

      card.addEventListener('click', () => {
        openNoticeModal(notice);
      });

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // 6. 대시보드 3: 프로그램 전체 목록 (검색 및 탭 필터링)
  // ==========================================================================
  function initProgramsList() {
    renderAllPrograms();

    // 탭 필터
    const tabBtns = document.querySelectorAll('.cat-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentProgFilter = btn.getAttribute('data-filter');
        renderAllPrograms();
      });
    });

    // 실시간 검색
    const searchInput = document.getElementById('programSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentProgSearch = e.target.value.trim().toLowerCase();
        renderAllPrograms();
      });
    }

    updateAnnualCounter();
  }

  // 인수인계 카운터 업데이트
  function updateAnnualCounter() {
    const annualResetCount = PROGRAMS.filter((p) => p.annualReset).length;
    const counterBadge = document.getElementById('annualCounter');
    if (counterBadge) counterBadge.textContent = annualResetCount;
    const tabResetBtn = document.getElementById('tabBtnReset');
    if (tabResetBtn) tabResetBtn.textContent = `⚠️ 신학년도 세팅 (${annualResetCount})`;
  }

  function renderAllPrograms() {
    const container = document.getElementById('programsGridContainer');
    if (!container) return;

    container.innerHTML = '';

    const filtered = PROGRAMS.filter((prog) => {
      // 카테고리 필터
      if (currentProgFilter === 'work' && prog.category !== 'work') return false;
      if (currentProgFilter === 'study' && prog.category !== 'study') return false;
      if (currentProgFilter === 'annualReset' && !prog.annualReset) return false;

      // 검색어 필터
      if (currentProgSearch) {
        const text = `${prog.title} ${prog.summary} ${prog.department} ${prog.roleTag} ${prog.tags ? prog.tags.join(' ') : ''}`.toLowerCase();
        if (!text.includes(currentProgSearch)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
          검색 조건에 맞는 프로그램이 없습니다. 다른 키워드를 입력해 보세요.
        </div>
      `;
      return;
    }

    filtered.forEach((prog) => {
      const card = createProgramCard(prog);
      container.appendChild(card);
    });
  }

  // 공통 프로그램 카드 엘리먼트 생성기
  function createProgramCard(prog) {
    const card = document.createElement('div');
    card.className = 'prog-card';

    // 카테고리 뱃지
    const catBadge = prog.category === 'work'
      ? `<span class="badge badge-work">💼 업무용</span>`
      : `<span class="badge badge-study">🎓 수업·학습</span>`;

    // 신학년도 인수인계 뱃지
    const resetBadge = prog.annualReset
      ? `<span class="badge badge-reset" title="${prog.resetPeriod}">⚠️ 세팅 필요</span>`
      : '';

    // 태그 목록
    const tagsHtml = prog.tags
      ? prog.tags.map((t) => `<span class="prog-sub-tag">#${t}</span>`).join('')
      : '';

    const isEmbedded = prog.launchType === 'EMBED';
    const launchButton = isEmbedded
      ? `<button type="button" class="btn-launch-primary btn-embed-launch" data-embed-id="${prog.id}" title="포털 안에서 프로그램 실행"><span>🚀 여기서 실행</span></button>`
      : `<a href="${prog.launchUrl}" target="_blank" rel="noopener" class="btn-launch-primary" title="프로그램 실행"><span>🚀 실행하기</span></a>`;
    const manualButton = prog.manualFile
      ? `<a href="${prog.manualFile}" target="_blank" class="btn-manual-secondary" title="사용 매뉴얼"><span>📖 매뉴얼</span></a>`
      : '';

    card.innerHTML = `
      <div>
        <div class="prog-card-header">
          <div class="prog-card-badges">
            <span class="badge badge-dept">${prog.department}</span>
            ${catBadge}
            ${resetBadge}
          </div>
          <span class="prog-role-tag">${prog.roleTag}</span>
        </div>

        <h3 class="prog-title">${prog.title}</h3>
        <p class="prog-summary">${prog.summary}</p>
        <div class="prog-tags-wrap">${tagsHtml}</div>
      </div>

      <div class="prog-card-actions">
        ${launchButton}
        ${manualButton}
        ${prog.annualReset ? `
          <button class="btn-guide-warn" title="신학년도 인수인계 가이드 확인" data-reset-id="${prog.id}">
            <span>가이드</span>
          </button>
        ` : ''}
      </div>
    `;

    const embedBtn = card.querySelector('.btn-embed-launch');
    if (embedBtn) {
      embedBtn.addEventListener('click', () => openEmbeddedProgram(prog));
    }

    // 인수인계 가이드 버튼 클릭 이벤트
    const guideBtn = card.querySelector('.btn-guide-warn');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        openHandoverModal(prog);
      });
    }

    return card;
  }

  // ========================================================================
  // 포털 내부 프로그램 실행 및 집중 모드
  // ========================================================================
  function openEmbeddedProgram(prog) {
    const view = document.getElementById('embeddedProgramView');
    const frame = document.getElementById('embeddedProgramFrame');
    if (!view || !frame) return;

    activeEmbeddedProgram = prog;
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('departmentView').style.display = 'none';
    view.style.display = 'block';
    frame.src = prog.launchUrl;

    document.body.classList.add('program-mode', 'sidebar-collapsed');
    document.getElementById('breadcrumbDept').textContent = prog.title;

    const newWindowBtn = document.getElementById('openProgramNewWindowBtn');
    if (newWindowBtn) newWindowBtn.title = `${prog.title} 새 창으로 열기`;

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function leaveEmbeddedProgram() {
    if (activeEmbeddedProgram && activeEmbeddedProgram.id === 'calendar-admin') {
      loadBridge();
    }
    const view = document.getElementById('embeddedProgramView');
    const frame = document.getElementById('embeddedProgramFrame');
    if (view) view.style.display = 'none';
    if (frame && activeEmbeddedProgram) frame.src = 'about:blank';
    document.body.classList.remove('program-mode');
    activeEmbeddedProgram = null;
  }

  // ==========================================================================
  // 7. 모달 창 관리 (인수인계 총괄 / 개별 가이드 / 공지 모달)
  // ==========================================================================
  function initAnnualHub() {
    const hubModal = document.getElementById('annualHubModal');
    const openBtn = document.getElementById('openAnnualHubBtn');
    const closeBtn = document.getElementById('closeAnnualHubBtn');
    const confirmBtn = document.getElementById('confirmAnnualHubBtn');

    if (openBtn && hubModal) {
      openBtn.addEventListener('click', () => {
        renderAnnualHubTable();
        hubModal.classList.add('show');
      });
    }

    if (closeBtn && hubModal) {
      closeBtn.addEventListener('click', () => hubModal.classList.remove('show'));
    }

    if (confirmBtn && hubModal) {
      confirmBtn.addEventListener('click', () => hubModal.classList.remove('show'));
    }

    // 모달 바깥 배경 클릭 시 닫기
    window.addEventListener('click', (e) => {
      if (e.target === hubModal) hubModal.classList.remove('show');
    });
  }

  function renderAnnualHubTable() {
    const tbody = document.getElementById('annualHubTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const resetProgs = PROGRAMS.filter((p) => p.annualReset);

    resetProgs.forEach((prog) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${prog.department}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${prog.roleTag}</span></td>
        <td>
          <a href="${prog.launchUrl}" target="_blank" style="color:var(--primary); font-weight:700; text-decoration:none;">${prog.title}</a>
        </td>
        <td><span class="badge badge-reset" style="font-size:0.78rem;">${prog.resetRole}</span></td>
        <td>${prog.resetPeriod}<br><span style="font-size:0.75rem; color:var(--text-muted);">${prog.resetDifficulty}</span></td>
        <td style="text-align:center;">
          <button class="btn-guide-warn" style="padding:4px 8px; font-size:0.75rem;" data-hub-id="${prog.id}">3단계 가이드</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () => {
        openHandoverModal(prog);
      });

      tbody.appendChild(tr);
    });
  }

  function openHandoverModal(prog) {
    const modal = document.getElementById('handoverModal');
    if (!modal) return;

    document.getElementById('modalHandoverTitle').innerHTML = `🌸 [${prog.department}] ${prog.title} 인수인계 가이드`;

    const body = document.getElementById('modalHandoverBody');
    const guideSteps = prog.resetGuide
      ? prog.resetGuide.map((step) => `<div class="reset-step-item"><span>📌</span><div>${step}</div></div>`).join('')
      : '<p>등록된 세부 인수인계 가이드가 없습니다.</p>';

    body.innerHTML = `
      <div style="background:var(--bg-card-subtle); padding:14px 16px; border-radius:var(--radius-md); margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.86rem;">
          <span><strong>인수인계 대상:</strong> ${prog.resetRole}</span>
          <span style="color:var(--accent-warn-strong); font-weight:700;">소요시간: ${prog.resetDifficulty}</span>
        </div>
        <div style="font-size:0.86rem;"><strong>권장 세팅 시기:</strong> ${prog.resetPeriod}</div>
      </div>

      <div style="font-weight:700; margin-bottom:6px; color:var(--text-main);">📋 신학년도 필수 조치 3단계</div>
      <div class="reset-step-list">
        ${guideSteps}
      </div>

      <div style="margin-top:20px; display:flex; gap:10px;">
        <a href="${prog.launchUrl}" target="_blank" class="btn-launch-primary" style="flex:1;">
          🚀 프로그램 바로가기
        </a>
        <a href="${prog.manualFile}" target="_blank" class="btn-manual-secondary" style="flex:1;">
          📖 전체 매뉴얼 열기
        </a>
      </div>
    `;

    modal.classList.add('show');

    // 닫기 버튼들
    document.getElementById('closeHandoverModalBtn').onclick = () => modal.classList.remove('show');
    document.getElementById('modalHandoverCloseBtn').onclick = () => modal.classList.remove('show');
  }

  function openNoticeModal(notice) {
    const modal = document.getElementById('noticeModal');
    if (!modal) return;

    document.getElementById('noticeModalTitle').textContent = notice.title;
    document.getElementById('noticeModalBody').innerHTML = `
      <div style="display:flex; gap:12px; margin-bottom:14px; font-size:0.85rem; color:var(--text-muted); border-bottom:1px solid var(--border-light); padding-bottom:10px;">
        <span><strong>부서:</strong> ${notice.dept}</span>
        <span><strong>일자:</strong> ${notice.date}</span>
      </div>
      <div style="line-height:1.7; font-size:0.95rem; color:var(--text-main); white-space:pre-line;">
        ${notice.content}
      </div>
    `;

    modal.classList.add('show');

    document.getElementById('closeNoticeModalBtn').onclick = () => modal.classList.remove('show');
    document.getElementById('confirmNoticeModalBtn').onclick = () => modal.classList.remove('show');
  }

  // ==========================================================================
  // 8. 테마 (다크모드) 및 기타 이벤트
  // ==========================================================================
  function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    const savedTheme = localStorage.getItem('yg_theme') || 'light';
    setTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
      });
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('yg_theme', theme);
      if (theme === 'dark') {
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = '라이트모드';
      } else {
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = '다크모드';
      }
    }
  }

  // ==========================================================================
  // 앱 설치 (PWA): 화면 틀만 설치되고 자료는 매번 학교 계정 확인 후 받음
  // ==========================================================================
  function initInstall() {
    const installBtn = document.getElementById('installAppBtn');
    let deferredPrompt = null;
    const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[교무실ON] 앱 설치 준비 실패:', err));
    }
    if (!installBtn) return;
    if (isInstalled()) installBtn.style.display = 'none'; // 이미 앱으로 열었으면 버튼 숨김

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e; // 버튼을 누를 때 설치 창을 띄우기 위해 보관
    });
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (choice && choice.outcome === 'accepted') installBtn.style.display = 'none';
        return;
      }
      // 설치 창을 바로 띄울 수 없을 때(이미 설치됨, 크롬이 아직 준비 안 됨, 다른 브라우저 등) 방법 안내
      ask({
        title: '교무실ON을 앱으로 설치하는 방법',
        body: '<b>크롬·엣지</b>: 주소창 오른쪽의 <b>설치 아이콘(⊕ 또는 컴퓨터 모양)</b>을 누르거나,\n오른쪽 위 <b>⋮ 메뉴 › 전송, 저장, 공유 › 페이지를 앱으로 설치</b>를 누르세요.\n\n이미 설치했다면 바탕화면이나 시작 메뉴의 <b>교무실ON</b> 아이콘으로 열면 됩니다.',
        ok: '확인',
        info: true
      }, null);
    });
  }

  function setupGlobalEvents() {
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
      });
    }

    const closeProgramViewBtn = document.getElementById('closeProgramViewBtn');
    if (closeProgramViewBtn) {
      closeProgramViewBtn.addEventListener('click', () => {
        const previousDept = activeEmbeddedProgram ? activeEmbeddedProgram.department : null;
        document.body.classList.remove('sidebar-collapsed');
        if (previousDept) {
          openDepartmentPage(previousDept);
        } else {
          showDashboardHome();
        }
      });
    }

    const openProgramNewWindowBtn = document.getElementById('openProgramNewWindowBtn');
    if (openProgramNewWindowBtn) {
      openProgramNewWindowBtn.addEventListener('click', () => {
        if (activeEmbeddedProgram) {
          window.open(activeEmbeddedProgram.launchUrl, '_blank', 'noopener');
        }
      });
    }

    // 브랜드 로고 클릭 시 대시보드 홈
    const brandHomeBtn = document.getElementById('brandHomeBtn');
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener('click', () => showDashboardHome());
    }

    // 대시보드 트리 버튼 클릭
    const navDashBtn = document.getElementById('navDashboardMainBtn');
    if (navDashBtn) {
      navDashBtn.addEventListener('click', () => {
        const dashNode = document.getElementById('dashTreeNode');
        if (dashNode) dashNode.classList.toggle('expanded');
        showDashboardHome();
      });
    }

    // 대시보드 하위 메뉴 스크롤 이동
    document.querySelectorAll('#dashTreeNode .sub-nav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDashboardHome();
        const targetId = btn.getAttribute('data-scroll');
        if (targetId) {
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            setTimeout(() => {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
        }
      });
    });

    initInstall();
  }
});
