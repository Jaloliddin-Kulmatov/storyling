"use client";

import { useSettings } from "@/lib/learner";

/** Languages of the interface itself (buttons, headings). Story content keeps its own language. */
export const UI_LANGS = [
  { code: "en", name: "English" },
  { code: "uz", name: "Oʻzbekcha" },
  { code: "ru", name: "Русский" },
  { code: "ko", name: "한국어" },
  { code: "de", name: "Deutsch" },
] as const;

export type UiLang = (typeof UI_LANGS)[number]["code"];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.notebook": "Notebook",
  "nav.watch": "Watch",
  "nav.practice": "Practice",
  "nav.dictionary": "Dictionary",
  "nav.me": "Me",
  "nav.settings": "Settings",
  "land.eyebrow": "Learn German through stories",
  "land.title1": "Read stories you can",
  "land.title2": "almost",
  "land.title3": "understand.",
  "land.lead": "Original stories from A1 to C1. Tap any word for its meaning, listen with natural audio, and practice with dictation, flashcards and exam-style tests.",
  "land.start": "Start reading free",
  "land.how": "How it works",
  "land.note": "No account needed · works on phone and desktop",
  "land.pick": "Jump straight to your level",
  "land.learning": "I'm learning",
  "land.level": "My level",
  "land.go": "Read a story",
  "land.featured": "Featured",
  "land.beta": "Beta",
  "land.more": "More languages (beta)",
  "land.anyLang": "Start with any language",
  "land.stories": "stories",
  "land.f1t": "Stories at your level",
  "land.f1": "Every story shows how many of its words you know. Pick the ones marked “Just right”.",
  "land.f2t": "Tap any word",
  "land.f2": "Meaning, audio, examples, level, and der/die/das in colour.",
  "land.f3t": "Natural audio",
  "land.f3": "Every story is recorded, with the sentence highlighted. Slow it down to 0.75×.",
  "land.f4t": "Daily plan",
  "land.f4": "One story, five words and one dictation a day: about 10 minutes.",
  "land.f5t": "Speak and write",
  "land.f5": "Read aloud and see which words were understood. Write about the story and get corrections.",
  "land.f6t": "Exam practice",
  "land.f6": "Goethe-style timed papers, grammar lessons and level tests.",
  "land.ui": "Interface language",
  "home.title": "Read today",
  "home.forYou": "For you",
  "home.daily": "Daily",
  "home.search": "Search stories",
  "home.addText": "Add text",
  "home.minToday": "min today",
  "home.streak": "day streak",
  "home.known": "words known",
  "home.toReview": "to review",
  "plan.title": "Today's plan",
  "plan.sub": "About 10 minutes",
  "plan.story": "Read one story",
  "plan.words": "Review 5 words",
  "plan.dictation": "Do one dictation",
  "plan.done": "Done for today. See you tomorrow!",
  "plan.go": "Go",
  "prac.title": "Practice",
  "prac.words": "Words",
  "prac.listen": "Listening and writing",
  "prac.exams": "Grammar and exams",
  "prac.notebook": "Notebook",
  "note.title": "Notebook",
  "note.words": "Words",
  "note.saved": "Saved stories",
  "note.history": "History",
  "note.texts": "My texts",
  "set.title": "Settings",
  "set.ui": "App language",
  "set.translate": "Translations and meanings in",
  "set.text": "Text size",
  "set.goal": "Daily goal",
  "set.theme": "Theme",
  "set.romanize": "Show romanization under Korean",
  "me.title": "Progress",
};

