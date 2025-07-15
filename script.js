import { char2phonetic } from "./char2phonetic.js";
import { mQuotes } from "./mQuotes.js";

const input = document.getElementById("input");
input.addEventListener("input", checkAnswer);
const text = document.getElementById("text");

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkAnswer() {
  const inputValue = input.value.trim();
  // 只在輸入為中文字時才執行 check
  if (/^[\u4e00-\u9fff ，。]+$/.test(inputValue) || input.value === "") {
    console.log("Checking answer...");
    // 這裡可以加上你的檢查邏輯
    input.blur(); // 超級宇宙炸裂貼心之幫你消除底線之術步驟一
    setTimeout(() => input.focus(), 0); // 超級宇宙炸裂貼心之幫你消除底線之術步驟二
    const spans = text.querySelectorAll("span");
    for (let i = 0; i < spans.length; i++) {
      const inputPhonetics = char2phonetic[input.value.charAt(i)] || [];
      const textPhonetics = char2phonetic[spans[i].textContent] || [];
      if (inputPhonetics.some((p) => textPhonetics.includes(p))) {
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
        spans[i].classList.add("incorrect");
      }
    }
  }
}

function addText(type, index) {
  if (type === "quote") {
    for (let i = 0; i < index; i++) {
      const newQuote = mQuotes[randomNumber(0, mQuotes.length - 1)];
      const wrapped = newQuote
        .split("")
        .map((c) => `<span>${c}</span>`)
        .join("");
      text.innerHTML += wrapped;
    }
  }
}

addText("quote", 5);
