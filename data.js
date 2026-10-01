/**
 * YG 바이브 코딩 누리집 - 정규 데이터베이스
 * - 학교 10개 부서별 상세 업무 분장 안내 (각 부서 메인 화면용)
 * - 9월 / 10월 월별 달력용 학사 일정 데이터
 * - 부서별 전달 내용 및 공지사항
 * - 28개 프로그램 전체 데이터 및 신학년도 인수인계 정보
 */

// 1. 학교 지정 10개 부서 및 부서별 상세 업무 분장 안내
const DEPARTMENTS = [
  {
    id: '교무기획부',
    name: '교무기획부',
    icon: '📋',
    desc: '학사일정 총괄, 지필·수행평가 관리, 고사 및 감독 배정, 학기말 성적 사정 및 교무 행정 총괄',
    workSummary: [
      { role: '고사계', duty: '정기고사(1·2차 지필평가) 일정 수립, 출제원안 취합, 문제지 인쇄 및 감독 시간표 편성' },
      { role: '평가계', duty: '학기말 사정안 작성, 성적 처리 및 이의신청 접수, 교과우수상 및 각종 표창 심의' },
      { role: '학사일정계', duty: '연간 학사일정표 수립, 수업일수 및 시수 관리, 월별 학사 변경사항 교직원 공지' },
      { role: '나이스/교무계', duty: '나이스 교무업무시스템 관리, 학생 전출입 처리 및 학적부 관리' }
    ],
    handoverTip: '매년 2월 말 평가계 담당 교사는 [사정안 자동화 템플릿]을 복제하고, 고사계는 새 학년도 교원 명단을 [감독표]에 최신화해야 합니다.'
  },
  {
    id: '교육연구부',
    name: '교육연구부',
    icon: '📚',
    desc: '수업 및 평가 혁신 지원, 전문적 학습공동체 운영, 교원 직무연수 및 맞춤형 교원능력개발평가',
    workSummary: [
      { role: '연구기획계', duty: '학교 연구학교/자율학교 운영 계획 수립, 수업 나눔의 날 운영' },
      { role: '연수계', duty: '교직원 법정 의무연수 및 자율 직무연수 이수 현황 관리' },
      { role: '학습공동체계', duty: '교과별·주제별 전문적 학습공동체 팀 구성 및 연구비 정산 지원' }
    ],
    handoverTip: '학년도 초 전문적 학습공동체 등록 구글 폼 및 연구비 지원 서식을 최신화하여 배포합니다.'
  },
  {
    id: '학생안전인권부',
    name: '학생안전인권부',
    icon: '🛡️',
    desc: '학생 생활지도 및 인성 교육, 학교폭력 예방, 학생자치회 운영 및 안전망 구축',
    workSummary: [
      { role: '생활지도계', duty: '교내외 학생 용모·복장·지각 지도, 교문 지도 로테이션 편성' },
      { role: '학교폭력책임교사', duty: '학교폭력 사안 접수, 전담기구 심의 및 피해·가해학생 조치 이행' },
      { role: '학생자치계', duty: '학생회 정·부회장 선거 지원, 대의원회 및 학생 주도 교내 축제 운영' }
    ],
    handoverTip: '3월 첫 주 학생 생활규정 동의서 접수 및 교문 지도 교원 편성표를 조기에 확정합니다.'
  },
  {
    id: '교육과정부',
    name: '교육과정부',
    icon: '🎓',
    desc: '2022 개정 교육과정 및 고교학점제 운영, 2·3학년 선택과목 편성 및 과목 맞교환 관리',
    workSummary: [
      { role: '교육과정기획계', duty: '학교 교육과정 편제표 작성, 시도교육청 교육과정 심의 승인' },
      { role: '고교학점제계', duty: '학생 선택과목 수요조사, 수강신청 프로그램 운영 및 분반 편성' },
      { role: '교과서계', duty: '차기년도 교과용 도서 선정, 주문 및 신학기 교과서 배부' }
    ],
    handoverTip: '11~12월 선택과목 맞교환 기간에 [선택과목 맞교환 신청 관리] 폼을 오픈하고 분반 정원을 설정합니다.'
  },
  {
    id: '미래교육정보부',
    name: '미래교육정보부',
    icon: '💻',
    desc: '교내 정보화 인프라 구축, 전자칠판·스마트기기 유지보수, 전산 비품·기기 재물조사 및 AI·SW 교육',
    workSummary: [
      { role: '전산/네트워크계', duty: '스쿨넷 학내망 관리, 교실 무선 AP 점검 및 교원 PC 보급' },
      { role: '스마트기기/물품계', duty: '학생 1인 1디바이스(태블릿/크롬북) 대여 관리 및 학교 비품 물품대장 관리' },
      { role: '디지털교육계', duty: 'AI 디지털교과서(AIDT) 도입 준비 및 교원 디지털 역량 강화 지원' }
    ],
    handoverTip: '매 학년도 초 [물품관리현황] 시스템에서 실별 관리 교사 권한을 전보 교원에 맞게 재배정합니다.'
  },
  {
    id: '기숙사운영부',
    name: '기숙사운영부',
    icon: '🏠',
    desc: '기숙사생 선발 및 입·퇴사 관리, 일과 후 생활지도, 야간 안전관리 및 사생 자치회 운영',
    workSummary: [
      { role: '사생선발계', duty: '거리·성적·사회배려 기준 기숙사생 입사 선발 및 호실 배정' },
      { role: '생활지도계', duty: '점호, 야간 자율학습 출결 관리 및 귀가/외출외박 승인 처리' },
      { role: '시설안전계', duty: '기숙사 소방안전점검 및 방역 소독 점검' }
    ],
    handoverTip: '신학기 입사 전 호실 배정표 및 외출외박 관리 폼을 업데이트합니다.'
  },
  {
    id: '진로교육부',
    name: '진로교육부',
    icon: '🎯',
    desc: '진로·적성 검사, 대학생 멘토링, 직업인 초청 특강 및 1·2학년 맞춤형 진로 포트폴리오 구축',
    workSummary: [
      { role: '진로상담계', duty: '표준화 심리검사(MBTI, 홀랜드) 실시 및 개인 진로 상담' },
      { role: '진로체험계', duty: '교외 진로체험학습 인솔, 꿈찾기 캠프 및 진로의 날 행사 운영' }
    ],
    handoverTip: '학기 초 진로적성검사 일정 수립 및 외부 전문기관 일정을 조율합니다.'
  },
  {
    id: '1학년부',
    name: '1학년부',
    icon: '🌱',
    desc: '신입생 고등학교 적응 지도, 1학년 학급경영, 기초학력 보정 및 창의적 체험활동 운영',
    workSummary: [
      { role: '1학년 기획계', duty: '1학년 교과 및 창체 시수 운영, 1학년 행사 총괄' },
      { role: '신입생적응계', duty: '신입생 오리엔테이션 및 자기주도 학습 습관 형성 프로그램' },
      { role: '학습공부인증', duty: '학급별 공부 인증 앱을 통한 자기주도적 면학 분위기 조성' }
    ],
    handoverTip: '3월 초 신입생 반별 명렬표를 기반으로 학급별 학습 지원 도구를 연결합니다.'
  },
  {
    id: '2학년부',
    name: '2학년부',
    icon: '🌿',
    desc: '2학년 선택과목 맞춤형 학급경영, 진로 심화 역량 강화, 학력평가 분석 및 테마형 현장체험학습',
    workSummary: [
      { role: '2학년 기획계', duty: '2학년 교육활동 계획 수립 및 수학여행/수련활동 총괄' },
      { role: '학력관리계', duty: '전국연합학력평가 2학년 성적 분석 및 맞춤형 학습 상담' }
    ],
    handoverTip: '2학기 현장체험학습 안전요원 배치 및 계약 일정을 사전에 점검합니다.'
  },
  {
    id: '3학년부',
    name: '3학년부',
    icon: '🌟',
    desc: '대입 수시·정시 집중 진학지도, 모의고사 시행 및 분석, 고3 자율학습(웅지실) 및 입시 상담',
    workSummary: [
      { role: '진학기획계', duty: '수시/정시 배치표 분석, 대입 진학상담 프로그램(진학지도 통합) 운영' },
      { role: '자율학습관리계', duty: '웅지실/정독실 좌석 배정 및 QR 출결 자동관리 시스템 운영' },
      { role: '고사평가계', duty: '수능 모의평가 및 전국연합학력평가 시행, 교과협의록 제작 지원' }
    ],
    handoverTip: '3월 초 [진학지도 통합 프로그램]에 전년도 입시 데이터를 이관하고, [자기주도학습 시스템]의 좌석을 새로 배정합니다.'
  }
];