const uz: Dict = {
  "nav.home": "Bosh sahifa", "nav.notebook": "Daftar", "nav.watch": "Video", "nav.practice": "Mashq", "nav.dictionary": "Lugʻat", "nav.me": "Men", "nav.settings": "Sozlamalar",
  "land.eyebrow": "Nemis tilini hikoyalar orqali oʻrganing", "land.title1": "Deyarli", "land.title2": "tushunadigan", "land.title3": "hikoyalaringizni oʻqing.",
  "land.lead": "A1 dan C1 gacha original hikoyalar. Har bir soʻzni bosib maʼnosini koʻring, tabiiy ovozda tinglang, diktant, kartochkalar va imtihon uslubidagi testlar bilan mashq qiling.",
  "land.start": "Bepul oʻqishni boshlash", "land.how": "Qanday ishlaydi", "land.note": "Roʻyxatdan oʻtish shart emas · telefon va kompyuterda ishlaydi",
  "land.pick": "Darajangizga darhol oʻting", "land.learning": "Oʻrganayotgan tilim", "land.level": "Darajam", "land.go": "Hikoya oʻqish",
  "land.featured": "Asosiy", "land.beta": "Beta", "land.more": "Boshqa tillar (beta)", "land.anyLang": "Istalgan tildan boshlang", "land.stories": "ta hikoya",
  "land.f1t": "Darajangizga mos hikoyalar", "land.f1": "Har bir hikoyada qancha soʻzni bilishingiz koʻrsatiladi. “Aynan mos” deb belgilanganlarini tanlang.",
  "land.f2t": "Istalgan soʻzni bosing", "land.f2": "Maʼno, talaffuz, misollar, daraja va der/die/das ranglari.",
  "land.f3t": "Tabiiy ovoz", "land.f3": "Har bir hikoya ovozli, joriy gap ajratib koʻrsatiladi. 0.75× tezlikda tinglash mumkin.",
  "land.f4t": "Kunlik reja", "land.f4": "Kuniga bitta hikoya, beshta soʻz va bitta diktant: taxminan 10 daqiqa.",
  "land.f5t": "Gapiring va yozing", "land.f5": "Ovoz chiqarib oʻqing va qaysi soʻzlar tushunilganini koʻring. Hikoya haqida yozing va tuzatishlar oling.",
  "land.f6t": "Imtihonga tayyorgarlik", "land.f6": "Goethe uslubidagi vaqtli testlar, grammatika darslari va daraja testlari.",
  "land.ui": "Interfeys tili",
  "home.title": "Bugun oʻqing", "home.forYou": "Siz uchun", "home.daily": "Kunlik", "home.search": "Hikoya qidirish", "home.addText": "Matn qoʻshish",
  "home.minToday": "daqiqa bugun", "home.streak": "kun ketma-ket", "home.known": "soʻz biladi", "home.toReview": "takrorlash",
  "plan.title": "Bugungi reja", "plan.sub": "Taxminan 10 daqiqa", "plan.story": "Bitta hikoya oʻqing", "plan.words": "5 ta soʻzni takrorlang", "plan.dictation": "Bitta diktant yozing", "plan.done": "Bugun hammasi bajarildi. Ertaga koʻrishguncha!", "plan.go": "Boshlash",
  "prac.title": "Mashq", "prac.words": "Soʻzlar", "prac.listen": "Tinglash va yozish", "prac.exams": "Grammatika va imtihonlar", "prac.notebook": "Daftar",
  "note.title": "Daftar", "note.words": "Soʻzlar", "note.saved": "Saqlangan hikoyalar", "note.history": "Tarix", "note.texts": "Mening matnlarim",
  "set.title": "Sozlamalar", "set.ui": "Ilova tili", "set.translate": "Tarjima va maʼnolar tili", "set.text": "Matn oʻlchami", "set.goal": "Kunlik maqsad", "set.theme": "Mavzu", "set.romanize": "Koreys matni ostida lotincha yozuv",
  "me.title": "Natijalar",
};

