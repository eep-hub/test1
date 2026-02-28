const generateBtn = document.getElementById('generate-btn');
const lottoNumbersContainer = document.getElementById('lotto-numbers');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// 다크모드 초기 설정 확인
if (localStorage.getItem('theme') === 'dark') {
    body.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// 다크모드 토글
darkModeToggle.addEventListener('click', () => {
    if (body.hasAttribute('data-theme')) {
        body.removeAttribute('data-theme');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
});

generateBtn.addEventListener('click', () => {
    // 기존 번호 삭제
    lottoNumbersContainer.innerHTML = '';
    
    const line = document.createElement('div');
    line.classList.add('lotto-line');
    
    const numbers = generateLottoNumbers();
    
    numbers.forEach((number, index) => {
        const numElement = document.createElement('div');
        numElement.classList.add('lotto-number');
        numElement.classList.add(getBallColorClass(number));
        numElement.textContent = number;
        
        // 순차적으로 나타나도록 딜레이 설정
        numElement.style.animationDelay = `${index * 0.1}s`;
        
        line.appendChild(numElement);
    });
    
    lottoNumbersContainer.appendChild(line);
    
    // 버튼 클릭 시 피드백 애니메이션
    generateBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        generateBtn.style.transform = '';
    }, 100);
});

function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

function getBallColorClass(num) {
    if (num <= 10) return 'ball-1-10';
    if (num <= 20) return 'ball-11-20';
    if (num <= 30) return 'ball-21-30';
    if (num <= 40) return 'ball-31-40';
    return 'ball-41-45';
}