// 2. 월별 학사 일정 데이터 (2026년 9월 & 10월)
const CALENDAR_DATA = {
  '2026-09': {
    year: 2026,
    month: 9,
    monthName: '9월',
    daysInMonth: 30,
    startDayOfWeek: 2, // 화요일(2)부터 1일 시작
    events: [
      { date: 2, title: '2학기 학교설명회 및 상담주간', dept: '교무기획부', isImportant: false },
      { date: 8, title: '수업ON 2학기 진도표 등록 마감', dept: '교무기획부', isImportant: false },
      { date: 15, title: '9월 전국연합학력평가(고1·2·3)', dept: '3학년부', isImportant: true },
      { date: 18, title: '대입 수시모집 원서접수 마감', dept: '3학년부', isImportant: true },
      { date: 24, title: '1차 지필평가 출제원안 제출 마감', dept: '교무기획부', isImportant: true },
      { date: 26, title: '정기시험 감독표 1차 확인', dept: '교무기획부', isImportant: false },
      { date: 30, title: '문제지 봉투 표지 일괄 출력 주간', dept: '교무기획부', isImportant: false }
    ]
  },
  '2026-10': {
    year: 2026,
    month: 10,
    monthName: '10월',
    daysInMonth: 31,
    startDayOfWeek: 4, // 목요일(4)부터 1일 시작
    events: [
      { date: 2, title: '10월 전국연합학력평가 실시', dept: '교무기획부', isImportant: true },
      { date: 9, title: '한글날 (공휴일)', dept: '공통', isImportant: false },
      { date: 14, title: '2학기 1차 지필평가 시작 (1일차)', dept: '교무기획부', isImportant: true },
      { date: 15, title: '1차 지필평가 (2일차)', dept: '교무기획부', isImportant: true },
      { date: 16, title: '1차 지필평가 (3일차)', dept: '교무기획부', isImportant: true },
      { date: 17, title: '1차 지필평가 종료 (4일차)', dept: '교무기획부', isImportant: true },
      { date: 23, title: '지필평가 성적 확인 및 교과협의록 제출', dept: '교무기획부', isImportant: false },
      { date: 28, title: '선택과목 맞교환 사전 안내', dept: '교육과정부', isImportant: false },
      { date: 30, title: '차기년도 선택과목 1차 수요조사', dept: '교육과정부', isImportant: true }
    ]
  }
};

