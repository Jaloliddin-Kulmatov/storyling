import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Миша": ["name", "Misha (a name)"], "Макс": ["name", "Max (the puppy's name)"], "Аня": ["name", "Anya (a name)"], "Саша": ["name", "Sasha (a name)"],
  "покупать": ["verb", "to buy"], "яблоко": ["noun", "apple"], "банан": ["noun", "banana"], "красный": ["adjective", "red"], "жёлтый": ["adjective", "yellow"],
  "платить": ["verb", "to pay"], "триста": ["number", "three hundred"], "рубль": ["noun", "ruble (Russian money)"], "продавщица": ["noun", "seller (female)"],
  "говорить": ["verb", "to say; to speak"], "спасибо": ["interjection", "thank you"], "большой": ["adjective", "big"], "семья": ["noun", "family"], "мама": ["noun", "mom"],
  "учительница": ["noun", "teacher (female)"], "папа": ["noun", "dad"], "повар": ["noun", "cook"], "брат": ["noun", "brother"], "сестра": ["noun", "sister"],
  "ужинать": ["verb", "to have dinner"], "вместе": ["adverb", "together"], "вечер": ["noun", "evening; каждый вечер = every evening"], "суббота": ["noun", "Saturday"],
  "долго": ["adverb", "for a long time"], "спать": ["verb", "to sleep"], "потом": ["adverb", "then"], "идти": ["verb", "to go (on foot)"], "парк": ["noun", "park"],
  "друг": ["noun", "friend"], "играть": ["verb", "to play"], "футбол": ["noun", "football; soccer"], "смотреть": ["verb", "to watch"], "фильм": ["noun", "film; movie"],
  "счастливый": ["adjective", "happy"], "щенок": ["noun", "puppy"], "маленький": ["adjective", "small"], "коричневый": ["adjective", "brown"], "любить": ["verb", "to love; to like"],
  "мяч": ["noun", "ball"], "комната": ["noun", "room"], "звать": ["verb", "его зовут = his name is"], "зима": ["noun", "winter"], "холодно": ["adverb", "cold (it is cold)"],
  "везде": ["adverb", "everywhere"], "снег": ["noun", "snow"], "ребёнок": ["noun", "child (дети = children)"], "лепить": ["verb", "to make (from snow or clay)"],
  "снеговик": ["noun", "snowman"], "пить": ["verb", "to drink"], "горячий": ["adjective", "hot"], "шоколад": ["noun", "chocolate; горячий шоколад = hot chocolate"],
  "потерять": ["verb", "to lose"], "телефон": ["noun", "phone"], "автобус": ["noun", "bus"], "волноваться": ["verb", "to worry"], "позвонить": ["verb", "to call (by phone)"],
  "автобусный": ["adjective", "bus (adjective)"], "компания": ["noun", "company"], "водитель": ["noun", "driver"], "найти": ["verb", "to find"], "следующий": ["adjective", "next"],
  "день": ["noun", "day"], "получить": ["verb", "to get"], "обратно": ["adverb", "back"], "поблагодарить": ["verb", "to thank"], "вчера": ["adverb", "yesterday"], "для": ["preposition", "for"], "сейчас": ["adverb", "now"], "быть": ["verb", "to be (был = was)"], "улица": ["noun", "street; на улице = outside"],
  "первый": ["adjective", "first"], "раз": ["noun", "time (occurrence)"], "готовить": ["verb", "to cook"], "приготовить": ["verb", "to cook; to make"], "макароны": ["noun", "pasta"],
  "томатный": ["adjective", "tomato (adjective)"], "соус": ["noun", "sauce"], "слишком": ["adverb", "too"], "солёный": ["adjective", "salty"], "смеяться": ["verb", "to laugh"],
  "съесть": ["verb", "to eat (up)"], "всё": ["pronoun", "everything"], "положить": ["verb", "to put"], "меньше": ["adverb", "less"],
  "соль": ["noun", "salt"], "прошлый": ["adjective", "last; past"], "лето": ["noun", "summer"], "ездить": ["verb", "to go (by vehicle, there and back)"], "гора": ["noun", "mountain"],
  "ходить": ["verb", "to walk; to go"], "пять": ["number", "five"], "час": ["noun", "hour"], "воздух": ["noun", "air"], "свежий": ["adjective", "fresh"], "озеро": ["noun", "lake"],
  "чистый": ["adjective", "clean; clear"], "ночевать": ["verb", "to spend the night"], "домик": ["noun", "small house; hut"], "лучший": ["adjective", "best"], "отпуск": ["noun", "holiday"],
  "завтра": ["adverb", "tomorrow"], "важный": ["adjective", "important"], "экзамен": ["noun", "exam"], "учиться": ["verb", "to study"], "заниматься": ["verb", "to study; to work on"],
  "библиотека": ["noun", "library"], "весь": ["determiner", "all; whole"], "нервничать": ["verb", "to be nervous"], "знать": ["verb", "to know"], "много": ["adverb", "a lot"],
  "после": ["preposition", "after"], "облегчение": ["noun", "relief"], "чувствовать": ["verb", "to feel"], "сдать": ["verb", "to pass (an exam)"], "каждый": ["determiner", "every"],
  "у": ["preposition", "at; у меня есть = I have"], "я": ["pronoun", "I; me"], "мы": ["pronoun", "we"], "он": ["pronoun", "he; it"], "она": ["pronoun", "she"], "они": ["pronoun", "they"],
  "и": ["conjunction", "and"], "но": ["conjunction", "but"], "в": ["preposition", "in; to"], "на": ["preposition", "on; at"], "с": ["preposition", "with"], "очень": ["adverb", "very"],
  "есть": ["verb", "there is; to have (у меня есть)"], "один": ["number", "one"], "мой": ["determiner", "my"], "наш": ["determiner", "our"], "это": ["pronoun", "this; it"],
  "новый": ["adjective", "new"], "свой": ["determiner", "one's own"], "его": ["pronoun", "him; it"], "ему": ["pronoun", "to him"], "сегодня": ["adverb", "today"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `ru-${id}`, lang: "ru", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "В овощном магазине", "At the Fruit Shop", [
    ["Миша покупает=покупать яблоки=яблоко и бананы=банан .", "Misha buys apples and bananas."],
    ["Яблоки=яблоко красные=красный .", "The apples are red."],
    ["Бананы=банан жёлтые=жёлтый .", "The bananas are yellow."],
    ["Миша платит=платить триста рублей=рубль .", "Misha pays three hundred rubles."],
    ["Продавщица=продавщица говорит=говорить : Спасибо=спасибо !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "Моя семья", "My Family", [
    ["У=у меня=я большая=большой семья .", "I have a big family."],
    ["Моя=мой мама — учительница .", "My mother is a teacher."],
    ["Мой=мой папа — повар .", "My father is a cook."],
    ["У=у меня=я есть брат и сестра .", "I have a brother and a sister."],
    ["Каждый=каждый вечер мы ужинаем=ужинать вместе .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Моя суббота", "My Saturday", [
    ["В=в субботу=суббота я долго сплю=спать .", "On Saturday, I sleep for a long time."],
    ["Потом=потом я иду=идти в парк с друзьями=друг .", "Then I go to the park with my friends."],
    ["Мы=мы играем=играть в футбол .", "We play football."],
    ["Вечером=вечер я смотрю=смотреть фильм .", "In the evening, I watch a film."],
    ["Я=я счастлив=счастливый .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Наш щенок", "Our New Puppy", [
    ["У=у нас=мы новый щенок .", "We have a new puppy."],
    ["Он=он маленький и коричневый .", "He is small and brown."],
    ["Он=он любит=любить играть=играть с мячом=мяч .", "He likes to play with a ball."],
    ["Он=он спит=спать в моей=мой комнате=комната .", "He sleeps in my room."],
    ["Его=его зовут=звать Макс .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Снежный день", "Snow Day", [
    ["Сейчас=сейчас зима .", "It is winter now."],
    ["На=на улице=улица очень холодно .", "It is very cold outside."],
    ["Везде=везде снег .", "There is snow everywhere."],
    ["Дети=ребёнок лепят=лепить снеговика=снеговик .", "The children make a snowman."],
    ["Потом=потом они пьют=пить горячий шоколад .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "Потерянный телефон", "The Lost Phone", [
    ["Аня потеряла=потерять телефон в автобусе=автобус .", "Anya lost her phone on the bus."],
    ["Она=она очень волновалась=волноваться .", "She was very worried."],
    ["Она=она позвонила=позвонить в автобусную=автобусный компанию=компания .", "She called the bus company."],
    ["Водитель=водитель нашёл=найти телефон .", "A driver had found the phone."],
    ["На=на следующий день она получила=получить его обратно и поблагодарила=поблагодарить водителя=водитель .", "The next day, she got it back and thanked the driver."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Ужин для друзей", "Dinner for Friends", [
    ["Вчера=вчера я первый раз готовил=готовить для друзей=друг .", "Yesterday, I cooked for my friends for the first time."],
    ["Я=я приготовил=приготовить макароны с томатным=томатный соусом=соус .", "I made pasta with tomato sauce."],
    ["Соус=соус был=быть слишком солёный .", "The sauce was too salty."],
    ["Но=но друзья=друг смеялись=смеяться и съели=съесть всё .", "But my friends laughed and ate everything."],
    ["В=в следующий раз я положу=положить меньше соли=соль .", "Next time, I will put in less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "В горах", "In the Mountains", [
    ["Прошлым=прошлый летом=лето мы ездили=ездить в горы=гора .", "Last summer, we went to the mountains."],
    ["Каждый=каждый день мы ходили=ходить пять часов=час .", "Every day, we walked for five hours."],
    ["Воздух=воздух был=быть свежий , а озёра=озеро очень чистые=чистый .", "The air was fresh and the lakes were very clear."],
    ["Вечером=вечер мы ночевали=ночевать в маленьком=маленький домике=домик .", "In the evening, we slept in a small hut."],
    ["Это=это был=быть наш лучший отпуск .", "It was our best holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "Большой экзамен", "The Big Exam", [
    ["Завтра=завтра у Саши=Саша важный экзамен .", "Tomorrow, Sasha has an important exam."],
    ["Он=он весь день занимается=заниматься в библиотеке=библиотека .", "He studies in the library all day."],
    ["Он=он нервничает=нервничать , но знает=знать много .", "He is nervous, but he knows a lot."],
    ["После=после экзамена=экзамен он чувствует=чувствовать облегчение .", "After the exam, he feels relief."],
    ["Он=он сдал=сдать !", "He passed!"],
  ]),
];
