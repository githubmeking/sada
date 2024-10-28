// game.js
const balanceDisplay = document.getElementById('balance');
let balance = 0.000008;

function updateBalance() {
    balance += 0.002;
    balanceDisplay.textContent = balance.toFixed(8);
}

setInterval(updateBalance, 1000);
