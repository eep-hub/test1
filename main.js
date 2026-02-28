const generateBtn = document.getElementById('generate-btn');
const lottoNumbersContainer = document.getElementById('lotto-numbers');

generateBtn.addEventListener('click', () => {
    lottoNumbersContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const line = document.createElement('div');
        line.classList.add('lotto-line');
        const numbers = generateLottoNumbers();
        for (const number of numbers) {
            const numElement = document.createElement('div');
            numElement.classList.add('lotto-number');
            numElement.textContent = number;
            line.appendChild(numElement);
        }
        lottoNumbersContainer.appendChild(line);
    }
});

function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}