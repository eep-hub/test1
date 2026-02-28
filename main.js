// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let plannerData = {};
let viewUser = currentUser; // 현재 보고 있는 데이터의 소유자

let currentDate = new Date();
let selectedDate = new Date();

// DOM 요소
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const signupFields = document.getElementById('signup-fields');
const findPwBtn = document.getElementById('find-pw-btn');
const logoutBtn = document.getElementById('logout-btn');
const userWelcome = document.getElementById('user-welcome');
const coupleViewToggle = document.getElementById('couple-view-toggle');
const viewMineBtn = document.getElementById('view-mine');
const viewPartnerBtn = document.getElementById('view-partner');

let isLoginMode = true;

// 초기화
function init() {
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
    setupEventListeners();
}

// 비밀번호 유효성 검사 (특수문자, 영어, 숫자 포함 8자 이상)
function validatePassword(pw) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pw);
}

function showAuth() {
    authOverlay.style.display = 'flex';
    signupFields.style.display = 'none';
    findPwBtn.style.display = 'block';
}

function showApp() {
    authOverlay.style.display = 'none';
    viewUser = currentUser;
    
    const userProfile = users[currentUser].profile || { nickname: currentUser };
    userWelcome.textContent = `${userProfile.nickname}님의 다이어리`;
    
    loadUserData();
    checkCoupleStatus();
    renderCalendar();
    updateDetailView();
}

function loadUserData() {
    const dataKey = `plannerData_${viewUser}`;
    plannerData = JSON.parse(localStorage.getItem(dataKey)) || {};
}

function checkCoupleStatus() {
    const partner = users[currentUser].partner;
    if (partner && users[partner]) {
        coupleViewToggle.style.display = 'flex';
        document.getElementById('couple-status').textContent = `연동된 파트너: ${partner}`;
        document.getElementById('partner-id').value = partner;
    } else {
        coupleViewToggle.style.display = 'none';
    }
}

// 모달 제어
window.openModal = (id) => {
    document.getElementById(id).style.display = 'flex';
    if (id === 'profile-overlay') {
        document.getElementById('display-name').value = users[currentUser].profile?.nickname || '';
    }
};
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

// 프로필 업데이트
window.updateProfile = () => {
    const nick = document.getElementById('display-name').value;
    if (!nick) return alert('닉네임을 입력하세요.');
    
    users[currentUser].profile = { nickname: nick };
    localStorage.setItem('users', JSON.stringify(users));
    userWelcome.textContent = `${nick}님의 다이어리`;
    alert('프로필이 저장되었습니다.');
};

// 커플 연동
window.linkCouple = () => {
    const pId = document.getElementById('partner-id').value;
    if (pId === currentUser) return alert('자기 자신과는 연동할 수 없습니다.');
    if (!users[pId]) return alert('존재하지 않는 아이디입니다.');
    
    users[currentUser].partner = pId;
    users[pId].partner = currentUser; // 상호 연동
    
    localStorage.setItem('users', JSON.stringify(users));
    checkCoupleStatus();
    alert(`${pId}님과 연동되었습니다!`);
};

// 이벤트 리스너 설정
function setupEventListeners() {
    // 테마/모드 전환
    authSwitchBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? '로그인' : '회원가입';
        authSubmitBtn.textContent = isLoginMode ? '로그인' : '회원가입';
        signupFields.style.display = isLoginMode ? 'none' : 'block';
        findPwBtn.style.display = isLoginMode ? 'block' : 'none';
        document.getElementById('switch-text').textContent = isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?';
        authSwitchBtn.textContent = isLoginMode ? '회원가입' : '로그인';
    });

    // 로그인/회원가입 제출
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = e.target.username.value;
        const pw = e.target.password.value;
        const ans = document.getElementById('security-answer').value;

        if (isLoginMode) {
            if (users[id] && users[id].password === pw) {
                currentUser = id;
                localStorage.setItem('currentUser', id);
                showApp();
            } else {
                alert('아이디 또는 비밀번호가 틀렸습니다.');
            }
        } else {
            if (users[id]) return alert('이미 존재하는 아이디입니다.');
            if (!validatePassword(pw)) return alert('비밀번호가 정책에 맞지 않습니다.\n(특수문자, 영어, 숫자 포함 8자 이상)');
            if (!ans) return alert('보안 질문 답변을 입력해주세요.');

            users[id] = { password: pw, securityAnswer: ans, partner: null, profile: { nickname: id } };
            localStorage.setItem('users', JSON.stringify(users));
            alert('회원가입 완료! 로그인해주세요.');
            authSwitchBtn.click();
        }
    });

    // 비밀번호 찾기
    document.getElementById('find-pw-btn').addEventListener('click', () => openModal('find-pw-overlay'));
    document.getElementById('find-pw-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('find-username').value;
        const ans = document.getElementById('find-answer').value;
        
        if (users[id] && users[id].securityAnswer === ans) {
            alert(`${id}님의 비밀번호는 [ ${users[id].password} ] 입니다.`);
            closeModal('find-pw-overlay');
        } else {
            alert('정보가 일치하지 않습니다.');
        }
    });

    // 뷰 전환 (내 데이터 vs 파트너 데이터)
    viewMineBtn.addEventListener('click', () => {
        viewUser = currentUser;
        viewMineBtn.classList.add('active');
        viewPartnerBtn.classList.remove('active');
        toggleInputAbility(true);
        loadUserData();
        renderCalendar();
        updateDetailView();
    });

    viewPartnerBtn.addEventListener('click', () => {
        viewUser = users[currentUser].partner;
        viewPartnerBtn.classList.add('active');
        viewMineBtn.classList.remove('active');
        toggleInputAbility(false); // 파트너 데이터는 조회만 가능
        loadUserData();
        renderCalendar();
        updateDetailView();
    });

    function toggleInputAbility(canEdit) {
        document.getElementById('schedule-input-area').style.display = canEdit ? 'flex' : 'none';
        document.getElementById('expense-input-area').style.display = canEdit ? 'flex' : 'none';
        // 삭제 버튼 등도 가려짐 (updateDetailView에서 처리)
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        location.reload();
    });

    // 달력 네비게이션
    document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    
    document.getElementById('add-schedule-btn').addEventListener('click', addSchedule);
    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
}

