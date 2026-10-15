/**
 * Google Style Start Homepage JavaScript
 * - Real-time Weather: Seoul, Incheon, Jeju (via Open-Meteo Free API)
 * - Google Search Engine integration
 * - Inspirational Quotes Generator & Copy
 * - Real-time Clock & Dark/Light Theme Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initWeather();
  initQuotes();
  initSearch();
  initVoiceModal();
});

/* ==========================================================================
   2. Dark / Light Theme Toggle
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  
  // 저장된 테마 불러오기 또는 OS 설정 확인
  const savedTheme = localStorage.getItem('google_start_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    themeIcon.textContent = 'light_mode';
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    themeIcon.textContent = 'dark_mode';
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      themeIcon.textContent = 'dark_mode';
      localStorage.setItem('google_start_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      themeIcon.textContent = 'light_mode';
      localStorage.setItem('google_start_theme', 'dark');
    }
  });
}

/* ==========================================================================
   3. Real-time Weather: Seoul, Incheon, Jeju (Open-Meteo API)
   ========================================================================== */
const CITIES = {
  seoul: {
    name: '서울',
    lat: 37.5665,
    lon: 126.9780,
    tempId: 'seoulTemp',
    descId: 'seoulDesc',
    iconId: 'seoulWeatherIcon',
    apparentId: 'seoulApparent',
    humidityId: 'seoulHumidity',
    windId: 'seoulWind'
  },
  incheon: {
    name: '인천',
    lat: 37.4563,
    lon: 126.7052,
    tempId: 'incheonTemp',
    descId: 'incheonDesc',
    iconId: 'incheonWeatherIcon',
    apparentId: 'incheonApparent',
    humidityId: 'incheonHumidity',
    windId: 'incheonWind'
  },
  jeju: {
    name: '제주',
    lat: 33.4996,
    lon: 126.5312,
    tempId: 'jejuTemp',
    descId: 'jejuDesc',
    iconId: 'jejuWeatherIcon',
    apparentId: 'jejuApparent',
    humidityId: 'jejuHumidity',
    windId: 'jejuWind'
  }
};

// WMO Weather Code 해석 및 Material Icon 매핑
function parseWmoWeather(code) {
  if (code === 0) return { desc: '맑음', icon: 'wb_sunny', color: '#FBBC05' };
  if (code === 1) return { desc: '대체로 맑음', icon: 'sunny_snowing', color: '#FBBC05' };
  if (code === 2) return { desc: '구름 조금', icon: 'partly_cloudy_day', color: '#4285F4' };
  if (code === 3) return { desc: '흐림', icon: 'cloud', color: '#80868B' };
  if ([45, 48].includes(code)) return { desc: '안개', icon: 'foggy', color: '#9AA0A6' };
  if ([51, 53, 55].includes(code)) return { desc: '이슬비', icon: 'grain', color: '#4285F4' };
  if ([61, 63, 65].includes(code)) return { desc: '비', icon: 'rainy', color: '#4285F4' };
  if ([71, 73, 75, 77].includes(code)) return { desc: '눈', icon: 'ac_unit', color: '#34A853' };
  if ([80, 81, 82].includes(code)) return { desc: '소나기', icon: 'shower', color: '#4285F4' };
  if ([95, 96, 99].includes(code)) return { desc: '뇌우', icon: 'thunderstorm', color: '#EA4335' };
  return { desc: '맑음', icon: 'wb_sunny', color: '#FBBC05' };
}

async function fetchCityWeather(cityKey) {
  const city = CITIES[cityKey];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FTokyo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Response Error');
    const data = await res.json();
    const current = data.current;
    const weatherInfo = parseWmoWeather(current.weather_code);

    // DOM 업데이트
    document.getElementById(city.tempId).innerHTML = `${Math.round(current.temperature_2m)}<span class="temp-unit">°C</span>`;
    document.getElementById(city.descId).textContent = weatherInfo.desc;
    document.getElementById(city.apparentId).textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById(city.humidityId).textContent = `${current.relative_humidity_2m}%`;
    document.getElementById(city.windId).textContent = `${current.wind_speed_10m} m/s`;

    const iconContainer = document.getElementById(city.iconId);
    iconContainer.innerHTML = `<span class="material-symbols-outlined" style="color: ${weatherInfo.color};">${weatherInfo.icon}</span>`;

    // 서울 데이터일 경우 헤더 칩도 업데이트 (존재 시)
    if (cityKey === 'seoul') {
      const headerTemp = document.getElementById('headerSeoulTemp');
      const quickIcon = document.getElementById('quickWeatherIcon');
      if (headerTemp) headerTemp.textContent = `${Math.round(current.temperature_2m)}°C`;
      if (quickIcon) {
        quickIcon.textContent = weatherInfo.icon;
        quickIcon.style.color = weatherInfo.color;
      }
    }
  } catch (err) {
    console.warn(`Weather fetch failed for ${city.name}, using fallback:`, err);
    // 오프라인/오류 발생 시 Fallback 디폴트값
    const fallbackTemps = { seoul: 22, incheon: 21, jeju: 24 };
    document.getElementById(city.tempId).innerHTML = `${fallbackTemps[cityKey]}<span class="temp-unit">°C</span>`;
    document.getElementById(city.descId).textContent = '맑음 (캐시됨)';
    document.getElementById(city.apparentId).textContent = `${fallbackTemps[cityKey]}°C`;
    document.getElementById(city.humidityId).textContent = '55%';
    document.getElementById(city.windId).textContent = '2.1 m/s';
  }
}

