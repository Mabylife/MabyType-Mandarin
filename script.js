import { char2phonetic } from "./pre_made_datas/char2phonetic.js";
import { mQuotes } from "./pre_made_datas/mQuotes.js";

window.addEventListener("error", (e) =>
  console.error("Global error:", e.error)
);
window.addEventListener("unhandledrejection", (e) =>
  console.error("Unhandled promise rejection:", e.reason)
);

// 2. 確認 script 有被執行
console.log("🔥 script.js loaded");

const input = document.getElementById("input");
const text = document.getElementById("text");
let textType = "quote"; // 目前只支援 quote 類型
let textIndex = 5; // 預設顯示 5 個 quote
let how2Finish = ["onTime", 5]; // 預設 30 秒後結束
let isStarted = false;
let isFinished = false;
let windowWidth; // 獲取視窗寬度
window.next = next;
const hiddenBut = document.createElement("button");
hiddenBut.style.position = "absolute";
hiddenBut.style.left = "-9999px";
document.body.appendChild(hiddenBut);
let debounceTimer = null; // 用於防抖

const nextBut = document.getElementById("nextBut"); // Ensure you have an element with id="nextBut"

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

input.addEventListener("input", () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    checkAnswer();
  }, 0);
});

let lastInputValue = "";

function checkAnswer() {
  let inputValue = (input.value.match(/[\u4e00-\u9fff，。]/g) || [])
    .join("")
    .trim();

  if (lastInputValue !== null && inputValue === lastInputValue) return;
  lastInputValue = inputValue;

  if (!isStarted && inputValue !== "") {
    start();
  }

  input.blur();

  const spans = text.querySelectorAll("span");
  let needAutoComplete = false;

  for (let i = 0; i < spans.length; i++) {
    const inputPhonetics = char2phonetic[inputValue.charAt(i)] || [];
    const textPhonetics = char2phonetic[spans[i].textContent] || [];
    if (inputPhonetics.some((p) => textPhonetics.includes(p))) {
      spans[i].classList.remove("correct", "incorrect");
      spans[i].classList.add("correct");
      // 自動補全
      if (input.value.charAt(i) !== spans[i].textContent) {
        input.value =
          input.value.substring(0, i) +
          spans[i].textContent +
          input.value.substring(i + 1);
      }
    } else if (inputValue.charAt(i) === "") {
      spans[i].classList.remove("correct", "incorrect");
    } else {
      spans[i].classList.remove("correct", "incorrect");
      spans[i].classList.add("incorrect");
    }
  }

  input.focus();
  requestAnimationFrame(() => {
    scrollTheWholeShit();
  });

  const typedChar = document.querySelectorAll(".correct, .incorrect").length;
  if (typedChar > spans.length * 0.6) {
    setTimeout(() => {
      addText();
    }, 0);
  }
}

function addText() {
  console.log("Add text");
  if (textType === "quote") {
    for (let i = 0; i < textIndex; i++) {
      const newQuote = mQuotes[randomNumber(0, mQuotes.length - 1)];
      const wrapped = newQuote
        .split("")
        .map((c) => `<span class="char">${c}</span>`)
        .join("");
      text.innerHTML += wrapped;
    }
  }
  text.style.width = windowWidth / 2 + "px"; // 設定文字寬度為視窗寬度
}

function scrollTheWholeShit() {
  requestAnimationFrame(() => {
    const typedChar = document.querySelectorAll(".correct, .incorrect").length;
    const charElement = document.querySelector(".char");
    const perScrollWidth = charElement
      ? charElement.getBoundingClientRect().width
      : 0;
    const scrollWidth = typedChar * perScrollWidth;

    requestAnimationFrame(() => {
      text.style.transform = `translateY(-50%) translateX(-${scrollWidth}px)`;
      text.style.width = windowWidth / 2 + scrollWidth + "px";
      input.style.transform = `translateY(-50%) translateX(-${scrollWidth}px)`;
      // 防止初始寬度過小
      const textWidth = Math.max(text.getBoundingClientRect().width, 400);
      input.style.width = textWidth + 25 + "px";
      // transition 只設一次
      if (text.style.transition === "") {
        text.style.transition = "transform 0.15s ease-in-out";
        input.style.transition =
          "transform 0.15s ease-in-out, opacity 0.15s ease-in-out";
      }
    });
  });
}

function start() {
  console.log("Start");
  isStarted = true;
  if (how2Finish[0] === "onTime") {
    startSecondsTimer(how2Finish[1], finish);
  }
}

let timerId = null; // 全域變數保存 requestAnimationFrame id

function startSecondsTimer(s, callback) {
  const startTime = performance.now();
  function check() {
    const now = performance.now();
    if (now - startTime >= s * 1000) {
      totalUsedTime = (now - startTime) / 1000; // 計算總用時
      console.log(`實際總用時: ${totalUsedTime} 秒`);
      callback();
      timerId = null;
    } else {
      timerId = requestAnimationFrame(check);
    }
  }
  check();
}

// 手動停止計時器
function stopSecondsTimer() {
  if (timerId !== null) {
    cancelAnimationFrame(timerId);
    timerId = null;
  }
}

function finish() {
  isFinished = true;
  console.log("Finish");
  input.blur();
  input.classList.add("finished");
  deleteNoneMandarinChars();
  getResult();
}

function deleteNoneMandarinChars() {
  const typedChar = document.querySelectorAll(".correct, .incorrect").length;
  input.value = input.value.substring(0, typedChar); //減去多餘的注音...
}

input.addEventListener("focus", () => {
  if (isFinished) {
    input.blur();
  }
});

function startNewGameReset() {
  input.classList.remove("finished");
  stopSecondsTimer();
  isStarted = false;
  isFinished = false;
  text.innerHTML = "";
  input.focus();
  input.value = "";
  addText();
  requestAnimationFrame(() => {
    scrollTheWholeShit();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startNewGameReset();
  windowWidth = window.innerWidth; // 更新視窗寬度
  document.body.style.width = windowWidth + "px"; // 更新 body 寬度
  text.style.width = windowWidth / 2 + "px"; // 更新文字寬度
  window.addEventListener("resize", () => {
    windowWidth = window.innerWidth; // 更新視窗寬度
    document.body.style.width = windowWidth + "px"; // 更新 body 寬度
    text.style.width = windowWidth / 2 + "px"; // 更新文字寬度
    requestAnimationFrame(() => {
      scrollTheWholeShit();
    });
  });
});

function next() {
  setTimeout(() => {
    nextBut.classList.remove("active");
  }, 300);
  nextBut.classList.add("active");
  startNewGameReset();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "Tab":
      e.preventDefault(); // 阻止 Tab 鍵的預設行為
      next();
      break;
  }
});

let totalUsedTime;

function getResult() {
  const incorrectChars = document.querySelectorAll(".incorrect");
  const correctChars = document.querySelectorAll(".correct");
  const totalChars = incorrectChars.length + correctChars.length;
  const accuracy = (correctChars.length / totalChars) * 100;
  const wpm = Math.round((totalChars / totalUsedTime) * 60); // 每分鐘打字數，四捨五入到整數
  console.log(`總字數: ${totalChars}`);
  console.log(`正確字數: ${correctChars.length}`);
  console.log(`錯誤字數: ${incorrectChars.length}`);
  console.log(`正確率: ${accuracy.toFixed(2)}%`);
  if (how2Finish[0] === "onTime") {
    console.log(`用時: ${how2Finish[1]} 秒`);
  }
  console.log(`每分鐘打字數: ${wpm}`);
}