// 3. 부서별 전달 내용 및 공지사항
const NOTICE_ITEMS = [
  {
    id: 'n1',
    dept: '교무기획부',
    date: '2026.09.25',
    title: '2학기 1차 지필평가 문제지 봉투 표지 출력 도구 업데이트',
    content: '문제지 봉투 표지 출력 도구(정보과 김OO 제작)에 절취선 정확도 개선 및 인쇄 여백 자동 맞춤 기능이 적용되었습니다. 시험 전 교무기획부 탭에서 바로 출력 가능합니다.',
    badge: '중요'
  },
  {
    id: 'n2',
    dept: '3학년부',
    date: '2026.09.22',
    title: '진학지도 통합 프로그램 수시 지원 데이터 동기화 완료 안내',
    content: '고3 수시 원서 접수 현황이 진학지도 통합 프로그램에 전산 동기화되었습니다. 담임 선생님들께서는 학생별 접수 내역 및 면접 일정을 스마트폰 웹앱으로 확인해 주시기 바랍니다.',
    badge: '안내'
  },
  {
    id: 'n3',
    dept: '미래교육정보부',
    date: '2026.09.20',
    title: '물품관리현황 특별실 기자재 정기 점검 실시 안내',
    content: '2학기 특별실(컴퓨터실, 과학실, 어학실) 비품 재물 점검을 진행합니다. 관리실 담당 선생님께서는 시스템에서 이상 여부를 체크해 주시기 바랍니다.',
    badge: '점검'
  },
  {
    id: 'n4',
    dept: '교육과정부',
    date: '2026.09.18',
    title: '차기년도 2·3학년 선택과목 맞교환 사전 수요조사 준비',
    content: '10월 말 진행 예정인 선택과목 맞교환 신청 프로그램을 사전 점검 중입니다. 개설 과목 변동 사항이 있는 교과에서는 교육과정부로 사전 전달 바랍니다.',
    badge: '일반'
  }
];