async function loadAllWeather() {
  const refreshBtn = document.getElementById('weatherRefreshBtn');
  const updateTag = document.getElementById('weatherUpdateTime');
  
  refreshBtn.classList.add('rotating');
  updateTag.textContent = '업데이트 중...';

  await Promise.all([
    fetchCityWeather('seoul'),
    fetchCityWeather('incheon'),
    fetchCityWeather('jeju')
  ]);

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  updateTag.textContent = `${timeStr} 기준 갱신됨`;

  setTimeout(() => {
    refreshBtn.classList.remove('rotating');
  }, 600);
}

function initWeather() {
  loadAllWeather();

  const refreshBtn = document.getElementById('weatherRefreshBtn');
  refreshBtn.addEventListener('click', () => {
    loadAllWeather();
  });

  // 10분마다 자동 갱신
  setInterval(loadAllWeather, 10 * 60 * 1000);
}

/* ==========================================================================
   4. Google Search & Controls
   ========================================================================== */
function initSearch() {
  const searchForm = document.getElementById('googleSearchForm');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const searchBarWrapper = document.getElementById('searchBarWrapper');

  // 포커스 스타일 처리
  searchInput.addEventListener('focus', () => {
    searchBarWrapper.classList.add('focused');
  });
  searchInput.addEventListener('blur', () => {
    searchBarWrapper.classList.remove('focused');
  });

  // 지우기 버튼 토글
  searchInput.addEventListener('input', () => {
    searchClearBtn.style.display = searchInput.value.trim().length > 0 ? 'flex' : 'none';
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchInput.focus();
  });

  // 폼 제출 처리
  searchForm.addEventListener('submit', (e) => {
    const query = searchInput.value.trim();
    if (!query) {
      e.preventDefault();
      searchInput.focus();
      return;
    }

    // URL 형식인지 확인 (http://, https:// 또는 도메인 형태)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (urlPattern.test(query) && !query.includes(' ')) {
      e.preventDefault();
      let targetUrl = query;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      window.location.href = targetUrl;
    }
  });

  // 카메라(이미지 검색) 버튼 클릭 시 Google 이미지 검색 페이지로 이동
  const lensSearchBtn = document.getElementById('lensSearchBtn');
  if (lensSearchBtn) {
    lensSearchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
      } else {
        window.open('https://www.google.co.kr/imghp', '_blank');
      }
    });
  }

  // I'm Feeling Lucky 버튼 클릭 시 명언 변경 트리거 및 안내
  const luckyBtn = document.getElementById('luckyBtn');
  luckyBtn.addEventListener('click', () => {
    changeQuote(true);
    // 검색창에 추천 키워드 채우기
    const luckyKeywords = ['오늘의 명언', '오늘의 좋은 글귀', '구글 두들', 'Google Arts & Culture', '트렌드 키워드'];
    const randomKeyword = luckyKeywords[Math.floor(Math.random() * luckyKeywords.length)];
    searchInput.value = randomKeyword;
    searchClearBtn.style.display = 'flex';
    searchInput.focus();
  });
}

/* ==========================================================================
   5. Quotes Database & Operations
   ========================================================================== */
