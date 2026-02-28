// 데이터 관리 상태
let currentDate = new Date();
let selectedDate = new Date();
let plannerData = JSON.parse(localStorage.getItem('plannerData')) || {};

// DOM 요소
const calendarEl = document.getElementById('calendar');
const currentMonthYearEl = document.getElementById('current-month-year');
const selectedDateDisplay = document.getElementById('selected-date-display');
const dayOfWeekEl = document.getElementById('day-of-week');
const scheduleListEl = document.getElementById('schedule-list');
const expenseListEl = document.getElementById('expense-list');
const dailyTotalEl = document.getElementById('daily-total-amount');
const monthlyTotalEl = document.getElementById('total-monthly-expense');

// 초기화
function init() {
    renderCalendar();
    updateDetailView();
    setupEventListeners();
}

// 달력 렌더링
function renderCalendar() {
    calendarEl.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthYearEl.textContent = `${year}년 ${month + 1}월`;
    
    // 요일 헤더
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.classList.add('day-header');
        header.textContent = day;
        calendarEl.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    // 공백
    for (let i = 0; i < firstDay; i++) {
        calendarEl.appendChild(document.createElement('div'));
    }
    
    // 날짜
    for (let i = 1; i <= lastDate; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');
        dayEl.textContent = i;
        
        const dateKey = `${year}-${month + 1}-${i}`;
        
        // 오늘 표시
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // 선택된 날짜 표시
        if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) {
            dayEl.classList.add('selected');
        }
        
        // 데이터가 있는 날 표시
        if (plannerData[dateKey] && (plannerData[dateKey].schedules.length > 0 || plannerData[dateKey].expenses.length > 0)) {
            dayEl.classList.add('has-data');
        }
        
        dayEl.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar();
            updateDetailView();
        });
        
        calendarEl.appendChild(dayEl);
    }
    
    updateMonthlyTotal();
}

// 상세 뷰 업데이트
function updateDetailView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const dayName = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][selectedDate.getDay()];
    
    selectedDateDisplay.textContent = `${year}년 ${month}월 ${date}일`;
    dayOfWeekEl.textContent = dayName;
    
    const dateKey = `${year}-${month}-${date}`;
    const data = plannerData[dateKey] || { schedules: [], expenses: [] };
    
    // 일정 렌더링
    scheduleListEl.innerHTML = '';
    data.schedules.forEach((s, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s}</span><button class="delete-btn" onclick="deleteItem('${dateKey}', 'schedules', ${idx})"><i class="fas fa-times"></i></button>`;
        scheduleListEl.appendChild(li);
    });
    
    // 가계부 렌더링
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

// 아이템 삭제
window.deleteItem = (dateKey, type, index) => {
    plannerData[dateKey][type].splice(index, 1);
    saveData();
    renderCalendar();
    updateDetailView();
};

// 데이터 저장
function saveData() {
    localStorage.setItem('plannerData', JSON.stringify(plannerData));
}

// 월간 합계 계산
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

// 이벤트 리스너 설정
function setupEventListeners() {
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
    
    plannerData[dateKey].expenses.push({
        desc: desc.value,
        amount: parseInt(amount.value)
    });
    
    desc.value = '';
    amount.value = '';
    saveData();
    renderCalendar();
    updateDetailView();
}

init();
