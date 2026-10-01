/**
 * YG 바이브 코딩 누리집 (YGVIBE) 메인 애플리케이션 스크립트
 */

// ============================================================================
// 교무실ON 설정
// ----------------------------------------------------------------------------
// 공개용 GAS 웹 앱 주소 (교무실ON 공용 시트를 읽는 스크립트, "모든 사용자"로 배포)
// 비워두면 data.js에 적어둔 기본 일정을 보여줍니다.
// ============================================================================
const PORTAL_API_URL = 'https://script.google.com/macros/s/AKfycbxFCDXHt_CeflpQbnBAGWRGY5vc6ZdLHsX3QOXpMRKAJn8cgeuB9T39XThkfYq2R5aT-w/exec';
const CALENDAR_CACHE_KEY = 'gyomusilon_calendar_v1';

document.addEventListener('DOMContentLoaded', () => {
  // 상태 변수
  let currentMonth = toYearMonth(new Date());
  let calendarEvents = [];
  let currentProgFilter = 'all';
  let currentProgSearch = '';
  let currentNoticeFilter = 'all';
  let activeEmbeddedProgram = null;

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
    calendarEvents = loadInitialCalendarEvents();
    renderCalendar();
    refreshCalendarFromSheet();
  }

  function renderCalendar() {
    renderMonthNav();
    renderCalendarGrid();
  }

  // --- 데이터 불러오기 ---------------------------------------------------------
  // 1) 브라우저에 저장해둔 일정이 있으면 먼저 그걸로 바로 그리고
  // 2) 뒤에서 시트(공개용 GAS)에 최신 일정을 요청해서, 받아오면 다시 그림
  // 3) 둘 다 없으면 data.js의 기본 일정을 보여줌
  function loadInitialCalendarEvents() {
    const cached = readCalendarCache();
    if (cached) {
      setCalendarStatus(`저장된 일정 · ${formatStamp(cached.savedAt)}`);
      return cached.events;
    }
    setCalendarStatus(PORTAL_API_URL ? '일정 불러오는 중…' : '기본 일정 (시트 연결 전)');
    return getFallbackCalendarEvents();
  }

  function refreshCalendarFromSheet() {
    if (!PORTAL_API_URL) return;
    fetch(`${PORTAL_API_URL}?type=calendar`)
      .then((res) => res.json())
      .then((json) => {
        if (!json || !Array.isArray(json.events)) {
          throw new Error((json && json.error) || '응답 형식이 올바르지 않습니다.');
        }
        calendarEvents = json.events;
        writeCalendarCache(json.events);
        setCalendarStatus(`시트와 동기화됨 · ${formatStamp(Date.now())}`);
        renderCalendar();
      })
      .catch((err) => {
        console.warn('[교무실ON] 학사일정 불러오기 실패:', err);
        setCalendarStatus(readCalendarCache() ? '연결 실패 · 저장된 일정 표시 중' : '연결 실패 · 기본 일정 표시 중');
      });
  }

  function getFallbackCalendarEvents() {
    if (typeof CALENDAR_DATA === 'undefined') return [];
    const list = [];
    Object.values(CALENDAR_DATA).forEach((m) => {
      (m.events || []).forEach((e) => {
        list.push({
          date: `${m.year}-${pad2(m.month)}-${pad2(e.date)}`,
          title: e.title,
          dept: e.dept || '공통',
          isImportant: !!e.isImportant
        });
      });
    });
    return list;
  }

  function readCalendarCache() {
    try {
      const raw = localStorage.getItem(CALENDAR_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && Array.isArray(obj.events) ? obj : null;
    } catch (e) {
      return null;
    }
  }

  function writeCalendarCache(events) {
    try {
      localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), events }));
    } catch (e) {
      /* 저장소를 쓸 수 없는 환경이면 그냥 넘어감 */
    }
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

    // 인수인계 카운터 업데이트
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

    // PWA 앱 설치 버튼
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        alert('💡 브라우저 주소창 우측의 [설치] 버튼을 클릭하거나, Ctrl+D로 즐겨찾기에 등록하시면 바로가기 앱처럼 편리하게 사용하실 수 있습니다.');
      });
    }
  }
});