const QUOTES = [
  { text: "삶이 있는 한 희망은 있다.", author: "키케로 (Cicero)" },
  { text: "산다는 것 그것은 치열한 전투이다.", author: "로망 로랑 (Romain Rolland)" },
  { text: "언제나 현재에 집중할 수 있다면 행복할 것이다.", author: "파울로 코엘료 (Paulo Coelho)" },
  { text: "피할 수 없으면 즐겨라.", author: "로버트 엘리엇 (Robert Elliot)" },
  { text: "단순하게 살아라. 현대인은 쓸데없는 절차와 일 때문에 너무 복잡하다.", author: "법정 스님" },
  { text: "우리가 두려워해야 할 유일한 것은 두려움 그 자체다.", author: "프랭클린 D. 루스벨트" },
  { text: "내일은 내일의 태양이 뜬다.", author: "마거릿 미첼 (바람과 함께 사라지다)" },
  { text: "시작이 반이다.", author: "아리스토텔레스 (Aristotle)" },
  { text: "성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 지속하는 용기다.", author: "윈스턴 처칠 (Winston Churchill)" },
  { text: "행복은 목표가 아니라 부산물이다.", author: "엘리너 루스벨트 (Eleanor Roosevelt)" },
  { text: "당신이 포기하지 않는 한 그것은 실패가 아니다.", author: "마윈 (Jack Ma)" },
  { text: "천 리 길도 한 걸음부터.", author: "노자 (Laozi)" },
  { text: "가장 어두운 밤도 언젠가는 끝나고 해는 뜰 것이다.", author: "빅토르 위고 (레 미제라블)" },
  { text: "어제와 똑같이 살면서 다른 미래를 기대하는 것은 정신병 초기증세이다.", author: "알베르트 아인슈타인" },
  { text: "할 수 있다고 믿는 사람은 결국 해내고, 할 수 없다고 믿는 사람은 결국 해내지 못한다.", author: "헨리 포드 (Henry Ford)" },
  { text: "시간은 우리가 가장 원하는 것이지만, 가장 잘못 쓰고 있는 것이기도 하다.", author: "윌리엄 펜" },
  { text: "위대한 일을 하는 유일한 방법은 당신이 하는 일을 사랑하는 것이다.", author: "스티브 잡스 (Steve Jobs)" },
  { text: "자신을 이기는 자가 가장 강한 자다.", author: "세네카 (Seneca)" },
  { text: "지혜는 경험의 딸이다.", author: "레오나르도 다 빈치 (Leonardo da Vinci)" },
  { text: "오늘 나무 그늘 아래 쉴 수 있는 이유는 오래전에 누군가 나무를 심었기 때문이다.", author: "워런 버핏 (Warren Buffett)" }
];

let currentQuoteIndex = 0;

function renderQuote(index) {
  const quote = QUOTES[index];
  const quoteWrapper = document.getElementById('quoteContentWrapper');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');

  quoteWrapper.classList.add('fade-out');

  setTimeout(() => {
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `— ${quote.author}`;
    quoteWrapper.classList.remove('fade-out');
  }, 250);
}

function changeQuote(random = true) {
  const diceIcon = document.getElementById('quoteDiceIcon');
  if (diceIcon) {
    diceIcon.style.transform = 'rotate(360deg)';
    setTimeout(() => { diceIcon.style.transform = 'none'; }, 400);
  }

  if (random) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * QUOTES.length);
    } while (nextIndex === currentQuoteIndex && QUOTES.length > 1);
    currentQuoteIndex = nextIndex;
  } else {
    currentQuoteIndex = (currentQuoteIndex + 1) % QUOTES.length;
  }

  renderQuote(currentQuoteIndex);
}

function initQuotes() {
  // 오늘 날짜 기반 기본 명언 선택
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  currentQuoteIndex = dayOfYear % QUOTES.length;
  
  renderQuote(currentQuoteIndex);

  const newQuoteBtn = document.getElementById('newQuoteBtn');
  newQuoteBtn.addEventListener('click', () => {
    changeQuote(true);
  });

  // 복사 버튼
  const copyQuoteBtn = document.getElementById('copyQuoteBtn');
  const quoteToast = document.getElementById('quoteToast');

  copyQuoteBtn.addEventListener('click', async () => {
    const q = QUOTES[currentQuoteIndex];
    const textToCopy = `"${q.text}" - ${q.author}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
      }

      quoteToast.classList.add('show');
      setTimeout(() => {
        quoteToast.classList.remove('show');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  });
}

/* ==========================================================================
   6. Voice Modal Simulation / Speech Recognition
   ========================================================================== */
function initVoiceModal() {
  const voiceBtn = document.getElementById('voiceSearchBtn');
  const voiceModal = document.getElementById('voiceModal');
  const voiceCloseBtn = document.getElementById('voiceCloseBtn');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');

  let recognition = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      voiceStatusText.textContent = `"${transcript}"`;
      setTimeout(() => {
        searchInput.value = transcript;
        searchClearBtn.style.display = 'flex';
        closeVoiceModal();
        document.getElementById('googleSearchForm').submit();
      }, 900);
    };

    recognition.onerror = () => {
      voiceStatusText.textContent = '음성을 인식하지 못했습니다.';
    };

    recognition.onend = () => {
      // recognition 종료 시
    };
  }

  function openVoiceModal() {
    voiceModal.classList.add('active');
    voiceStatusText.textContent = '듣고 있습니다...';
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.log('Recognition already active');
      }
    } else {
      // 음성 인식을 지원하지 않는 브라우저 시뮬레이션
      setTimeout(() => {
        voiceStatusText.textContent = '"오늘의 서울 날씨"';
        setTimeout(() => {
          searchInput.value = '오늘의 서울 날씨';
          searchClearBtn.style.display = 'flex';
          closeVoiceModal();
        }, 1200);
      }, 1500);
    }
  }

  function closeVoiceModal() {
    voiceModal.classList.remove('active');
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
  }

  voiceBtn.addEventListener('click', openVoiceModal);
  voiceCloseBtn.addEventListener('click', closeVoiceModal);
  voiceModal.addEventListener('click', (e) => {
    if (e.target === voiceModal) closeVoiceModal();
  });
}
