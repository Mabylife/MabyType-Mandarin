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
    input.blur(); // 超級宇宙炸裂貼心之幫你消除底線之術步驟一
    setTimeout(() => {
      input.focus();
      input.addEventListener("input", checkAnswer);
    }, 0); // 超級宇宙炸裂貼心之幫你消除底線之術步驟二
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
  const width = text.clientWidth || 0;
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

function startSecondsTimer(s, callback) {
  const start = performance.now();
  function check() {
    const now = performance.now();
    if (now - start >= s * 1000) {
      console.log(`Total time: ${(now - start) / 1000} seconds`);
      callback();
    } else {
      requestAnimationFrame(check);
    }
  }
  check();
}

function finish() {
  isFinished = true;
  console.log("Finish");
  input.blur();
  input.style.userSelect = "none";
  input.removeEventListener("input", checkAnswer);
  deleteNoneMandarinChars();
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
  input.value = "";
  addText();
  input.style.width = "100%";
  input.style.transform = "translateX(0)";
  text.style.transform = "translateX(0)";
  isStarted = false;
  isFinished = false;
}

document.addEventListener("DOMContentLoaded", () => {
  startNewGameReset();
});
