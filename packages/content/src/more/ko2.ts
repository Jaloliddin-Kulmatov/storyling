import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "태민": ["name", "Taemin (a name)"], "맥스": ["name", "Max (the puppy's name)"], "하나": ["name", "Hana (a name)"], "준서": ["name", "Junseo (a name)"],
  "과일": ["noun", "fruit"], "가게": ["noun", "shop"], "사과": ["noun", "apple"], "바나나": ["noun", "banana"], "사다": ["verb", "to buy"], "빨갛다": ["adjective", "to be red"],
  "노랗다": ["adjective", "to be yellow"], "삼천": ["number", "three thousand"], "원": ["noun", "won (Korean money)"], "내다": ["verb", "to pay; to put out"],
  "주인": ["noun", "owner; shopkeeper"], "감사하다": ["adjective", "to be thankful; 감사합니다 = thank you"], "말하다": ["verb", "to say"],
  "가족": ["noun", "family"], "많다": ["adjective", "to be many; to be a lot"], "엄마": ["noun", "mom"], "선생님": ["noun", "teacher"], "아빠": ["noun", "dad"],
  "요리사": ["noun", "cook; chef"], "형": ["noun", "older brother (said by a boy)"], "여동생": ["noun", "younger sister"], "있다": ["verb", "to have; to be"],
  "매일": ["noun", "every day"], "저녁": ["noun", "evening; dinner"], "같이": ["adverb", "together"], "먹다": ["verb", "to eat"], "토요일": ["noun", "Saturday"],
  "늦게": ["adverb", "late"], "까지": ["particle", "until"], "자다": ["verb", "to sleep"], "그다음": ["noun", "after that; then"], "친구": ["noun", "friend"], "공원": ["noun", "park"],
  "가다": ["verb", "to go"], "축구": ["noun", "football; soccer"], "하다": ["verb", "to do; to play (a sport)"], "밤": ["noun", "night; evening"], "영화": ["noun", "film; movie"],
  "보다": ["verb", "to watch; to see"], "정말": ["adverb", "really"], "즐겁다": ["adjective", "to be fun; to be happy"], "우리": ["pronoun", "we; our"], "새": ["determiner", "new"],
  "강아지": ["noun", "puppy"], "작다": ["adjective", "to be small"], "갈색": ["noun", "brown"], "공": ["noun", "ball"], "놀다": ["verb", "to play"], "좋아하다": ["verb", "to like"],
  "제": ["pronoun", "my (polite)"], "방": ["noun", "room"], "이름": ["noun", "name"], "지금": ["noun", "now"], "겨울": ["noun", "winter"], "아주": ["adverb", "very"],
  "춥다": ["adjective", "to be cold (weather)"], "어디나": ["adverb", "everywhere"], "눈": ["noun", "snow"], "아이": ["noun", "child"], "눈사람": ["noun", "snowman"],
  "만들다": ["verb", "to make"], "그리고": ["conjunction", "and; and then"], "따뜻하다": ["adjective", "to be warm"], "코코아": ["noun", "hot cocoa"], "마시다": ["verb", "to drink"],
  "버스": ["noun", "bus"], "휴대폰": ["noun", "mobile phone"], "잃어버리다": ["verb", "to lose"], "너무": ["adverb", "very; too"], "걱정하다": ["verb", "to worry"],
  "회사": ["noun", "company"], "전화하다": ["verb", "to call (by phone)"], "기사": ["noun", "driver"], "찾다": ["verb", "to find"], "다음": ["noun", "next"], "날": ["noun", "day"],
  "돌려받다": ["verb", "to get back"], "고맙다": ["adjective", "to be thankful"], "어제": ["noun", "yesterday"], "처음": ["noun", "the first time"], "친구들": ["noun", "friends"],
  "위하다": ["verb", "-을 위해 = for (someone)"], "요리하다": ["verb", "to cook"], "토마토": ["noun", "tomato"], "소스": ["noun", "sauce"], "파스타": ["noun", "pasta"],
  "짜다": ["adjective", "to be salty"], "하지만": ["conjunction", "but"], "웃다": ["verb", "to laugh"], "다": ["adverb", "all; everything"], "다음번": ["noun", "next time"],
  "소금": ["noun", "salt"], "덜": ["adverb", "less"], "넣다": ["verb", "to put in"], "작년": ["noun", "last year"], "여름": ["noun", "summer"], "산": ["noun", "mountain"],
  "다섯": ["number", "five"], "시간": ["noun", "hour"], "걷다": ["verb", "to walk"], "공기": ["noun", "air"], "상쾌하다": ["adjective", "to be fresh"], "호수": ["noun", "lake"],
  "맑다": ["adjective", "to be clear"], "산장": ["noun", "mountain hut"], "묵다": ["verb", "to stay (overnight)"], "최고": ["noun", "the best"], "휴가": ["noun", "holiday"],
  "내일": ["noun", "tomorrow"], "중요하다": ["adjective", "to be important"], "시험": ["noun", "exam"], "오후": ["noun", "afternoon"], "내내": ["adverb", "all through"],
  "도서관": ["noun", "library"], "공부하다": ["verb", "to study"], "긴장하다": ["verb", "to be nervous"], "많이": ["adverb", "a lot"], "알다": ["verb", "to know"],
  "끝나다": ["verb", "to end"], "후": ["noun", "after"], "마음": ["noun", "mind; heart"], "놓이다": ["verb", "마음이 놓이다 = to feel relieved"], "합격하다": ["verb", "to pass (an exam)"],
  "가지다": ["verb", "to have; 가지고 놀다 = to play with"], "놓다": ["verb", "to put; -아 놓다 = to have done (and left)"], "이다": ["copula", "to be"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `ko-${id}`, lang: "ko", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "Level 1", "food", 1, "Oct 22", "과일 가게에서", "At the Fruit Shop", [
    ["태민이는=태민 사과와=사과 바나나를=바나나 사요=사다 .", "Taemin buys apples and bananas."],
    ["사과는=사과 빨개요=빨갛다 .", "The apples are red."],
    ["바나나는=바나나 노래요=노랗다 .", "The bananas are yellow."],
    ["태민이는=태민 삼천 원을=원 내요=내다 .", "Taemin pays three thousand won."],
    ["가게 주인이=주인 감사합니다=감사하다 하고=하다 말해요=말하다 .", "The shopkeeper says thank you."],
  ]),
  L("family", "Level 1", "home", 1, "Oct 22", "우리 가족", "My Family", [
    ["우리 가족은=가족 많아요=많다 .", "My family is big."],
    ["엄마는=엄마 선생님이에요=선생님 .", "My mother is a teacher."],
    ["아빠는=아빠 요리사예요=요리사 .", "My father is a cook."],
    ["저는=저 형하고=형 여동생이=여동생 있어요=있다 .", "I have an older brother and a younger sister."],
    ["매일 저녁=저녁 우리는=우리 같이 저녁을=저녁 먹어요=먹다 .", "Every evening, we have dinner together."],
  ]),
  L("weekend", "Level 1", "daily", 1, "Oct 22", "나의 토요일", "My Saturday", [
    ["토요일에는=토요일 늦게까지=늦게 자요=자다 .", "On Saturday, I sleep until late."],
    ["그다음에=그다음 친구들과=친구들 공원에=공원 가요=가다 .", "Then I go to the park with my friends."],
    ["우리는=우리 축구를=축구 해요=하다 .", "We play football."],
    ["밤에는=밤 영화를=영화 봐요=보다 .", "In the evening, I watch a film."],
    ["정말 즐거워요=즐겁다 .", "It is really fun."],
  ]),
  L("puppy", "Level 1", "animals", 1, "Oct 22", "우리 강아지", "Our New Puppy", [
    ["우리 집에=집 새 강아지가=강아지 있어요=있다 .", "We have a new puppy at home."],
    ["강아지는=강아지 작고=작다 갈색이에요=갈색 .", "The puppy is small and brown."],
    ["공을=공 가지고=가지다 놀기를=놀다 좋아해요=좋아하다 .", "He likes to play with a ball."],
    ["제 방에서=방 자요=자다 .", "He sleeps in my room."],
    ["이름은=이름 맥스예요=맥스 .", "His name is Max."],
  ]),
  L("winter", "Level 1", "weather", 1, "Oct 22", "눈 오는 날", "Snow Day", [
    ["지금은=지금 겨울이에요=겨울 .", "It is winter now."],
    ["아주 추워요=춥다 .", "It is very cold."],
    ["어디나 눈이=눈 있어요=있다 .", "There is snow everywhere."],
    ["아이들이=아이 눈사람을=눈사람 만들어요=만들다 .", "The children make a snowman."],
    ["그리고 따뜻한=따뜻하다 코코아를=코코아 마셔요=마시다 .", "Then they drink warm cocoa."],
  ]),
  L("lostphone", "Level 2", "city", 2, "Oct 21", "잃어버린 휴대폰", "The Lost Phone", [
    ["하나는=하나 버스에서=버스 휴대폰을=휴대폰 잃어버렸어요=잃어버리다 .", "Hana lost her phone on the bus."],
    ["너무 걱정했어요=걱정하다 .", "She was very worried."],
    ["버스 회사에=회사 전화했어요=전화하다 .", "She called the bus company."],
    ["버스 기사가=기사 휴대폰을=휴대폰 찾아=찾다 놓았어요=놓다 .", "A bus driver had found the phone."],
    ["다음 날 , 하나는=하나 휴대폰을=휴대폰 돌려받고=돌려받다 고맙다고=고맙다 말했어요=말하다 .", "The next day, Hana got her phone back and thanked him."],
  ]),
  L("cooking", "Level 2", "food", 2, "Oct 21", "친구들을 위한 저녁", "Dinner for Friends", [
    ["어제 처음으로=처음 친구들을=친구들 위해=위하다 요리했어요=요리하다 .", "Yesterday, I cooked for my friends for the first time."],
    ["토마토 소스 파스타를=파스타 만들었어요=만들다 .", "I made pasta with tomato sauce."],
    ["소스가=소스 너무 짰어요=짜다 .", "The sauce was too salty."],
    ["하지만 친구들은=친구들 웃으면서=웃다 다 먹었어요=먹다 .", "But my friends laughed and ate everything."],
    ["다음번에는=다음번 소금을=소금 덜 넣을=넣다 거예요=이다 .", "Next time, I will put in less salt."],
  ]),
  L("mountains", "Level 2", "travel", 2, "Oct 21", "산에서", "In the Mountains", [
    ["작년 여름에=여름 우리는=우리 산에=산 갔어요=가다 .", "Last summer, we went to the mountains."],
    ["매일 다섯 시간씩=시간 걸었어요=걷다 .", "We walked five hours every day."],
    ["공기가=공기 상쾌하고=상쾌하다 호수가=호수 아주 맑았어요=맑다 .", "The air was fresh and the lakes were very clear."],
    ["밤에는=밤 작은=작다 산장에서=산장 묵었어요=묵다 .", "At night, we stayed in a small mountain hut."],
    ["최고의=최고 휴가였어요=휴가 .", "It was the best holiday."],
  ]),
  L("exam", "Level 2", "daily", 2, "Oct 21", "중요한 시험", "The Big Exam", [
    ["내일 준서는=준서 중요한=중요하다 시험이=시험 있어요=있다 .", "Tomorrow, Junseo has an important exam."],
    ["오후 내내 도서관에서=도서관 공부해요=공부하다 .", "He studies in the library all afternoon."],
    ["긴장했지만=긴장하다 많이 알아요=알다 .", "He is nervous, but he knows a lot."],
    ["시험이=시험 끝난=끝나다 후에=후 마음이=마음 놓였어요=놓이다 .", "After the exam was over, he felt relieved."],
    ["합격했어요=합격하다 !", "He passed!"],
  ]),
];