const ru: Dict = {
  "nav.home": "Главная", "nav.notebook": "Тетрадь", "nav.watch": "Видео", "nav.practice": "Практика", "nav.dictionary": "Словарь", "nav.me": "Профиль", "nav.settings": "Настройки",
  "land.eyebrow": "Немецкий через истории", "land.title1": "Читайте истории, которые вы", "land.title2": "почти", "land.title3": "понимаете.",
  "land.lead": "Оригинальные истории от A1 до C1. Нажмите на любое слово, чтобы увидеть значение, слушайте естественное аудио и тренируйтесь с диктантами, карточками и тестами в формате экзаменов.",
  "land.start": "Начать читать бесплатно", "land.how": "Как это работает", "land.note": "Без регистрации · работает на телефоне и компьютере",
  "land.pick": "Сразу к вашему уровню", "land.learning": "Я изучаю", "land.level": "Мой уровень", "land.go": "Читать историю",
  "land.featured": "Основные", "land.beta": "Бета", "land.more": "Другие языки (бета)", "land.anyLang": "Начните с любого языка", "land.stories": "историй",
  "land.f1t": "Истории вашего уровня", "land.f1": "У каждой истории видно, сколько слов вы уже знаете. Выбирайте отмеченные «В самый раз».",
  "land.f2t": "Нажмите на любое слово", "land.f2": "Значение, звук, примеры, уровень и цвета der/die/das.",
  "land.f3t": "Естественное аудио", "land.f3": "Каждая история озвучена, текущее предложение подсвечено. Можно замедлить до 0.75×.",
  "land.f4t": "План на день", "land.f4": "Одна история, пять слов и один диктант в день: около 10 минут.",
  "land.f5t": "Говорите и пишите", "land.f5": "Читайте вслух и смотрите, какие слова распознаны. Пишите об истории и получайте исправления.",
  "land.f6t": "Подготовка к экзаменам", "land.f6": "Тесты на время в стиле Goethe, уроки грамматики и тесты уровня.",
  "land.ui": "Язык интерфейса",
  "home.title": "Читать сегодня", "home.forYou": "Для вас", "home.daily": "На день", "home.search": "Поиск историй", "home.addText": "Добавить текст",
  "home.minToday": "мин сегодня", "home.streak": "дней подряд", "home.known": "слов знаете", "home.toReview": "повторить",
  "plan.title": "План на сегодня", "plan.sub": "Около 10 минут", "plan.story": "Прочитать одну историю", "plan.words": "Повторить 5 слов", "plan.dictation": "Написать один диктант", "plan.done": "На сегодня всё. До завтра!", "plan.go": "Начать",
  "prac.title": "Практика", "prac.words": "Слова", "prac.listen": "Аудирование и письмо", "prac.exams": "Грамматика и экзамены", "prac.notebook": "Тетрадь",
  "note.title": "Тетрадь", "note.words": "Слова", "note.saved": "Сохранённые истории", "note.history": "История", "note.texts": "Мои тексты",
  "set.title": "Настройки", "set.ui": "Язык приложения", "set.translate": "Переводы и значения на", "set.text": "Размер текста", "set.goal": "Цель на день", "set.theme": "Тема", "set.romanize": "Латиница под корейским текстом",
  "me.title": "Прогресс",
};

const ko: Dict = {
  "nav.home": "홈", "nav.notebook": "단어장", "nav.watch": "영상", "nav.practice": "연습", "nav.dictionary": "사전", "nav.me": "내 정보", "nav.settings": "설정",
  "land.eyebrow": "이야기로 배우는 독일어", "land.title1": "", "land.title2": "거의", "land.title3": "이해할 수 있는 이야기를 읽으세요.",
  "land.lead": "A1부터 C1까지 직접 쓴 이야기. 단어를 누르면 뜻이 나오고, 자연스러운 음성으로 듣고, 받아쓰기·단어 카드·시험형 문제로 연습해요.",
  "land.start": "무료로 읽기 시작", "land.how": "사용 방법", "land.note": "가입 없이 사용 · 휴대폰과 컴퓨터 모두 가능",
  "land.pick": "내 수준으로 바로 가기", "land.learning": "배우는 언어", "land.level": "내 수준", "land.go": "이야기 읽기",
  "land.featured": "추천", "land.beta": "베타", "land.more": "다른 언어 (베타)", "land.anyLang": "어떤 언어로든 시작하세요", "land.stories": "개 이야기",
  "land.f1t": "내 수준에 맞는 이야기", "land.f1": "이야기마다 아는 단어 비율이 표시돼요. “딱 좋아요” 표시가 있는 이야기를 고르세요.",
  "land.f2t": "단어를 누르세요", "land.f2": "뜻, 발음, 예문, 수준, 그리고 der/die/das 색깔.",
  "land.f3t": "자연스러운 음성", "land.f3": "모든 이야기에 녹음이 있고 읽는 문장이 강조돼요. 0.75배로 느리게 들을 수 있어요.",
  "land.f4t": "오늘의 계획", "land.f4": "하루에 이야기 하나, 단어 다섯 개, 받아쓰기 하나: 약 10분.",
  "land.f5t": "말하기와 쓰기", "land.f5": "소리 내어 읽고 인식된 단어를 확인하세요. 이야기에 대해 쓰고 첨삭을 받아요.",
  "land.f6t": "시험 연습", "land.f6": "Goethe 형식의 시간제 시험, 문법 수업, 수준 테스트.",
  "land.ui": "화면 언어",
  "home.title": "오늘의 읽기", "home.forYou": "추천", "home.daily": "오늘", "home.search": "이야기 검색", "home.addText": "글 추가",
  "home.minToday": "분 (오늘)", "home.streak": "일 연속", "home.known": "단어 앎", "home.toReview": "복습",
  "plan.title": "오늘의 계획", "plan.sub": "약 10분", "plan.story": "이야기 하나 읽기", "plan.words": "단어 5개 복습", "plan.dictation": "받아쓰기 하나", "plan.done": "오늘 계획 완료! 내일 만나요.", "plan.go": "시작",
  "prac.title": "연습", "prac.words": "단어", "prac.listen": "듣기와 쓰기", "prac.exams": "문법과 시험", "prac.notebook": "단어장",
  "note.title": "단어장", "note.words": "단어", "note.saved": "저장한 이야기", "note.history": "기록", "note.texts": "내 글",
  "set.title": "설정", "set.ui": "앱 언어", "set.translate": "번역과 뜻 언어", "set.text": "글자 크기", "set.goal": "하루 목표", "set.theme": "테마", "set.romanize": "한국어 아래 로마자 표시",
  "me.title": "진도",
};

