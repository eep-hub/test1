// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || 'guest';
let users = JSON.parse(localStorage.getItem('users')) || {};
let plannerData = {};
let isGuest = (currentUser === 'guest');

let currentDate = new Date();
let selectedDate = null;

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
    const logoutBtn = document.getElementById('logout-btn');
    const trialBadge = document.getElementById('trial-badge');
    const userWelcome = document.getElementById('user-welcome');

    if (isGuest) {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        trialBadge.style.display = 'inline-block';
        userWelcome.textContent = "방문자님";
    } else {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
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
    
    ['일','월','화','수','목','금','토'].forEach(day => {
        const h = document.createElement('div'); h.className = 'day-header'; h.textContent = day;
        if (day === '일') h.style.color = '#ff4d4d';
        if (day === '토') h.style.color = '#4d94ff';
        calendarEl.appendChild(h);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    
    for (let i = 1; i <= lastDate; i++) {
        const d = document.createElement('div');
        d.className = 'day';
        const dateKey = `${year}-${month + 1}-${i}`;
        const holidayKey = `${month + 1}-${i}`;
        const dayOfWeek = new Date(year, month, i).getDay();

        if (holidays[holidayKey]) {
            const h = document.createElement('span'); h.className = 'holiday-name'; h.textContent = holidays[holidayKey];
            d.appendChild(h);
        }

        const dNum = document.createElement('span'); dNum.textContent = i; d.appendChild(dNum);
        if (dayOfWeek === 0) d.classList.add('sunday');
        if (dayOfWeek === 6) d.classList.add('saturday');
        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) d.classList.add('today');
        
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
            document.getElementById('floating-add-btn').style.display = 'block';
            renderCalendar();
        });
        calendarEl.appendChild(d);

        if (selectedDate && (dayOfWeek === 6 || i === lastDate)) {
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
    
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const dateKey = `${selectedDate.getFullYear()}-${month}-${date}`;
    const data = plannerData[dateKey] || { schedules: [], expenses: [] };

    detailEl.querySelector('.detail-date').textContent = `${month}월 ${date}일 내역`;
    
    const sList = detailEl.querySelector('.s-list');
    data.schedules.forEach((s, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${dateKey}', 'schedules', ${idx})">&times;</button>`;
        sList.appendChild(li);
    });

    const eList = detailEl.querySelector('.e-list');
    let dailyTotal = 0;
    data.expenses.forEach((e, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteItem('${dateKey}', 'expenses', ${idx})">&times;</button></span>`;
        eList.appendChild(li);
        dailyTotal += e.amount;
    });
    detailEl.querySelector('.d-total-amt').textContent = dailyTotal.toLocaleString();

    parent.appendChild(detailEl);
}

// 모달 제어
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.openAddModal = () => {
    if (!selectedDate) return;
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    document.getElementById('add-item-title').textContent = `${month}월 ${date}일 기록하기`;
    openModal('add-item-overlay');
};

window.switchAddTab = (type) => {
    document.getElementById('tab-s').classList.toggle('active', type === 's');
    document.getElementById('tab-e').classList.toggle('active', type === 'e');
    document.getElementById('form-s').style.display = type === 's' ? 'flex' : 'none';
    document.getElementById('form-e').style.display = type === 'e' ? 'flex' : 'none';
};

window.handleAddSchedule = () => {
    const input = document.getElementById('s-input');
    if (!input.value) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].schedules.push(input.value);
    input.value = ''; saveData(); renderCalendar(); closeModal('add-item-overlay');
};

window.handleAddExpense = () => {
    const desc = document.getElementById('e-desc-input');
    const amt = document.getElementById('e-amt-input');
    if (!desc.value || !amt.value) return;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[key]) plannerData[key] = { schedules: [], expenses: [] };
    plannerData[key].expenses.push({ desc: desc.value, amount: parseInt(amt.value) });
    desc.value = ''; amt.value = ''; saveData(); renderCalendar(); closeModal('add-item-overlay');
};

window.closeDetail = () => {
    selectedDate = null;
    document.getElementById('floating-add-btn').style.display = 'none';
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

function setupEventListeners() {
    document.getElementById('prev-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); closeDetail(); };
    document.getElementById('next-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); closeDetail(); };
    document.getElementById('logout-btn').onclick = () => { localStorage.setItem('currentUser', 'guest'); location.reload(); };
}

init();
