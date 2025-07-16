import { char2phonetic } from "./pre_made_datas/char2phonetic.js";
import { mQuotes } from "./pre_made_datas/mQuotes.js";

const input = document.getElementById("input");
input.addEventListener("input", checkAnswer);
const text = document.getElementById("text");
let textType = "quote"; // 目前只支援 quote 類型
let textIndex = 5; // 預設顯示 5 個 quote
let how2Finish = ["onTime", 10]; // 預設 10 秒後結束
let isStarted = false;
let isFinished = false;
// window.changeMode = changeMode;
// window.replay = replay;
window.next = next;
// window.toggleVolumn = toggleVolumn;
// window.toggleHud = toggleHud;

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkAnswer() {
  const inputValue = input.value.trim();
  // 只在輸入為中文字時才執行 check
  if (/^[\u4e00-\u9fff ，。]+$/.test(inputValue) || input.value === "") {
    if (!isStarted && input.value !== "") {
      start();
    }
    input.removeEventListener("input", checkAnswer);
    const spans = text.querySelectorAll("span");
    for (let i = 0; i < spans.length; i++) {
      const inputPhonetics = char2phonetic[input.value.charAt(i)] || [];
      const textPhonetics = char2phonetic[spans[i].textContent] || [];
      if (inputPhonetics.some((p) => textPhonetics.includes(p))) {
        spans[i].classList.remove("correct", "incorrect");
        spans[i].classList.add("correct");
        if (inputValue.charAt(i) !== spans[i].textContent) {
          input.value =
            inputValue.slice(0, i) +
            spans[i].textContent +
            inputValue.slice(i + 1); // 超級宇宙炸裂貼心之幫你選字之術
        }
      } else if (inputValue.charAt(i) === "") {
        spans[i].classList.remove("correct", "incorrect");
      } else {
        spans[i].classList.remove("correct", "incorrect");
        spans[i].classList.add("incorrect");
      }
    }
    const typedChar = document.querySelectorAll(".correct, .incorrect").length;
    if (typedChar > spans.length * 0.6) {
      addText();
    }
    removeUnderline();
  }
  scrollTheWholeShit();
}

function addText() {
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
  const width = text.offsetWidth;
  input.style.width = width + "px";
}

function scrollTheWholeShit() {
  const typedChar = document.querySelectorAll(".correct, .incorrect").length;
  const charElement = document.querySelector(".char");
  const perScrollWidth = charElement ? charElement.clientWidth : 0;
  const scrollWidth = typedChar * perScrollWidth;
  input.style.transform = `translateX(-${scrollWidth}px)`;
  text.style.transform = `translateX(-${scrollWidth}px)`;
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
  input.removeEventListener("input", checkAnswer);
  deleteNoneMandarinChars();
  getResult();
}

function deleteNoneMandarinChars() {
  const typedChar = document.querySelectorAll(".correct, .incorrect").length;
  input.value = input.value.substring(0, typedChar); //減去多餘的注音...
}

input.addEventListener("blur", () => {
  deleteNoneMandarinChars();
});

input.addEventListener("focus", () => {
  if (isFinished) {
    input.blur();
  }
});

function startNewGameReset() {
  input.addEventListener("input", checkAnswer);
  stopSecondsTimer(); // 停止計時器
  isStarted = false;
  isFinished = false;
  text.innerHTML = ""; // 清空文字
  input.focus();
  input.value = "";
  addText();
  input.style.width = "100%";
  input.style.transform = "translateX(0)";
  text.style.transform = "translateX(0)";
}

document.addEventListener("DOMContentLoaded", () => {
  startNewGameReset();
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

function removeUnderline() {
  input.blur(); // 超級宇宙炸裂貼心之幫你消除底線之術步驟一
  setTimeout(() => {
    input.focus();
    input.addEventListener("input", checkAnswer);
  }, 0); // 超級宇宙炸裂貼心之幫你消除底線之術步驟二
}

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
