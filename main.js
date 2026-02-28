// 데이터 관리 상태
let currentUser = localStorage.getItem('currentUser') || null;
let plannerData = {};
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentDate = new Date();
let selectedDate = new Date();

// DOM 요소
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authDesc = document.getElementById('auth-desc');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const switchText = document.getElementById('switch-text');
const logoutBtn = document.getElementById('logout-btn');
const userWelcome = document.getElementById('user-welcome');

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

function showAuth() {
    authOverlay.style.display = 'flex';
}

function showApp() {
    authOverlay.style.display = 'none';
    userWelcome.textContent = `${currentUser}님의 다이어리`;
    loadUserData();
    renderCalendar();
    updateDetailView();
}

function loadUserData() {
    const dataKey = `plannerData_${currentUser}`;
    plannerData = JSON.parse(localStorage.getItem(dataKey)) || {};
}

// 달력 관련 (이전 코드와 동일하되 plannerData 사용)
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
        const header = document.createElement('div');
        header.classList.add('day-header');
        header.textContent = day;
        calendarEl.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    
    for (let i = 1; i <= lastDate; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');
        dayEl.textContent = i;
        const dateKey = `${year}-${month + 1}-${i}`;
        
        if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) dayEl.classList.add('today');
        if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) dayEl.classList.add('selected');
        if (plannerData[dateKey] && (plannerData[dateKey].schedules.length > 0 || plannerData[dateKey].expenses.length > 0)) dayEl.classList.add('has-data');
        
        dayEl.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar();
            updateDetailView();
        });
        calendarEl.appendChild(dayEl);
    }
    updateMonthlyTotal();
}

function updateDetailView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const dayName = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][selectedDate.getDay()];
    
    selectedDateDisplay.textContent = `${year}년 ${month}월 ${date}일`;
    dayOfWeekEl.textContent = dayName;
    
    const dateKey = `${year}-${month}-${date}`;
    const data = plannerData[dateKey] || { schedules: [], expenses: [] };
    
    scheduleListEl.innerHTML = '';
    data.schedules.forEach((s, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${dateKey}', 'schedules', ${idx})"><i class="fas fa-times"></i></button>`;
        scheduleListEl.appendChild(li);
    });
    
    expenseListEl.innerHTML = '';
    let dailyTotal = 0;
    data.expenses.forEach((e, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${e.desc}</span><span>${e.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteItem('${dateKey}', 'expenses', ${idx})"><i class="fas fa-times"></i></button></span>`;
        expenseListEl.appendChild(li);
        dailyTotal += e.amount;
    });
    dailyTotalEl.textContent = dailyTotal.toLocaleString();
}

window.deleteItem = (dateKey, type, index) => {
    plannerData[dateKey][type].splice(index, 1);
    saveData();
    renderCalendar();
    updateDetailView();
};

function saveData() {
    const dataKey = `plannerData_${currentUser}`;
    localStorage.setItem(dataKey, JSON.stringify(plannerData));
}

function updateMonthlyTotal() {
    let total = 0;
    const currentMonthPrefix = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-`;
    for (let key in plannerData) {
        if (key.startsWith(currentMonthPrefix)) {
            plannerData[key].expenses.forEach(e => total += e.amount);
        }
    }
    monthlyTotalEl.textContent = `${total.toLocaleString()}원`;
}

// 이벤트 리스너
function setupEventListeners() {
    authSwitchBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? '로그인' : '회원가입';
        authDesc.textContent = isLoginMode ? '다이어리를 이용하려면 로그인해주세요' : '새로운 계정을 만들어보세요';
        authSubmitBtn.textContent = isLoginMode ? '로그인' : '회원가입';
        switchText.textContent = isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?';
        authSwitchBtn.textContent = isLoginMode ? '회원가입' : '로그인';
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        if (isLoginMode) {
            if (users[username] && users[username] === password) {
                currentUser = username;
                localStorage.setItem('currentUser', currentUser);
                showApp();
            } else {
                alert('아이디 또는 비밀번호가 일치하지 않습니다.');
            }
        } else {
            if (users[username]) {
                alert('이미 존재하는 아이디입니다.');
            } else {
                users[username] = password;
                localStorage.setItem('users', JSON.stringify(users));
                alert('회원가입이 완료되었습니다! 로그인해주세요.');
                isLoginMode = true;
                authSwitchBtn.click();
            }
        }
        e.target.reset();
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showAuth();
    });

    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('add-schedule-btn').addEventListener('click', addSchedule);
    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
}

function addSchedule() {
    const input = document.getElementById('schedule-input');
    if (!input.value) return;
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[dateKey]) plannerData[dateKey] = { schedules: [], expenses: [] };
    plannerData[dateKey].schedules.push(input.value);
    input.value = '';
    saveData();
    renderCalendar();
    updateDetailView();
}

function addExpense() {
    const desc = document.getElementById('expense-desc');
    const amount = document.getElementById('expense-amount');
    if (!desc.value || !amount.value) return;
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    if (!plannerData[dateKey]) plannerData[dateKey] = { schedules: [], expenses: [] };
    plannerData[dateKey].expenses.push({ desc: desc.value, amount: parseInt(amount.value) });
    desc.value = '';
    amount.value = '';
    saveData();
    renderCalendar();
    updateDetailView();
}

init();