// 달력 & 상세 뷰 로직 (수정됨: viewUser 기준)
const calendarEl = document.getElementById('calendar');
const currentMonthYearEl = document.getElementById('current-month-year');
const selectedDateDisplay = document.getElementById('selected-date-display');
const dayOfWeekEl = document.getElementById('day-of-week');
const scheduleListEl = document.getElementById('schedule-list');
const expenseListEl = document.getElementById('expense-list');
const dailyTotalEl = document.getElementById('daily-total-amount');
const monthlyTotalEl = document.getElementById('total-monthly-expense');

function renderCalendar() {
    calendarEl.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    currentMonthYearEl.textContent = `${year}년 ${month + 1}월`;
    
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(day => {
        const h = document.createElement('div'); h.className = 'day-header'; h.textContent = day; calendarEl.appendChild(h);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    
    for (let i = 1; i <= lastDate; i++) {
        const d = document.createElement('div');
        d.className = 'day'; d.textContent = i;
        const key = `${year}-${month + 1}-${i}`;
        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) d.classList.add('today');
        if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) d.classList.add('selected');
        if (plannerData[key] && (plannerData[key].schedules.length > 0 || plannerData[key].expenses.length > 0)) d.classList.add('has-data');
        
        d.addEventListener('click', () => { selectedDate = new Date(year, month, i); renderCalendar(); updateDetailView(); });
        calendarEl.appendChild(d);
    }
    updateMonthlyTotal();
}

function updateDetailView() {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    selectedDateDisplay.textContent = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
    dayOfWeekEl.textContent = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][selectedDate.getDay()];
    
    const data = plannerData[key] || { schedules: [], expenses: [] };
    const canEdit = (viewUser === currentUser);

    scheduleListEl.innerHTML = '';
    data.schedules.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span>` + (canEdit ? `<button class="delete-btn" onclick="deleteItem('${key}', 'schedules', ${i})"><i class="fas fa-times"></i></button>` : '');
        scheduleListEl.appendChild(li);
    });

    expenseListEl.innerHTML = '';
    let total = 0;
    data.expenses.forEach((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 ` + (canEdit ? `<button class="delete-btn" onclick="deleteItem('${key}', 'expenses', ${i})"><i class="fas fa-times"></i></button></span>` : '</span>');
        expenseListEl.appendChild(li);
        total += e.amount;
    });
    dailyTotalEl.textContent = total.toLocaleString();
}

window.deleteItem = (key, type, i) => {
    if (viewUser !== currentUser) return;
    plannerData[key][type].splice(i, 1);
    saveData(); renderCalendar(); updateDetailView();
};

function saveData() { localStorage.setItem(`plannerData_${currentUser}`, JSON.stringify(plannerData)); }

function updateMonthlyTotal() {
    let total = 0;
    const prefix = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-`;
    for (let k in plannerData) if (k.startsWith(prefix)) plannerData[k].expenses.forEach(e => total += e.amount);
    monthlyTotalEl.textContent = `${total.toLocaleString()}원`;
}

function addSchedule() {
    const input = document.getElementById('schedule-input');
    if (!input.value || viewUser !== currentUser) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].schedules.push(input.value);
    input.value = ''; saveData(); renderCalendar(); updateDetailView();
}

function addExpense() {
    const desc = document.getElementById('expense-desc');
    const amt = document.getElementById('expense-amount');
    if (!desc.value || !amt.value || viewUser !== currentUser) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].expenses.push({ desc: desc.value, amount: parseInt(amt.value) });
    desc.value = ''; amt.value = ''; saveData(); renderCalendar(); updateDetailView();
}

init();
