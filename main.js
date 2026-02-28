// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let plannerData = {};
let isGuest = false;

let currentDate = new Date();
let selectedDate = new Date();

// DOM 요소
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const signupFields = document.getElementById('signup-fields');
const userWelcome = document.getElementById('user-welcome');
const coupleBadge = document.getElementById('couple-badge');
const logoutBtn = document.getElementById('logout-btn');

function init() {
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
    setupEventListeners();
}

function showAuth() {
    authOverlay.style.display = 'flex';
}

window.guestMode = () => {
    isGuest = true;
    currentUser = 'guest';
    authOverlay.style.display = 'none';
    userWelcome.textContent = "방문자 체험 모드 (저장되지 않음)";
    document.getElementById('profile-btn').style.display = 'none';
    loadUserData();
    renderCalendar();
    updateDetailView();
};

function showApp() {
    isGuest = false;
    authOverlay.style.display = 'none';
    document.getElementById('profile-btn').style.display = 'flex';
    
    const nick = users[currentUser].profile?.nickname || currentUser;
    userWelcome.textContent = `${nick}님의 다이어리`;
    
    loadUserData();
    renderCalendar();
    updateDetailView();
}

// 데이터 키 결정 (커플이면 공유 키 사용)
function getDataKey() {
    if (isGuest) return 'plannerData_guest';
    const partner = users[currentUser].partner;
    if (partner && users[partner]) {
        // 아이디 순서대로 정렬하여 공통 키 생성
        const ids = [currentUser, partner].sort();
        return `plannerData_couple_${ids[0]}_${ids[1]}`;
    }
    return `plannerData_${currentUser}`;
}

function loadUserData() {
    const key = getDataKey();
    plannerData = JSON.parse(localStorage.getItem(key)) || {};
    
    // 커플 배지 표시 여부
    if (!isGuest && users[currentUser].partner) {
        coupleBadge.style.display = 'inline-flex';
    } else {
        coupleBadge.style.display = 'none';
    }
}

function saveData() {
    const key = getDataKey();
    localStorage.setItem(key, JSON.stringify(plannerData));
}

// 달력 & 상세 뷰 (동일 로직)
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
        if (plannerData[key] && (plannerData[key].schedules?.length > 0 || plannerData[key].expenses?.length > 0)) d.classList.add('has-data');
        
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

    scheduleListEl.innerHTML = '';
    (data.schedules || []).forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${key}', 'schedules', ${i})"><i class="fas fa-times"></i></button>`;
        scheduleListEl.appendChild(li);
    });

    expenseListEl.innerHTML = '';
    let total = 0;
    (data.expenses || []).forEach((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteItem('${key}', 'expenses', ${i})"><i class="fas fa-times"></i></button></span>`;
        expenseListEl.appendChild(li);
        total += e.amount;
    });
    dailyTotalEl.textContent = total.toLocaleString();
}

window.deleteItem = (key, type, i) => {
    plannerData[key][type].splice(i, 1);
    saveData(); renderCalendar(); updateDetailView();
};

function updateMonthlyTotal() {
    let total = 0;
    const prefix = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-`;
    for (let k in plannerData) if (k.startsWith(prefix)) (plannerData[k].expenses || []).forEach(e => total += e.amount);
    monthlyTotalEl.textContent = `${total.toLocaleString()}원`;
}

// 모달 제어
window.openModal = (id) => {
    document.getElementById(id).style.display = 'flex';
    if (id === 'profile-overlay') {
        document.getElementById('display-name').value = users[currentUser].profile?.nickname || '';
        document.getElementById('partner-id').value = users[currentUser].partner || '';
        document.getElementById('couple-status').textContent = users[currentUser].partner ? `연동된 파트너: ${users[currentUser].partner}` : "연동된 파트너가 없습니다.";
    }
};
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.updateProfile = () => {
    const nick = document.getElementById('display-name').value;
    if (!nick) return alert('닉네임을 입력하세요.');
    users[currentUser].profile = { nickname: nick };
    localStorage.setItem('users', JSON.stringify(users));
    userWelcome.textContent = `${nick}님의 다이어리`;
    alert('프로필이 저장되었습니다.');
};

window.linkCouple = () => {
    const pId = document.getElementById('partner-id').value;
    if (pId === currentUser) return alert('본인과는 연동할 수 없습니다.');
    if (!users[pId]) return alert('존재하지 않는 사용자입니다.');
    
    users[currentUser].partner = pId;
    users[pId].partner = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    loadUserData();
    renderCalendar();
    updateDetailView();
    alert(`${pId}님과 연동되어 이제 일정을 함께 관리합니다!`);
};

// 비밀번호 정책 검사
function validatePassword(pw) {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pw);
}

function setupEventListeners() {
    let isLoginMode = true;
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    
    authSwitchBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? '로그인' : '회원가입';
        document.getElementById('auth-submit-btn').textContent = isLoginMode ? '로그인' : '회원가입';
        signupFields.style.display = isLoginMode ? 'none' : 'block';
        document.getElementById('switch-text').textContent = isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?';
        authSwitchBtn.textContent = isLoginMode ? '회원가입' : '로그인';
    });

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
            } else { alert('정보가 틀렸습니다.'); }
        } else {
            if (users[id]) return alert('중복된 아이디입니다.');
            if (!validatePassword(pw)) return alert('보안 정책을 확인하세요.');
            users[id] = { password: pw, securityAnswer: ans, partner: null, profile: { nickname: id } };
            localStorage.setItem('users', JSON.stringify(users));
            alert('가입 완료! 로그인하세요.');
            authSwitchBtn.click();
        }
    });

    document.getElementById('find-pw-btn').addEventListener('click', () => openModal('find-pw-overlay'));
    document.getElementById('find-pw-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('find-username').value;
        const ans = document.getElementById('find-answer').value;
        if (users[id] && users[id].securityAnswer === ans) {
            alert(`비밀번호: ${users[id].password}`);
            closeModal('find-pw-overlay');
        } else { alert('답변이 틀렸습니다.'); }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        location.reload();
    });

    document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('add-schedule-btn').addEventListener('click', addSchedule);
    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
}

function addSchedule() {
    const input = document.getElementById('schedule-input');
    if (!input.value) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].schedules.push(input.value);
    input.value = ''; saveData(); renderCalendar(); updateDetailView();
}

function addExpense() {
    const desc = document.getElementById('expense-desc');
    const amt = document.getElementById('expense-amount');
    if (!desc.value || !amt.value) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].expenses.push({ desc: desc.value, amount: parseInt(amt.value) });
    desc.value = ''; amt.value = ''; saveData(); renderCalendar(); updateDetailView();
}

init();