const de: Dict = {
  "nav.home": "Start", "nav.notebook": "Notizbuch", "nav.watch": "Videos", "nav.practice": "Üben", "nav.dictionary": "Wörterbuch", "nav.me": "Ich", "nav.settings": "Einstellungen",
  "land.eyebrow": "Deutsch lernen mit Geschichten", "land.title1": "Lies Geschichten, die du", "land.title2": "fast", "land.title3": "verstehst.",
  "land.lead": "Originale Geschichten von A1 bis C1. Tippe auf jedes Wort für die Bedeutung, höre natürliche Aufnahmen und übe mit Diktat, Karteikarten und Prüfungsaufgaben.",
  "land.start": "Kostenlos lesen", "land.how": "So funktioniert es", "land.note": "Kein Konto nötig · auf Handy und Computer",
  "land.pick": "Direkt zu deinem Niveau", "land.learning": "Ich lerne", "land.level": "Mein Niveau", "land.go": "Geschichte lesen",
  "land.featured": "Empfohlen", "land.beta": "Beta", "land.more": "Weitere Sprachen (Beta)", "land.anyLang": "Mit jeder Sprache starten", "land.stories": "Geschichten",
  "land.f1t": "Geschichten auf deinem Niveau", "land.f1": "Jede Geschichte zeigt, wie viele Wörter du schon kennst. Wähle die mit „Genau richtig“.",
  "land.f2t": "Tippe auf jedes Wort", "land.f2": "Bedeutung, Aussprache, Beispiele, Niveau und der/die/das in Farbe.",
  "land.f3t": "Natürliche Aufnahmen", "land.f3": "Jede Geschichte ist vertont, der aktuelle Satz wird markiert. Langsamer mit 0,75×.",
  "land.f4t": "Tagesplan", "land.f4": "Eine Geschichte, fünf Wörter und ein Diktat am Tag: etwa 10 Minuten.",
  "land.f5t": "Sprechen und schreiben", "land.f5": "Lies laut vor und sieh, welche Wörter erkannt wurden. Schreib über die Geschichte und erhalte Korrekturen.",
  "land.f6t": "Prüfungstraining", "land.f6": "Zeitprüfungen im Goethe-Stil, Grammatik und Einstufungstests.",
  "land.ui": "Sprache der Oberfläche",
  "home.title": "Heute lesen", "home.forYou": "Für dich", "home.daily": "Täglich", "home.search": "Geschichten suchen", "home.addText": "Text hinzufügen",
  "home.minToday": "Min. heute", "home.streak": "Tage in Folge", "home.known": "Wörter bekannt", "home.toReview": "wiederholen",
  "plan.title": "Plan für heute", "plan.sub": "Etwa 10 Minuten", "plan.story": "Eine Geschichte lesen", "plan.words": "5 Wörter wiederholen", "plan.dictation": "Ein Diktat schreiben", "plan.done": "Alles erledigt. Bis morgen!", "plan.go": "Los",
  "prac.title": "Üben", "prac.words": "Wörter", "prac.listen": "Hören und schreiben", "prac.exams": "Grammatik und Prüfungen", "prac.notebook": "Notizbuch",
  "note.title": "Notizbuch", "note.words": "Wörter", "note.saved": "Gespeicherte Geschichten", "note.history": "Verlauf", "note.texts": "Meine Texte",
  "set.title": "Einstellungen", "set.ui": "Sprache der App", "set.translate": "Übersetzungen und Bedeutungen auf", "set.text": "Textgröße", "set.goal": "Tagesziel", "set.theme": "Design", "set.romanize": "Umschrift unter Koreanisch",
  "me.title": "Fortschritt",
};

const DICTS: Record<string, Dict> = { en, uz, ru, ko, de };

export function translateUi(lang: string, key: string): string {
  return DICTS[lang]?.[key] ?? en[key] ?? key;
}

/** `t("home.title")` in the learner's chosen app language, falling back to English. */
export function useT() {
  const [{ uiLang }] = useSettings();
  return (key: string) => translateUi(uiLang, key);
}
