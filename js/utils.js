const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
  window.location.hostname === "[::1]" || // IPv6 loopback
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/), // 127.0.0.1/8 IPv4 loopback
);

window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`;
  handleError(error);
});

function handleError(error) {
  console.error(error);
  alert(error);
  if (!isLocalhost) location.reload();
}

function notify(message) {
  console.log(message);
  Toast?.show(message);
}

function stopPropagation(event) {
  event.stopPropagation();
}

function generateId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function save(key, value) {
  localStorage.setItem(`${PROJECT_NAME}_${key}`, JSON.stringify(value));
}

function load(key, defaultValue) {
  const savedValue = localStorage.getItem(`${PROJECT_NAME}_${key}`);
  if (savedValue == null) return defaultValue;
  return JSON.parse(savedValue);
}

function reset(key) {
  localStorage.removeItem(`${PROJECT_NAME}_${key}`);
}

function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFileName(file) {
  const fileName = file.name;
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0) return fileName;

  return fileName.slice(0, lastDotIndex);
}

function getFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function download(url, name) {
  const link = document.createElement("a");

  link.href = url;
  link.download = name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function toggleHide(element) {
  element.classList.toggle("hidden");
}

function toggleFullscreen(force) {
  if (document.fullscreenElement && force !== true) {
    document.exitFullscreen();
  } else if (force !== false) {
    document.documentElement.requestFullscreen();
  }
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getUniqueItems(arr, count) {
  if (!Array.isArray(arr) || count <= 0) return [];
  const k = Math.min(count, arr.length);
  const result = [...arr];
  for (let i = 0; i < k; i++) {
    const randIndex = Math.floor(Math.random() * (result.length - i)) + i;
    [result[i], result[randIndex]] = [result[randIndex], result[i]];
  }
  return result.slice(0, k);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return escapeMap[match];
  });
}

function formatTime(timestamp) {
  if (!timestamp) return "Just now";

  // Extract milliseconds from different possible input formats
  let dateMs;
  if (typeof timestamp.toMillis === "function") {
    // Firestore Timestamp object
    dateMs = timestamp.toMillis();
  } else if (timestamp instanceof Date) {
    dateMs = timestamp.getTime();
  } else if (typeof timestamp === "number") {
    dateMs = timestamp;
  } else {
    return "Just now";
  }

  const nowMs = Date.now();
  const secondsAgo = Math.floor((nowMs - dateMs) / 1000);

  // Return "Just now" for future timestamps or times under 10 seconds ago
  if (secondsAgo < 10) return "Just now";

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(secondsAgo / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return `${secondsAgo} seconds ago`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image file."));
    img.src = src;
  });
}

async function handleImageFile(file, maxSize = 128) {
  if (!file) return null;

  const dataUrl = await getFileDataUrl(file);
  const img = await loadImage(dataUrl);

  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  // Draw on standard HTML canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  // Return Data URL (base64 string) directly
  const mimeType = file?.type || file?.mimeType || "image/png";
  return canvas.toDataURL(mimeType);
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) return "";
  const text = await response.text();
  return text;
}

async function replaceElement(name) {
  const element = document.querySelector(`.${name}`);
  const htmlText = await fetchText(`../components/${name}/${name}.html`);

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const newElement = doc.body.firstChild; // Extracts the parsed element

  element.replaceWith(newElement);
  return newElement;
}
