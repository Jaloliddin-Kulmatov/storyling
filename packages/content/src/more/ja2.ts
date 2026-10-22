import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "たろう": ["name", "Taro (a name)"], "マックス": ["name", "Max (the puppy's name)"], "あんな": ["name", "Anna (a name)"], "ゆうと": ["name", "Yuto (a name)"],
  "くだものや": ["noun", "fruit shop"], "りんご": ["noun", "apple"], "バナナ": ["noun", "banana"], "かう": ["verb", "to buy"], "あかい": ["adjective", "red"], "きいろい": ["adjective", "yellow"],
  "さんびゃく": ["number", "three hundred"], "えん": ["noun", "yen (Japanese money)"], "はらう": ["verb", "to pay"], "みせ": ["noun", "shop"], "ひと": ["noun", "person"],
  "ありがとう": ["phrase", "thank you"], "ございます": ["verb", "polite ending (ありがとう ございます = thank you very much)"], "いう": ["verb", "to say"],
  "かぞく": ["noun", "family"], "おおい": ["adjective", "many; a lot"], "はは": ["noun", "(my) mother"], "せんせい": ["noun", "teacher"], "ちち": ["noun", "(my) father"],
  "コック": ["noun", "cook; chef"], "あに": ["noun", "(my) older brother"], "いもうと": ["noun", "(my) younger sister"], "ひとり": ["noun", "one person"], "まいばん": ["noun", "every evening"],
  "いっしょに": ["adverb", "together"], "ばんごはん": ["noun", "dinner"], "たべる": ["verb", "to eat"], "どようび": ["noun", "Saturday"], "おそく": ["adverb", "late"],
  "まで": ["particle", "until"], "ねる": ["verb", "to sleep"], "それから": ["conjunction", "and then"], "ともだち": ["noun", "friend"], "こうえん": ["noun", "park"], "いく": ["verb", "to go"],
  "サッカー": ["noun", "football; soccer"], "する": ["verb", "to do; to play (a sport)"], "よる": ["noun", "evening; night"], "えいが": ["noun", "film; movie"], "みる": ["verb", "to watch; to see"],
  "とても": ["adverb", "very"], "たのしい": ["adjective", "fun; happy"], "あたらしい": ["adjective", "new"], "こいぬ": ["noun", "puppy"], "いる": ["verb", "to be; to have (animals)"],
  "ちいさい": ["adjective", "small"], "ちゃいろ": ["noun", "brown"], "です": ["copula", "is (polite)"], "ボール": ["noun", "ball"],
  "あそぶ": ["verb", "to play"], "の": ["particle", "nominalizer; 's"], "が": ["particle", "subject marker"], "すき": ["adjective", "liked; すき です = likes"],
  "わたし": ["pronoun", "I; me"], "へや": ["noun", "room"], "なまえ": ["noun", "name"], "ふゆ": ["noun", "winter"], "うち": ["noun", "home; our house"], "まっしろ": ["adjective", "pure white"], "いま": ["noun", "now"], "さむい": ["adjective", "cold (weather)"],
  "どこ": ["pronoun", "where; どこも = everywhere"], "ゆき": ["noun", "snow"], "こども": ["noun", "child (こどもたち = children)"], "ゆきだるま": ["noun", "snowman"],
  "つくる": ["verb", "to make"], "あたたかい": ["adjective", "warm"], "ココア": ["noun", "hot chocolate; cocoa"], "のむ": ["verb", "to drink"], "バス": ["noun", "bus"],
  "けいたい": ["noun", "mobile phone"], "なくす": ["verb", "to lose"], "しんぱい": ["noun", "worry; しんぱいする = to worry"],
  "かいしゃ": ["noun", "company"], "でんわ": ["noun", "phone call; でんわする = to call"], "うんてんしゅ": ["noun", "driver"], "みつける": ["verb", "to find"],
  "つぎ": ["noun", "next"], "ひ": ["noun", "day"], "かえす": ["verb", "to give back (かえしてもらう = get back)"], "もらう": ["verb", "to receive"], "おれい": ["noun", "thanks; おれいを いう = to thank"],
  "きのう": ["noun", "yesterday"], "はじめて": ["adverb", "for the first time"], "りょうり": ["noun", "cooking; りょうりを つくる = to cook"], "トマト": ["noun", "tomato"],
  "ソース": ["noun", "sauce"], "パスタ": ["noun", "pasta"], "しおからい": ["adjective", "salty"], "すぎる": ["verb", "too (much)"], "でも": ["conjunction", "but"],
  "わらう": ["verb", "to laugh"], "ぜんぶ": ["noun", "all; everything"], "こんど": ["noun", "next time"], "しお": ["noun", "salt"], "すくなく": ["adverb", "less"],
  "きょねん": ["noun", "last year"], "なつ": ["noun", "summer"], "やま": ["noun", "mountain"], "まいにち": ["noun", "every day"], "ごじかん": ["noun", "five hours"],
  "あるく": ["verb", "to walk"], "くうき": ["noun", "air"], "おいしい": ["adjective", "tasty; fresh (air)"], "みずうみ": ["noun", "lake"], "きれい": ["adjective", "clean; clear; pretty"],
  "ちいさな": ["adjective", "small"], "やまごや": ["noun", "mountain hut"], "とまる": ["verb", "to stay (overnight)"], "いちばん": ["adverb", "the most; best"], "いい": ["adjective", "good"],
  "やすみ": ["noun", "holiday; break"], "あした": ["noun", "tomorrow"], "だいじ": ["adjective", "important"], "しけん": ["noun", "exam"], "ある": ["verb", "to be; to have (things)"],
  "ごご": ["noun", "afternoon"], "ずっと": ["adverb", "the whole time"], "としょかん": ["noun", "library"], "べんきょう": ["noun", "study; べんきょうする = to study"],
  "きんちょう": ["noun", "nervousness; きんちょうする = to be nervous"], "けど": ["conjunction", "but"], "たくさん": ["adverb", "a lot"], "しる": ["verb", "to know"],
  "あと": ["noun", "after"], "ほっと": ["adverb", "relieved; ほっとする = to feel relieved"], "ごうかく": ["noun", "passing (an exam); ごうかくする = to pass"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `ja-${id}`, lang: "ja", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "N5", "food", 1, "Oct 22", "くだものやで", "At the Fruit Shop", [
    ["たろうは=たろう りんごと=りんご バナナを=バナナ かいます=かう 。", "Taro buys apples and bananas."],
    ["りんごは=りんご あかい です 。", "The apples are red."],
    ["バナナは=バナナ きいろい です 。", "The bananas are yellow."],
    ["たろうは=たろう さんびゃく えん はらいます=はらう 。", "Taro pays three hundred yen."],
    ["みせの=みせ ひとは=ひと ありがとう ございます と いいます=いう 。", "The shopkeeper says: Thank you very much."],
  ]),
  L("family", "N5", "home", 1, "Oct 22", "わたしの かぞく", "My Family", [
    ["わたしの=わたし かぞくは=かぞく おおい です 。", "My family is big."],
    ["ははは=はは せんせい です 。", "My mother is a teacher."],
    ["ちちは=ちち コック です 。", "My father is a cook."],
    ["あにと=あに いもうとが=いもうと ひとり います=いる 。", "I have an older brother and a younger sister."],
    ["まいばん 、 いっしょに ばんごはんを=ばんごはん たべます=たべる 。", "We have dinner together every evening."],
  ]),
  L("weekend", "N5", "daily", 1, "Oct 22", "わたしの どようび", "My Saturday", [
    ["どようびは=どようび おそく まで ねます=ねる 。", "On Saturday, I sleep until late."],
    ["それから ともだちと=ともだち こうえんに=こうえん いきます=いく 。", "Then I go to the park with my friends."],
    ["サッカーを=サッカー します=する 。", "We play football."],
    ["よる 、 えいがを=えいが みます=みる 。", "In the evening, I watch a film."],
    ["とても たのしい です 。", "It is a lot of fun."],
  ]),
  L("puppy", "N5", "animals", 1, "Oct 22", "あたらしい こいぬ", "Our New Puppy", [
    ["うちに=うち あたらしい こいぬが=こいぬ います=いる 。", "We have a new puppy at home."],
    ["ちいさくて=ちいさい ちゃいろ です 。", "He is small and brown."],
    ["ボールで=ボール あそぶ のが=の すき です 。", "He likes playing with a ball."],
    ["わたしの=わたし へやで=へや ねます=ねる 。", "He sleeps in my room."],
    ["なまえは=なまえ マックス です 。", "His name is Max."],
  ]),
  L("winter", "N5", "weather", 1, "Oct 22", "ゆきの ひ", "Snow Day", [
    ["いまは=いま ふゆ です 。", "It is winter now."],
    ["とても さむい です 。", "It is very cold."],
    ["どこも=どこ ゆきで=ゆき まっしろ です 。", "Everything is white with snow."],
    ["こどもたちが=こども ゆきだるまを=ゆきだるま つくります=つくる 。", "The children make a snowman."],
    ["それから あたたかい ココアを=ココア のみます=のむ 。", "Then they drink hot cocoa."],
  ]),
  L("lostphone", "N4", "city", 2, "Oct 21", "なくした けいたい", "The Lost Phone", [
    ["あんなは=あんな バスで=バス けいたいを=けいたい なくしました=なくす 。", "Anna lost her phone on the bus."],
    ["とても しんぱいしました=しんぱい 。", "She was very worried."],
    ["バスの=バス かいしゃに=かいしゃ でんわしました=でんわ 。", "She called the bus company."],
    ["うんてんしゅが=うんてんしゅ けいたいを=けいたい みつけて=みつける いました=いる 。", "A driver had found the phone."],
    ["つぎの=つぎ ひ 、 けいたいを=けいたい かえして=かえす もらい=もらう 、 おれいを=おれい いいました=いう 。", "The next day, she got the phone back and thanked him."],
  ]),
  L("cooking", "N4", "food", 2, "Oct 21", "ともだちに りょうり", "Dinner for Friends", [
    ["きのう 、 はじめて ともだちに=ともだち りょうりを=りょうり つくりました=つくる 。", "Yesterday, I cooked for my friends for the first time."],
    ["トマト ソースの=ソース パスタを=パスタ つくりました=つくる 。", "I made pasta with tomato sauce."],
    ["ソースが=ソース しおからすぎました=すぎる 。", "The sauce was too salty."],
    ["でも ともだちは=ともだち わらって=わらう 、 ぜんぶ たべました=たべる 。", "But my friends laughed and ate everything."],
    ["こんどは=こんど しおを=しお すくなく します=する 。", "Next time, I will use less salt."],
  ]),
  L("mountains", "N4", "travel", 2, "Oct 21", "やまで", "In the Mountains", [
    ["きょねんの=きょねん なつ 、 やまに=やま いきました=いく 。", "Last summer, we went to the mountains."],
    ["まいにち ごじかん あるきました=あるく 。", "We walked five hours every day."],
    ["くうきが=くうき おいしくて=おいしい 、 みずうみが=みずうみ とても きれい でした=です 。", "The air was fresh and the lakes were very clear."],
    ["よるは=よる ちいさな やまごやに=やまごや とまりました=とまる 。", "At night, we stayed in a small mountain hut."],
    ["いちばん いい やすみ でした=です 。", "It was the best holiday."],
  ]),
  L("exam", "N4", "daily", 2, "Oct 21", "だいじな しけん", "The Big Exam", [
    ["あした 、 ゆうとは=ゆうと だいじな=だいじ しけんが=しけん あります=ある 。", "Tomorrow, Yuto has an important exam."],
    ["ごご ずっと としょかんで=としょかん べんきょうします=べんきょう 。", "He studies in the library all afternoon."],
    ["きんちょうして=きんちょう います=いる けど 、 たくさん しっています=しる 。", "He is nervous, but he knows a lot."],
    ["しけんの=しけん あと 、 ほっと しました=する 。", "After the exam, he feels relieved."],
    ["ごうかくしました=ごうかく ！", "He passed!"],
  ]),
];
