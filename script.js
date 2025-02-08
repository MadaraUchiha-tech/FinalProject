const expenseName = document.querySelector("#expense-name");
const expenseAmount = document.querySelector("#expense-amount");
const expenseList = document.querySelector("#expense-list");
const totalAmount = document.querySelector("#total-amount");
const totalCurrency = document.querySelector("#total-currency");
const currencySelect = document.querySelector("#currency-select");
const currentCurrency = document.querySelector("#current-currency");
  
const API_KEY = "a75ad1886766cbbeea7e5616";
const BASE_CURRENCY = "INR";
let exchangeRates = {};
let selectedCurrency = "INR";

document.addEventListener("DOMContentLoaded", async () => {
    loadExpenses();
    await fetchExchangeRates();
    updateCurrencyDisplay();
});

async function fetchExchangeRates() {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`);
        const data = await response.json();

        if (!response.ok || !data.conversion_rates) {
            throw new Error("Failed to fetch exchange rates");
        }

        exchangeRates = data.conversion_rates;
        populateCurrencyDropdown(Object.keys(exchangeRates));
    } catch (error) {
        console.error("Exchange rate fetch error:", error);
        alert("Error fetching exchange rates. Please check your network.");
    }
}

function populateCurrencyDropdown(currencies) {
    currencySelect.innerHTML = "";
    currencies.forEach(currency => {
        const option = document.createElement("option");
        option.value = currency;
        option.textContent = currency;
        currencySelect.appendChild(option);
    });
    currencySelect.value = selectedCurrency;
}

currencySelect.addEventListener("change", () => {
    selectedCurrency = currencySelect.value;
    updateCurrencyDisplay();
});

function updateCurrencyDisplay() {
    const rate = exchangeRates[selectedCurrency] || 1;
    currentCurrency.textContent = totalCurrency.textContent = selectedCurrency;

    let total = 0;
    expenseList.querySelectorAll("tr").forEach(row => {
        const amountCell = row.querySelector(".expense-amount");
        const originalAmount = parseFloat(amountCell.dataset.original);
        const convertedAmount = (originalAmount * rate).toFixed(2);
        amountCell.textContent = `${convertedAmount} ${selectedCurrency}`;
        total += parseFloat(convertedAmount);
    });

    totalAmount.textContent = total.toFixed(2);
}

function addExpense() {
    let name = expenseName.value;
    let amount = parseFloat(expenseAmount.value);

    let nameTrimmed = "";
    name.split("").forEach(char => {
        if (char !== " ") nameTrimmed += char;
    });

    if (!nameTrimmed || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid expense name and amount.");
        return;
    }

    const expense = { id: Date.now(), name: nameTrimmed, amount };

    const expenses = getStoredExpenses();
    expenses.push(expense);
    saveExpenses(expenses);

    renderExpense(expense);
    updateCurrencyDisplay();

    expenseName.value = "";
    expenseAmount.value = "";
}

function renderExpense(expense) {
    const rate = exchangeRates[selectedCurrency] || 1;
    const convertedAmount = (expense.amount * rate).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${expense.name}</td>
        <td class="expense-amount" data-original="${expense.amount}">${convertedAmount} ${selectedCurrency}</td>
        <td><button class="delete-btn" data-id="${expense.id}">Delete</button></td>
    `;

    expenseList.appendChild(row);
}

function loadExpenses() {
    expenseList.innerHTML = ""; 
    getStoredExpenses().forEach(renderExpense);
}

expenseList.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const row = event.target.closest("tr"); 
        const expenseId = Number(row.querySelector(".delete-btn").dataset.id); 
        deleteExpense(expenseId);
    }
});

function deleteExpense(id) {
    let expenses = getStoredExpenses().filter(exp => exp.id !== Number(id));
    saveExpenses(expenses);
    loadExpenses();
    updateCurrencyDisplay();
}

function getStoredExpenses() {
    try {
        return JSON.parse(localStorage.getItem("expenses")) || [];
    } catch (error) {
        console.error("Error reading localStorage:", error);
        return [];
    }
}

function saveExpenses(expenses) {
    try {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}
function calculateTotal() {
    return getStoredExpenses().reduce((sum, exp) => sum + exp.amount, 0);
}