// 4. programs.csv 28개 프로그램 전체 데이터
const PROGRAMS = [
  // --- 교무기획부 (7개) ---
  {
    id: 'prog-001',
    category: 'work',
    title: '사정안 자동화 프로그램',
    department: '교무기획부',
    roleTag: '정보과 · 김OO',
    summary: '학기말 사정안 작성 및 교과우수상 사료 수집 업무를 디지털화하여 10분 만에 완성',
    description: '사정안 자동화 시스템은 학기말 사정안 작성 및 교과우수상 자료 수집 업무를 디지털화하여 담임교사·교과교사의 입력 작업과 관리자의 취합·출력 업무를 효율화하는 웹 기반 시스템입니다. 관리자는 시스템 설정과 제출 현황 관리를, 담임교사는 재적 현황과 표창 대상자 입력을, 교과교사는 나이스 성적 우수자 파일 업로드를 담당하며, 최종 데이터는 CSV로 내보내 한글(HWP) 문서로 자동 생성됩니다.',
    launchType: 'URL',
    launchUrl: 'https://m.site.naver.com/2bb1e',
    manualFile: '사정안 자동화 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 교무기획부 평가담당 교사',
    resetPeriod: '매년 2월 말 ~ 3월 첫 주',
    resetDifficulty: '보통 (약 15분)',
    resetGuide: [
      '1단계: 구글 드라이브의 원본 [사정안 템플릿 스프레드시트] 사본을 새로 생성합니다.',
      '2단계: 새 학년도 교과목명, 단위수, 과목별 교과우수상 수여 비율(조례/규정)을 수정합니다.',
      '3단계: 시스템 설정 창에 새로 생성한 구글 시트 URL을 입력하고 연결을 확인합니다.'
    ],
    tags: ['사정안', '성적우수', '나이스연동'],
    updatedAt: '2026-08-10'
  },
  {
    id: 'prog-003',
    category: 'work',
    title: '정기시험 감독표',
    department: '교무기획부',
    roleTag: '정보과 김OO',
    summary: '교사들이 정기시험 감독 시간표를 웹에서 바로 확인할 수 있도록 제공하는 카운트다운 시간표',
    description: '교사들이 정기시험 감독 시간표를 웹에서 바로 확인할 수 있도록 제공하는 프로그램입니다. 지정한 공개 시간 전에는 카운트다운 타이머가 표시되고, 시간이 되면 교시별 감독 배정표가 자동으로 열립니다. 이름 검색으로 본인 감독 시간을 빠르게 찾을 수 있고, 시간표가 변경되면 알림 버튼이 떠서 최신 정보로 새로고침할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://m.site.naver.com/26gu4',
    manualFile: '정기시험 감독표 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 교무기획부 고사계 담당 교사',
    resetPeriod: '매 학기 1·2차 지필평가 2주 전',
    resetDifficulty: '쉬움 (약 10분)',
    resetGuide: [
      '1단계: 구글 시트의 [교원 명단 및 제외 사유] 시트에 당해 학년도 전체 교원 명단을 최신화합니다.',
      '2단계: 시험 시간표 및 학년별 학급 수를 입력합니다.',
      '3단계: [감독표 생성] 버튼을 눌러 결과 웹 링크를 교직원에게 공유합니다.'
    ],
    tags: ['지필평가', '감독표', '시간표'],
    updatedAt: '2026-07-02'
  },
  {
    id: 'prog-029',
    category: 'work',
    title: '시험감독 배정 프로그램',
    department: '교무기획부',
    roleTag: '교무기획부 · 고사계',
    summary: '시험 일정과 교원 정보를 바탕으로 정기시험 감독 배정표를 편성하는 프로그램',
    description: '정기시험 일정과 교원 명단, 배정 조건을 바탕으로 시험감독 배정표를 작성하고 조정하는 Google Apps Script 기반 프로그램입니다.',
    launchType: 'EMBED',
    launchUrl: 'https://script.google.com/a/macros/yanggok.hs.kr/s/AKfycbxrMd_Tm0ZdRp8GXZzrESZtnxGLQnQTeuOAmvW4RL1T6JIlHE1vzOxNR1weMawsrYxO/exec',
    manualFile: '',
    annualReset: true,
    resetRole: '교무기획부 고사계 담당 교사',
    resetPeriod: '매 학기 지필평가 감독 편성 전',
    resetDifficulty: '확인 필요',
    resetGuide: [
      '1단계: 당해 학년도 교원 명단과 감독 제외 조건을 확인합니다.',
      '2단계: 시험 일정, 교시, 학급 및 고사실 정보를 입력합니다.',
      '3단계: 배정 결과를 검토한 뒤 정기시험 감독표 조회 프로그램에 반영합니다.'
    ],
    tags: ['시험감독', '감독배정', '지필평가'],
    updatedAt: '2026-09-29'
  },
  {
    id: 'prog-018',
    category: 'work',
    title: '모의고사 감독표',
    department: '교무기획부',
    roleTag: '정보과 · 김OO',
    summary: '구글 시트 모의고사(학력평가) 감독 시간표를 웹으로 조회하고 교사별 배정 칸 강조',
    description: '구글 시트에 작성된 모의고사(전국연합학력평가) 감독시간표를 그대로 웹 화면으로 옮겨 보여주는 조회 프로그램입니다. 시트의 색상과 셀 병합, 서식을 그대로 재현하며, 교사 이름을 검색하면 해당 교사의 감독 배정 칸이 강조 표시됩니다.',
    launchType: 'URL',
    launchUrl: 'https://m.site.naver.com/28X3W',
    manualFile: '모의고사 감독표 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 교무기획부 / 모의고사 담당 교사',
    resetPeriod: '모의고사 시행 1주 전',
    resetDifficulty: '쉬움 (약 10분)',
    resetGuide: [
      '1단계: 당해 연도 학년별 학급 수 및 교실 위치를 지정합니다.',
      '2단계: 감독 교원 명단 및 듣기평가 방송실 담당 교사를 지정합니다.',
      '3단계: 웹 시간표 링크를 배포합니다.'
    ],
    tags: ['모의고사', '학력평가', '감독표'],
    updatedAt: '2026-03-15'
  },
  {
    id: 'prog-019',
    category: 'study',
    title: '과목이수 체크리스트',
    department: '교육과정부',
    roleTag: '정보과 · 김OO',
    summary: '2022 개정 교육과정 고교학점제 학생별 1~3학년 필수 이수 기준 및 174학점 점검',
    description: '2022 개정 교육과정 고교학점제에 따라 학생이 1~3학년 학기별로 이수할 과목을 선택하고, 학점과 교과(군)별 필수 이수 기준 충족 여부를 자동으로 확인할 수 있는 체크리스트 웹앱입니다. 필수 과목은 자동 반영되고 선택 과목만 체크하면 되며, 졸업에 필요한 총 174학점 달성 여부를 실시간으로 점검할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://ygmaster2.github.io/selection',
    manualFile: '과목이수 체크리스트 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 사용',
    resetPeriod: '수시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['학생이 직접 브라우저에서 체크하여 사용하는 도구입니다.'],
    tags: ['고교학점제', '174학점', '이수체크'],
    updatedAt: '2026-04-10'
  },
  {
    id: 'prog-024',
    category: 'work',
    title: '문제지 봉투 표지 양식 출력 도구',
    department: '교육연구부',
    roleTag: '정보과 · 김OO',
    summary: '정기시험 문제지 봉투에 붙이는 표지를 시험 정보와 교실별 인원만 입력하면 자동 인쇄',
    description: '정기시험 문제지 봉투에 붙이는 표지를 시험 정보와 교실별 인원만 입력하면 자동으로 만들어 인쇄해주는 도구입니다. 절취선 정확도 개선 및 인쇄 여백 자동 보정 기능이 탑재되어 있습니다.',
    launchType: 'EMBED',
    launchUrl: '문제지 봉투 표지 양식 출력.html',
    manualFile: '문제지 봉투 표지 양식 출력 도구 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 사용 (인쇄/평가 지원)',
    resetPeriod: '시험 기간',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['시험 때마다 과목명과 학생 수만 입력하고 즉시 인쇄하시면 됩니다.'],
    tags: ['문제지봉투', '시험표지', '인쇄양식'],
    updatedAt: '2026-09-02',
    updateNote: '절취선 정확도 개선, 프린터 여백 자동 보정, 과목 자동입력 기능 추가'
  },
  {
    id: 'prog-025',
    category: 'work',
    title: '행운의 뽑기',
    department: '교무기획부',
    roleTag: '정보과 · 김OO',
    summary: '스크래치 카드를 긁듯 당첨 여부를 확인하는 온라인 추첨 웹앱 및 명단 관리',
    description: '행운의 뽑기 딱지판에서 원하는 번호를 골라 스크래치 카드를 긁듯 당첨 여부를 확인하는 온라인 추첨 웹앱입니다. 명단 준비·사전 등록·현장 즉석 참여 세 가지 방식을 모두 지원하며, 경품 등록부터 당첨번호 생성, 실시간 참여 현황 확인까지 관리자 화면 하나로 운영할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://docs.google.com/spreadsheets/d/1c7hGY-egHAO83QlLT7IuZjXkZf65bJap619au8SfSZY/copy',
    manualFile: '행운의 뽑기 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 활용',
    resetPeriod: '행사 시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['링크를 열어 본인의 구글 드라이브에 시트 사본을 복제한 뒤 사용하시면 됩니다.'],
    tags: ['추첨', '이벤트', '행운의뽑기'],
    updatedAt: '2026-08-23',
    updateNote: '행운의 뽑기 프로그램 추가'
  },
  {
    id: 'prog-028',
    category: 'work',
    title: '수업ON',
    department: '교육연구부',
    roleTag: '정보과 · 김OO',
    summary: '수업 시간표·단원별 진도·출결·수업일지·수업 참여 기록(자리배치·토큰) 통합 운영',
    description: '수업 시간표·단원별 진도·출결·수업일지·수업 참여 기록(자리 배치·토큰·행운의 뽑기)까지 한 화면에서 관리하는 수업 운영 웹앱입니다. 구글 스프레드시트 사본을 만들어 웹앱으로 배포하기만 하면 별도 설치 없이 바로 사용할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://docs.google.com/spreadsheets/d/1oiXU0W8TEz1yFOxmdgUQSk5k6ZNEDqHekZ-7g2i67dA/copy',
    manualFile: '수업ON 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 활용',
    resetPeriod: '학기 초',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['구글 스프레드시트 사본을 생성하여 본인 수업에 맞게 웹앱으로 배포해 사용합니다.'],
    tags: ['수업운영', '시간표', '진도관리', '출결'],
    updatedAt: '2026-09-18',
    updateNote: '최종 배포'
  },

  // --- 교육과정부 (1개) ---
  {
    id: 'prog-004',
    category: 'work',
    title: '선택과목 맞교환 신청 관리',
    department: '교육과정부',
    roleTag: '사회과 · 이O찬',
    summary: '학생들의 2·3학년 선택과목 맞교환 신청을 등록부터 1:1 매칭 및 승인까지 한 번에 관리',
    description: '학생들의 선택과목 맞교환 신청을 등록부터 승인까지 한 번에 관리하는 웹 기반 프로그램입니다. 두 학생의 정보와 현재 과목을 입력하면 맞교환 신청이 자동 등록되고, 신청 현황 확인·일괄 승인/반려, 과목별·반별·학생별 통계까지 확인할 수 있습니다. 별도 설치나 로그인 없이 브라우저에서 바로 사용합니다.',
    launchType: '폴더',
    launchUrl: '맞교환_사이드바방식.html',
    manualFile: '맞교환_사이드바방식 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 교육과정부 선택과목 담당 교사',
    resetPeriod: '매년 11월 ~ 12월 (과목선택 집중기)',
    resetDifficulty: '보통 (약 20분)',
    resetGuide: [
      '1단계: 차기년도 개설 선택과목 코드 및 과목별 분반 최대 정원표를 업데이트합니다.',
      '2단계: 신청 접수 시작일과 마감일을 지정합니다.',
      '3단계: 학생 배포용 맞교환 신청 링크를 활성화합니다.'
    ],
    tags: ['고교학점제', '선택과목', '과목교환'],
    updatedAt: '2026-06-25'
  },

  // --- 미래교육정보부 (2개) ---
  {
    id: 'prog-005',
    category: 'study',
    title: '스마트폰 과의존 자가진단',
    department: '미래교육정보부',
    roleTag: '사회과 · 유OO',
    summary: '청소년 스마트폰 과의존 관찰척도(S-척도) 10문항 학생 익명 자가진단 및 맞춤 조언',
    description: '청소년 스마트폰 과의존 관찰척도(S-척도) 10문항으로, 학생 스스로 스마트폰 사용 습관을 점검해볼 수 있는 자가진단 웹앱입니다. 답변을 마치면 총점과 세부 요인별 점수를 확인하고 맞춤 조언을 안내받습니다.',
    launchType: '폴더',
    launchUrl: '스마트폰 과의존 자가진단.html',
    manualFile: '스마트폰 과의존 자가진단 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 사용',
    resetPeriod: '연중 상시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['로그인이나 데이터 저장 없이 익명으로 진행되는 자가진단 툴입니다.'],
    tags: ['스마트폰', '자가진단', '생활지도'],
    updatedAt: '2026-05-12'
  },
  {
    id: 'prog-017',
    category: 'work',
    title: '물품관리현황',
    department: '미래교육정보부',
    roleTag: '정보과 · 이OO',
    summary: '학교 각 관리실(교실·특별실·사무실) 비품·물품 등록 및 담당자별 권한 관리',
    description: '학교 각 관리실(교실·특별실·사무실 등)의 비품·물품을 등록하고 현황을 관리하는 시스템입니다. 담당자별로 관리실 권한이 배정되어 있어 본인이 담당하는 곳의 물품만 조회·수정할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://script.google.com/macros/s/AKfycbzLr39hIm_GX46XKn9lzYMoTvyZ32IP4iLoHKaDdLMdb3OUdhbQuGHLX7aci89ZzSJb/exec',
    manualFile: '물품관리현황 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 관리 (비품/물품 담당)',
    resetPeriod: '연중 상시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['신규 물품 취득이나 불용 처리 시 시스템에서 바로 수정합니다.'],
    tags: ['비품관리', '물품현황', '교구관리'],
    updatedAt: '2026-05-30'
  },

  // --- 1학년부 (1개) ---
  {
    id: 'prog-002',
    category: 'study',
    title: '공부 인증 앱',
    department: '1학년부',
    roleTag: '사회과 · 이O영',
    summary: '학급 친구들과 함께 공부 시간을 인증하고 응원 피드를 남기는 실시간 공부 인증 웹앱',
    description: '학급 친구들과 함께 공부 시간을 인증하고 응원하는 실시간 공부 인증 웹앱입니다. 요일별 공부 스케줄을 등록하고 사진과 한마디로 공부 인증을 남기면, 친구들의 인증 피드를 실시간으로 확인하고 댓글로 서로 응원할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://peaceful-phoenix-ae5c2b.netlify.app/',
    manualFile: '공부 인증 앱 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 사용',
    resetPeriod: '연중 상시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['학급별로 링크를 공유하여 자율적으로 운영합니다.'],
    tags: ['공부인증', '학급피드', '자기주도학습'],
    updatedAt: '2026-05-18'
  },

  // --- 3학년부 (5개) ---
  {
    id: 'prog-015',
    category: 'work',
    title: '진학지도 통합 프로그램',
    department: '3학년부',
    roleTag: '국어과 · 유O호',
    summary: '고3 모의고사 성적·내신·개인정보·대학정보·수시 지원 현황·상담 기록 원스톱 통합 관리',
    description: '고3 학생들의 모의고사 성적·내신·개인정보·대학정보·수시 지원 현황·상담 기록을 한 곳에서 통합 관리하는 진학지도 시스템입니다. 진학부는 데이터를 업로드하고, 담임·교과 교사는 스마트폰 웹앱으로 반별·과목별 성적표와 성적 추이를 조회할 수 있습니다.',
    launchType: 'URL',
    launchUrl: 'https://script.google.com/macros/s/AKfycbxkV41783GZjY-zQRP1U1WQkv0FXTGseebW5a1Qq0HMZCHHIoWcyS2dOWEwPJ5T6_Ot/exec',
    manualFile: '진학지도 통합 프로그램 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 3학년부 진학기획 담당 교사',
    resetPeriod: '매년 3월 초',
    resetDifficulty: '보통 (약 30분)',
    resetGuide: [
      '1단계: 전년도 3학년 대입 최종 합불 데이터 시트를 아카이브하고 새 시트를 연결합니다.',
      '2단계: 당해 연도 고3 학생 명렬표 및 모의고사 성적 기준표를 갱신합니다.',
      '3단계: 3학년 담임 교사 권한을 새 학년도 계정으로 변경합니다.'
    ],
    tags: ['진학지도', '대입상담', '수시정시', '모의고사'],
    updatedAt: '2026-04-12'
  },
  {
    id: 'prog-016',
    category: 'work',
    title: '자기주도학습 통합관리 시스템',
    department: '3학년부',
    roleTag: '국어과 · 유O호',
    summary: '자투리 자율학습, 야자, 웅지실 이용까지 시간대별 출결을 QR·GPS로 자동 관리',
    description: '등교 전 자투리 자율학습, 방과 후 야간자율학습, 일과 중 웅지실 이용까지 시간대별 자율학습 출결을 QR(학번 입력)과 GPS 위치 인증으로 자동 관리하는 시스템입니다. 실시간 좌석 배치도와 누적 순위표를 제공합니다.',
    launchType: 'URL',
    launchUrl: 'https://url.kr/dfcjxv',
    manualFile: '자기주도학습 통합관리 시스템 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 자율학습(정독실) 담당 교사',
    resetPeriod: '매 학년도 3월 둘째 주',
    resetDifficulty: '쉬움 (약 15분)',
    resetGuide: [
      '1단계: 웅지실/정독실 좌석 번호 배치도를 새 학년도 구성에 맞게 확인합니다.',
      '2단계: 1학기 자습 신청 학생 명단(학번, 이름, 좌석번호)을 엑셀로 일괄 업로드합니다.',
      '3단계: 일자별 감독 교사 로테이션 명단을 등록합니다.'
    ],
    tags: ['자율학습', '야간자율학습', '출결관리', 'QR인증'],
    updatedAt: '2026-06-08'
  },
  {
    id: 'prog-020',
    category: 'work',
    title: '전문대 수시 검색기',
    department: '3학년부',
    roleTag: '국어과 · 유O호',
    summary: '전국 전문대학 수시모집 정보 검색 및 학생 내신 자동 환산 합격 진단',
    description: '전국 전문대학의 수시모집 정보를 학생이 조건별로 검색하고, 로그인한 학생 본인의 내신 성적을 대학별 산출방식에 맞춰 자동으로 환산해 합격 가능성을 진단해주는 웹 시스템입니다.',
    launchType: 'URL',
    launchUrl: 'https://script.google.com/macros/s/AKfycbysyD8ZKw1Ss8OK1J7pGGoj5-7yClQkoCiuWtYlydAaQ5yW7Cc1O-NDnDBYNa6P7_A/exec',
    manualFile: '전문대 수시 검색기 매뉴얼.html',
    annualReset: true,
    resetRole: '새 학년도 3학년부 진학상담 교사',
    resetPeriod: '매년 8월 말 (수시 접수 전)',
    resetDifficulty: '보통 (약 20분)',
    resetGuide: [
      '1단계: 당해 연도 전문대 수시 모집요강 및 대학별 내신 산출 기준 데이터를 시트에 업로드합니다.',
      '2단계: 학생 내신 산출 공식 검증 후 활성화합니다.'
    ],
    tags: ['전문대', '수시모집', '내신환산', '합격진단'],
    updatedAt: '2026-07-15'
  },
  {
    id: 'prog-021',
    category: 'work',
    title: '정기시험 결과분석 및 활용 방안 교과협의록 제작툴',
    department: '3학년부',
    roleTag: '국어과 · 유O호',
    summary: '스프레드시트에 자료를 입력하는 것만으로 협의록 한글(HWPX) 문서 자동 완성',
    description: '정기시험 후 작성해야 하는 "결과분석 및 활용방안 교과협의록"을 구글 스프레드시트에 자료를 입력·업로드하는 것만으로 한글(HWPX) 문서로 자동 완성해주는 프로그램입니다.',
    launchType: 'URL',
    launchUrl: 'https://docs.google.com/spreadsheets/d/1IpDTZBen6KFJ9ilBW7Qat8L_NuwcrnzVJLVerNnjlWs/edit?usp=sharing',
    manualFile: '정기시험 결과분석 교과협의록 자동화 매뉴얼.html',
    annualReset: true,
    resetRole: '교무기획부 평가계 / 각 교과 대표 교사',
    resetPeriod: '매 지필평가 성적 마감 후',
    resetDifficulty: '쉬움 (약 10분)',
    resetGuide: [
      '1단계: 구글 스프레드시트 템플릿 사본을 생성합니다.',
      '2단계: 지필평가 과목별 문항 분석 및 협의 내용을 입력하고 HWPX 다운로드를 실행합니다.'
    ],
    tags: ['교과협의록', '결과분석', '한글문서자동화'],
    updatedAt: '2026-05-20'
  },
  {
    id: 'prog-023',
    category: 'study',
    title: '2028 권장이수교과 · 과목선택 도우미',
    department: '3학년부',
    roleTag: '국어과 · 유O호',
    summary: '학년별 편제표 확인, 희망 대학 권장과목 색상 표시 및 필수 이수학점 자동 검증',
    description: '학생이 본인 학년의 교육과정 편제표를 확인하면서 희망 대학·학과의 핵심·권장과목을 편제표 위에 색으로 표시해주고, 실제로 선택할 과목을 클릭해 고르면 필수 이수학점 충족 여부까지 자동으로 확인해주는 과목선택 도우미 웹앱입니다.',
    launchType: 'URL',
    launchUrl: 'https://script.google.com/macros/s/AKfycbzB77ohKShoPkkei78jFoLJW4ZGJnp3wz2kh0ttvCNdwmy6LouXQ_vpy0HOoLhut2Sw/exec',
    manualFile: '2028 권장이수교과 · 과목선택 도우미 매뉴얼.html',
    annualReset: false,
    resetRole: '상시 사용',
    resetPeriod: '진로상담 시',
    resetDifficulty: '초기화 불필요',
    resetGuide: ['학생 개별 진로 상담 시 웹앱을 열어 활용합니다.'],
    tags: ['2028대입', '권장이수과목', '과목선택'],
    updatedAt: '2026-06-20'
  }
];
