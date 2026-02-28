// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || 'guest';
let users = JSON.parse(localStorage.getItem('users')) || {};
let plannerData = {};
let isGuest = (currentUser === 'guest');

let currentDate = new Date();
let selectedDate = null; // 초기에는 선택된 날짜 없음

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
    setupEventListeners();
}

function updateUIState() {
    const loginBtn = document.getElementById('login-nav-btn');
    const profileBtn = document.getElementById('profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const trialBadge = document.getElementById('trial-badge');
    const userWelcome = document.getElementById('user-welcome');

    if (isGuest) {
        loginBtn.style.display = 'block';
        profileBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        trialBadge.style.display = 'inline-block';
        userWelcome.textContent = "방문자님";
    } else {
        loginBtn.style.display = 'none';
        profileBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        trialBadge.style.display = 'none';
        userWelcome.textContent = users[currentUser].profile?.nickname || currentUser;
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
    
    // 요일 헤더
    ['일','월','화','수','목','금','토'].forEach(day => {
        const h = document.createElement('div'); h.className = 'day-header'; h.textContent = day;
        if (day === '일') h.style.color = '#ff4d4d';
        if (day === '토') h.style.color = '#4d94ff';
        calendarEl.appendChild(h);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    // 빈 칸
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    
    // 날짜 생성
    for (let i = 1; i <= lastDate; i++) {
        const d = document.createElement('div');
        d.className = 'day';
        const dateObj = new Date(year, month, i);
        const dayOfWeek = dateObj.getDay();
        const dateKey = `${year}-${month + 1}-${i}`;
        const holidayKey = `${month + 1}-${i}`;

        if (holidays[holidayKey]) {
            const h = document.createElement('span'); h.className = 'holiday-name'; h.textContent = holidays[holidayKey];
            d.appendChild(h); d.classList.add('holiday');
        }

        const dNum = document.createElement('span'); dNum.textContent = i; d.appendChild(dNum);
        if (dayOfWeek === 0) d.classList.add('sunday');
        if (dayOfWeek === 6) d.classList.add('saturday');
        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) d.classList.add('today');
        
        // 요약 정보
        const summary = document.createElement('div'); summary.className = 'day-summary';
        const dayData = plannerData[dateKey];
        if (dayData) {
            if (dayData.schedules?.length > 0) summary.innerHTML += '<div class="summary-dot"></div>';
            if (dayData.expenses?.length > 0) {
                const total = dayData.expenses.reduce((a, c) => a + c.amount, 0);
                summary.innerHTML += `<span class="summary-amount">${total > 9999 ? (total/10000).toFixed(1)+'만' : total.toLocaleString()}</span>`;
            }
        }
        d.appendChild(summary);

        if (selectedDate && year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) {
            d.classList.add('selected');
        }

        d.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar();
        });
        calendarEl.appendChild(d);

        // 선택된 날짜의 주(row)가 끝나는 지점에 인라인 상세창 삽입
        const isSelectedInThisWeek = selectedDate && 
                                   selectedDate.getFullYear() === year && 
                                   selectedDate.getMonth() === month && 
                                   selectedDate.getDate() === i;
        
        // 주의 마지막 날(토요일)이거나 월의 마지막 날인 경우
        if (selectedDate && (dayOfWeek === 6 || i === lastDate)) {
            // 현재 주에 선택된 날짜가 포함되어 있는지 확인
            const weekStart = i - dayOfWeek;
            const weekEnd = i;
            if (selectedDate.getDate() >= weekStart && selectedDate.getDate() <= weekEnd && selectedDate.getMonth() === month) {
                injectInlineDetail(calendarEl);
            }
        }
    }
    updateMonthlyTotal();
}

function injectInlineDetail(parent) {
    const template = document.getElementById('detail-template');
    const clone = template.content.cloneNode(true);
    const detailEl = clone.querySelector('.inline-detail');
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const dateKey = `${year}-${month}-${date}`;
    const data = plannerData[dateKey] || { schedules: [], expenses: [] };

    detailEl.querySelector('.detail-date').textContent = `${month}월 ${date}일 상세내역`;
    
    // 일정 리스트
    const sList = detailEl.querySelector('.s-list');
    data.schedules.forEach((s, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${dateKey}', 'schedules', ${idx})">&times;</button>`;
        sList.appendChild(li);
    });

    // 가계부 리스트
    const eList = detailEl.querySelector('.e-list');
    let dailyTotal = 0;
    data.expenses.forEach((e, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteItem('${dateKey}', 'expenses', ${idx})">&times;</button></span>`;
        eList.appendChild(li);
        dailyTotal += e.amount;
    });
    detailEl.querySelector('.d-total-amt').textContent = dailyTotal.toLocaleString();

    // 버튼 이벤트 연결
    detailEl.querySelector('.add-s-btn').onclick = () => {
        const input = detailEl.querySelector('.schedule-in');
        if (!input.value) return;
        if (!plannerData[dateKey]) plannerData[dateKey] = { schedules: [], expenses: [] };
        plannerData[dateKey].schedules.push(input.value);
        saveData(); renderCalendar();
    };

    detailEl.querySelector('.add-e-btn').onclick = () => {
        const desc = detailEl.querySelector('.exp-desc-in');
        const amt = detailEl.querySelector('.exp-amt-in');
        if (!desc.value || !amt.value) return;
        if (!plannerData[dateKey]) plannerData[dateKey] = { schedules: [], expenses: [] };
        plannerData[dateKey].expenses.push({ desc: desc.value, amount: parseInt(amt.value) });
        saveData(); renderCalendar();
    };

    parent.appendChild(detailEl);
}

window.closeDetail = () => {
    selectedDate = null;
    renderCalendar();
};

window.deleteItem = (key, type, idx) => {
    plannerData[key][type].splice(idx, 1);
    saveData(); renderCalendar();
};

function updateMonthlyTotal() {
    let total = 0;
    const prefix = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-`;
    for (let k in plannerData) if (k.startsWith(prefix)) (plannerData[k].expenses || []).forEach(e => total += e.amount);
    document.getElementById('total-monthly-expense').textContent = total.toLocaleString();
}

// 모달 및 기타 설정 (이전과 유사)
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

function setupEventListeners() {
    document.getElementById('prev-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); selectedDate = null; renderCalendar(); };
    document.getElementById('next-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); selectedDate = null; renderCalendar(); };
    
    document.getElementById('auth-form').onsubmit = (e) => {
        e.preventDefault();
        const id = e.target.username.value;
        const pw = e.target.password.value;
        if (users[id] && users[id].password === pw) {
            localStorage.setItem('currentUser', id);
            location.reload();
        } else alert('정보가 올바르지 않습니다.');
    };

    document.getElementById('logout-btn').onclick = () => {
        localStorage.setItem('currentUser', 'guest');
        location.reload();
    };
}

init();
