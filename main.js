// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || 'guest';
let users = JSON.parse(localStorage.getItem('users')) || {};
let plannerData = {};
let isGuest = (currentUser === 'guest');

let currentDate = new Date();
let selectedDate = new Date();

const holidays = {
    "1-1": "신정", "2-9": "설날", "2-10": "설날", "2-11": "설날", "2-12": "대체공휴일",
    "3-1": "삼일절", "4-10": "국회의원선거", "5-5": "어린이날", "5-6": "대체공휴일",
    "5-15": "부처님오신날", "6-6": "현충일", "8-15": "광복절", "9-16": "추석",
    "9-17": "추석", "9-18": "추석", "10-3": "개천절", "10-9": "한글날", "12-25": "성탄절"
};

function init() {
    updateUIState();
    loadUserData();
    renderCalendar();
    updateDetailView();
    setupEventListeners();
}

// 섹션 전환 (모바일 탭)
window.switchSection = (sectionId) => {
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (sectionId === 'calendar-section') document.getElementById('nav-calendar').classList.add('active');
    else document.getElementById('nav-detail').classList.add('active');
};

function updateUIState() {
    const loginNavBtn = document.getElementById('login-nav-btn');
    const profileBtn = document.getElementById('profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userWelcome = document.getElementById('user-welcome');
    const trialBadge = document.getElementById('trial-badge');

    if (currentUser === 'guest') {
        isGuest = true;
        loginNavBtn.style.display = 'block';
        profileBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        userWelcome.textContent = "방문자님";
        trialBadge.style.display = 'inline-block';
    } else {
        isGuest = false;
        loginNavBtn.style.display = 'none';
        profileBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        userWelcome.textContent = users[currentUser].profile?.nickname || currentUser;
        trialBadge.style.display = 'none';
    }
}

function getDataKey() {
    if (isGuest) return 'plannerData_guest';
    const partner = users[currentUser].partner;
    if (partner && users[partner]) {
        const ids = [currentUser, partner].sort();
        return `plannerData_couple_${ids[0]}_${ids[1]}`;
    }
    return `plannerData_${currentUser}`;
}

function loadUserData() {
    plannerData = JSON.parse(localStorage.getItem(getDataKey())) || {};
}

function saveData() {
    localStorage.setItem(getDataKey(), JSON.stringify(plannerData));
}

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('current-month-year').textContent = `${year}년 ${month + 1}월`;
    
    ['일','월','화','수','목','금','토'].forEach((day, idx) => {
        const h = document.createElement('div');
        h.className = 'day-header';
        if (idx === 0) h.style.color = '#ff4d4d';
        if (idx === 6) h.style.color = '#4d94ff';
        h.textContent = day;
        calendarEl.appendChild(h);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    
    for (let i = 1; i <= lastDate; i++) {
        const d = document.createElement('div');
        d.className = 'day'; d.textContent = i;
        const dateObj = new Date(year, month, i);
        const dayOfWeek = dateObj.getDay();
        const holidayKey = `${month + 1}-${i}`;
        
        if (dayOfWeek === 0) d.classList.add('sunday');
        if (dayOfWeek === 6) d.classList.add('saturday');
        if (holidays[holidayKey]) {
            d.classList.add('holiday');
            const hName = document.createElement('span');
            hName.className = 'holiday-name'; hName.textContent = holidays[holidayKey];
            d.appendChild(hName);
        }

        const dataKey = `${year}-${month + 1}-${i}`;
        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) d.classList.add('today');
        if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) d.classList.add('selected');
        if (plannerData[dataKey] && (plannerData[dataKey].schedules?.length > 0 || plannerData[dataKey].expenses?.length > 0)) d.classList.add('has-data');
        
        d.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar();
            updateDetailView();
            switchSection('detail-section'); // 날짜 클릭 시 상세 내역으로 이동
        });
        calendarEl.appendChild(d);
    }
    updateMonthlyTotal();
}

function updateDetailView() {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    document.getElementById('selected-date-display').textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
    document.getElementById('day-of-week').textContent = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][selectedDate.getDay()];
    
    const data = plannerData[key] || { schedules: [], expenses: [] };
    
    const sList = document.getElementById('schedule-list');
    sList.innerHTML = '';
    (data.schedules || []).forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${key}', 'schedules', ${i})"><i class="fas fa-times"></i></button>`;
        sList.appendChild(li);
    });

    const eList = document.getElementById('expense-list');
    eList.innerHTML = '';
    let total = 0;
    (data.expenses || []).forEach((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteItem('${key}', 'expenses', ${i})"><i class="fas fa-times"></i></button></span>`;
        eList.appendChild(li);
        total += e.amount;
    });
    document.getElementById('daily-total-amount').textContent = total.toLocaleString();
}

window.deleteItem = (key, type, i) => {
    plannerData[key][type].splice(i, 1);
    saveData(); renderCalendar(); updateDetailView();
};

function updateMonthlyTotal() {
    let total = 0;
    const prefix = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-`;
    for (let k in plannerData) if (k.startsWith(prefix)) (plannerData[k].expenses || []).forEach(e => total += e.amount);
    document.getElementById('total-monthly-expense').textContent = total.toLocaleString();
}

window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.updateProfile = () => {
    const nick = document.getElementById('display-name').value;
    users[currentUser].profile = { nickname: nick };
    localStorage.setItem('users', JSON.stringify(users));
    location.reload();
};

window.linkCouple = () => {
    const pId = document.getElementById('partner-id').value;
    if (!users[pId]) return alert('존재하지 않는 사용자입니다.');
    users[currentUser].partner = pId;
    users[pId].partner = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    location.reload();
};

function setupEventListeners() {
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = e.target.username.value;
        const pw = e.target.password.value;
        // 로그인/회원가입 로직 (기존과 동일)
        if (users[id] && users[id].password === pw) {
            localStorage.setItem('currentUser', id);
            location.reload();
        } else {
            // 회원가입 모드일 경우 처리 등...
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.setItem('currentUser', 'guest');
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
    input.value = ''; saveData(); updateDetailView();
}

function addExpense() {
    const desc = document.getElementById('expense-desc');
    const amt = document.getElementById('expense-amount');
    if (!desc.value || !amt.value) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].expenses.push({ desc: desc.value, amount: parseInt(amt.value) });
    desc.value = ''; amt.value = ''; saveData(); updateDetailView();
}

init();
