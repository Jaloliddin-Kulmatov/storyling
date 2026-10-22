import type { RawEntry, RawStory } from "../raw";
import { dict as glossary } from "./ko-reading-dict";

/* eslint-disable */
// Korean Level 3 reading texts about Korean culture and daily life. Original texts written for Storyling.
export const dict: Record<string, RawEntry> = glossary;

const L = (id: string, cat: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `ko-${id}`, lang: "ko", level: "Level 3", cat, min: 3, date: "Oct 22", title, tt, sents });

export const stories: RawStory[] = [
  L("hangul", "history", "한글 이야기", "The Story of Hangul", [
    ["한글은=한글 조선의=조선 세종대왕이=세종대왕 만든=만들다 글자예요=글자 .", "Hangul is the alphabet created by King Sejong of the Joseon dynasty."],
    ["그 전에는=전 한국 사람들도=사람 어려운=어렵다 한자를=한자 썼기=쓰다 때문에=때문 글을=글 읽지=읽다 못하는=못하다 사람이=사람 많았어요=많다 .", "Before that, Koreans also used difficult Chinese characters, so many people could not read."],
    ["세종대왕은=세종대왕 백성들이=백성 쉽게=쉽다 배울=배우다 수=수 있는=있다 글자를=글자 만들고=만들다 싶었어요=싶다 .", "King Sejong wanted to create letters that ordinary people could learn easily."],
    ["그래서 1446년에=년 훈민정음을=훈민정음 세상에=세상 알렸어요=알리다 .", "So in 1446, he announced Hunminjeongeum to the world."],
    ["한글은=한글 기본 글자가=글자 스물네 개밖에=개 없어서=없다 배우기=배우다 쉬워요=쉽다 .", "Hangul has only twenty-four basic letters, so it is easy to learn."],
    ["지금도=지금 한국에서는=한국 10월=월 9일을=일 한글날로=한글날 기념해요=기념하다 .", "Even now, Korea celebrates October 9 as Hangul Day."],
  ]),
  L("kimchi", "food", "김치와 김장", "Kimchi and Kimjang", [
    ["김치는=김치 한국 사람들이=사람 거의 매일 먹는=먹다 음식이에요=음식 .", "Kimchi is a food that Koreans eat almost every day."],
    ["배추에=배추 고춧가루 , 마늘 , 젓갈을=젓갈 넣어서=넣다 발효시켜요=발효시키다 .", "Cabbage is mixed with chili powder, garlic and salted seafood and left to ferment."],
    ["겨울이=겨울 오기=오다 전에=전 가족과=가족 이웃이=이웃 모여서=모이다 김치를=김치 많이 담그는데=담그다 , 이것을=이것 김장이라고=김장 해요=하다 .", "Before winter comes, family and neighbors gather and make a lot of kimchi; this is called kimjang."],
    ["김장은=김장 힘들지만=힘들다 서로 돕고=돕다 이야기를=이야기 나누는=나누다 즐거운=즐겁다 시간이기도=시간 해요=하다 .", "Kimjang is hard work, but it is also a fun time of helping each other and talking."],
    ["2013년에=년 김장 문화는=문화 유네스코=유네스코 인류무형문화유산이=인류무형문화유산 되었어요=되다 .", "In 2013, kimjang culture became part of UNESCO's Intangible Cultural Heritage of Humanity."],
    ["요즘은=요즘 김치 냉장고가=냉장고 있어서=있다 김치를=김치 오래 보관할=보관하다 수=수 있어요=있다 .", "These days, there are kimchi refrigerators, so kimchi can be kept for a long time."],
  ]),
  L("chuseok", "culture", "추석", "Chuseok", [
    ["추석은=추석 음력 8월=월 15일에=일 있는=있다 한국의=한국 큰=크다 명절이에요=명절 .", "Chuseok is a major Korean holiday on the 15th day of the 8th lunar month."],
    ["많은=많다 사람들이=사람 고향에=고향 가기=가다 때문에=때문 고속도로가=고속도로 아주 막혀요=막히다 .", "Because many people go to their hometowns, the highways are very congested."],
    ["가족들은=가족 함께 송편을=송편 만들고=만들다 맛있는=맛있다 음식을=음식 준비해요=준비하다 .", "Families make songpyeon together and prepare delicious food."],
    ["아침에는=아침 조상에게=조상 차례를=차례 지내고=지내다 , 산소에=산소 가서=가다 성묘를=성묘 해요=하다 .", "In the morning, they hold a memorial rite for their ancestors and visit the ancestors' graves."],
    ["밤에는=밤 크고=크다 밝은=밝다 보름달을=보름달 보면서=보다 소원을=소원 빌어요=빌다 .", "At night, they look at the big, bright full moon and make a wish."],
    ["추석은=추석 일 년 동안의=동안 수확에=수확 감사하는=감사하다 날이에요=날 .", "Chuseok is a day to give thanks for the year's harvest."],
  ]),
  L("jeju", "travel", "제주도 여행", "A Trip to Jeju Island", [
    ["제주도는=제주도 한국에서=한국 가장 큰=크다 섬이에요=섬 .", "Jeju Island is the largest island in Korea."],
    ["섬 가운데에는=가운데 한국에서=한국 제일 높은=높다 산인=산 한라산이=한라산 있어요=있다 .", "In the middle of the island is Hallasan, the highest mountain in South Korea."],
    ["제주도는=제주도 화산섬이라서=화산섬 검은=검다 돌이=돌 많고=많다 , 집 주변에도=주변 돌담이=돌담 있어요=있다 .", "Because Jeju is a volcanic island, there are many black stones, and there are stone walls around the houses too."],
    ["바다에서는=바다 해녀들이=해녀 산소통=산소통 없이=없이 깊이 들어가서=들어가다 해산물을=해산물 따요=따다 .", "In the sea, haenyeo women dive deep without oxygen tanks and gather seafood."],
    ["해녀 문화는=문화 2016년에=년 유네스코=유네스코 인류무형문화유산이=인류무형문화유산 되었어요=되다 .", "Haenyeo culture became UNESCO Intangible Cultural Heritage in 2016."],
    ["저는=저 다음 휴가 때=때 자전거를=자전거 타고=타다 섬을=섬 한 바퀴=바퀴 돌고=돌다 싶어요=싶다 .", "On my next holiday, I want to ride a bicycle all the way around the island."],
  ]),
  L("ondol", "home", "따뜻한 바닥, 온돌", "Ondol, the Warm Floor", [
    ["한국의=한국 전통 집에는=집 온돌이라는=온돌 특별한=특별하다 난방이=난방 있어요=있다 .", "Traditional Korean houses have a special heating system called ondol."],
    ["부엌에서=부엌 불을=불 때면=때다 뜨거운=뜨겁다 공기가=공기 방 바닥 아래로=아래 지나가요=지나가다 .", "When a fire is lit in the kitchen, hot air passes under the floor of the room."],
    ["그래서 바닥이=바닥 따뜻해지고=따뜻해지다 방 전체가=전체 오래 따뜻해요=따뜻하다 .", "So the floor warms up and the whole room stays warm for a long time."],
    ["옛날 사람들은=사람 의자 대신 바닥에=바닥 앉고=앉다 , 바닥에서=바닥 잤어요=자다 .", "In the past, people sat on the floor instead of on chairs, and slept on the floor."],
    ["지금은=지금 아파트에서도=아파트 뜨거운=뜨겁다 물로=물 바닥을=바닥 데우는=데우다 방식을=방식 많이 써요=쓰다 .", "Today, even apartments often use a system that heats the floor with hot water."],
    ["그래서 한국에서는=한국 집에=집 들어갈=들어가다 때=때 신발을=신발 꼭 벗어요=벗다 .", "That is why, in Korea, you always take off your shoes when you enter a home."],
  ]),
  L("hanbok", "culture", "한복", "Hanbok", [
    ["한복은=한복 한국의=한국 전통 옷이에요=옷 .", "Hanbok is traditional Korean clothing."],
    ["여자 한복은=한복 짧은=짧다 저고리와=저고리 길고=길다 넓은=넓다 치마로=치마 되어=되다 있어요=있다 .", "Women's hanbok consists of a short jacket and a long, wide skirt."],
    ["한복은=한복 색깔이=색깔 밝고=밝다 선이=선 아름다워서=아름답다 외국인에게도=외국인 인기가=인기 많아요=많다 .", "Hanbok has bright colors and beautiful lines, so it is also popular with foreigners."],
    ["요즘 한국 사람들은=사람 주로 명절이나=명절 결혼식 같은=같다 특별한=특별하다 날에=날 한복을=한복 입어요=입다 .", "These days, Koreans mostly wear hanbok on special days such as holidays and weddings."],
    ["서울의=서울 궁궐에서는=궁궐 한복을=한복 입으면=입다 입장료를=입장료 내지=내다 않아도=않다 돼요=되다 .", "At palaces in Seoul, you don't have to pay the entrance fee if you wear hanbok."],
    ["그래서 경복궁 앞에는=앞 한복을=한복 빌려주는=빌려주다 가게가=가게 아주 많아요=많다 .", "That is why there are many shops renting out hanbok in front of Gyeongbokgung Palace."],
  ]),
  L("delivery", "city", "한국의 배달 문화", "Korea's Delivery Culture", [
    ["한국은=한국 배달 문화가=문화 아주 발달한=발달하다 나라예요=나라 .", "Korea is a country with a very developed delivery culture."],
    ["휴대폰 앱으로=앱 주문하면=주문하다 거의 모든 음식을=음식 집까지=집 배달해=배달하다 줘요=주다 .", "If you order with a phone app, almost any food is delivered to your home."],
    ["밤늦게도=밤늦게 치킨이나=치킨 짜장면을=짜장면 시킬=시키다 수=수 있어요=있다 .", "You can order fried chicken or jjajangmyeon even late at night."],
    ["공원이나=공원 한강에서도=한강 위치를=위치 알려=알리다 주면=주다 음식이=음식 도착해요=도착하다 .", "Even in a park or by the Han River, food arrives if you share your location."],
    ["편리하지만=편리하다 일회용 포장재가=포장재 너무 많이 나온다는=나오다 문제도=문제 있어요=있다 .", "It is convenient, but there is also the problem that too much disposable packaging is produced."],
    ["그래서 요즘은=요즘 다회용 그릇을=그릇 쓰는=쓰다 서비스도=서비스 생기고=생기다 있어요=있다 .", "So these days, services that use reusable containers are also appearing."],
  ]),
  L("alone", "home", "처음 혼자 살기", "Living Alone for the First Time", [
    ["민수는=민수 대학교에=대학교 입학하면서=입학하다 처음으로=처음 혼자 살게=살다 되었어요=되다 .", "When Minsu started university, he began living alone for the first time."],
    ["학교 근처에=근처 작은=작다 원룸을=원룸 구했는데=구하다 , 방이=방 생각보다=생각 좁았어요=좁다 .", "He found a small studio near the school, but the room was smaller than he expected."],
    ["처음에는=처음 자유로워서=자유롭다 좋았지만=좋다 , 곧 할=하다 일이=일 많다는=많다 것을=것 알게=알다 되었어요=되다 .", "At first, he liked the freedom, but soon he realized there was a lot to do."],
    ["빨래 , 청소 , 요리를=요리 모두 혼자 해야=하다 했어요=하다 .", "He had to do the laundry, cleaning and cooking all by himself."],
    ["가끔 엄마가=엄마 보내=보내다 준=주다 반찬을=반찬 먹으면서=먹다 집이=집 그리웠어요=그립다 .", "Sometimes, while eating side dishes his mother had sent, he missed home."],
    ["하지만 몇 달이=달 지나자=지나다 민수는=민수 혼자 사는=살다 생활에=생활 익숙해졌어요=익숙해지다 .", "But after a few months, Minsu got used to living on his own."],
  ]),
  L("cafes", "city", "한국의 카페 문화", "Korea's Café Culture", [
    ["한국의=한국 도시에는=도시 한 골목에도=골목 카페가=카페 여러 개=개 있을=있다 정도로=정도 카페가=카페 많아요=많다 .", "Korean cities have so many cafés that there can be several on a single alley."],
    ["카페는=카페 커피를=커피 마시는=마시다 곳일=곳 뿐만=뿐 아니라=아니다 공부하거나=공부하다 일하는=일하다 곳이기도=곳 해요=하다 .", "Cafés are not only places to drink coffee but also places to study or work."],
    ["많은=많다 학생들이=학생 노트북을=노트북 가지고=가지다 와서=오다 몇 시간씩=시간 공부해요=공부하다 .", "Many students bring laptops and study for hours."],
    ["예쁜=예쁘다 인테리어와=인테리어 특별한=특별하다 디저트로=디저트 유명한=유명하다 카페도=카페 많아요=많다 .", "There are also many cafés famous for their pretty interiors and special desserts."],
    ["사람들은=사람 이런 카페에서=카페 사진을=사진 찍어서=찍다 에스엔에스에=에스엔에스 올려요=올리다 .", "People take photos at these cafés and post them on social media."],
    ["한국 사람들에게=사람 카페는=카페 친구를=친구 만나고=만나다 쉬는=쉬다 제2의=제2 집 같은=같다 곳이에요=곳 .", "For Koreans, a café is like a second home where they meet friends and relax."],
  ]),
];
