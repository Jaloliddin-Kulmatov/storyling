import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
// Everyday pack 2 (English). The same 9 stories exist in every language.
export const dict: Record<string, RawEntry> = {
  "Tom": ["name", "Tom (a name)"], "Max": ["name", "Max (the puppy's name)"], "Anna": ["name", "Anna (a name)"], "Ben": ["name", "Ben (a name)"],
  "apple": ["noun", "a round red or green fruit"], "red": ["adjective", "the color of blood"], "yellow": ["adjective", "the color of the sun"],
  "pay": ["verb", "to give money for something"], "three": ["number", "3"], "euro": ["noun", "money used in Europe"], "seller": ["noun", "a person who sells things"],
  "thank": ["verb", "to say thanks"], "teacher": ["noun", "a person who teaches"], "cook": ["noun", "a person who makes food"], "dinner": ["noun", "the evening meal"],
  "together": ["adverb", "with each other"], "Saturday": ["noun", "the day before Sunday"], "football": ["noun", "a game with a ball and two goals"],
  "watch": ["verb", "to look at for a time"], "film": ["noun", "a movie"], "puppy": ["noun", "a young dog"], "brown": ["adjective", "the color of chocolate"],
  "ball": ["noun", "a round thing for games"], "room": ["noun", "a part of a house with walls"], "winter": ["noun", "the coldest season"],
  "snow": ["noun", "white frozen rain"], "everywhere": ["adverb", "in all places"], "snowman": ["noun", "a figure made of snow"],
  "lose": ["verb", "to not be able to find"], "phone": ["noun", "a device for calling people"], "worried": ["adjective", "afraid that something is wrong"],
  "call": ["verb", "to phone someone"], "company": ["noun", "a business"], "driver": ["noun", "a person who drives"], "find": ["verb", "to see what you were looking for"],
  "back": ["adverb", "get back = have again"], "yesterday": ["noun", "the day before today"], "first": ["adjective", "number one in order"], "time": ["noun", "an occasion; minutes and hours"],
  "pasta": ["noun", "Italian food like spaghetti"], "tomato": ["noun", "a soft red fruit used in cooking"], "sauce": ["noun", "a thick liquid served with food"],
  "salty": ["adjective", "with a lot of salt"], "everything": ["pronoun", "all things"], "will": ["verb", "used for the future"], "use": ["verb", "to do something with a thing"],
  "less": ["determiner", "not as much"], "salt": ["noun", "white grains that make food salty"], "mountain": ["noun", "a very high hill"], "five": ["number", "5"],
  "air": ["noun", "what we breathe"], "lake": ["noun", "a large area of water with land around it"], "clear": ["adjective", "easy to see through"],
  "hut": ["noun", "a small simple house"], "holiday": ["noun", "time off for rest or travel"], "important": ["adjective", "mattering a lot"],
  "exam": ["noun", "a test at school"], "study": ["verb", "to learn from books"], "library": ["noun", "a place with books to read or borrow"],
  "afternoon": ["noun", "the time between noon and evening"], "nervous": ["adjective", "a little afraid"], "relieved": ["adjective", "happy that a worry is over"],
  "pass": ["verb", "to succeed in a test"], "long": ["adverb", "for a long time"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `en-${id}`, lang: "en", level, cat, min, date, title, tt: "", sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "At the Fruit Shop", [
    ["Tom buys=buy apples=apple and bananas=banana ."],
    ["The=the apples=apple are=be red ."],
    ["The=the bananas=banana are=be yellow ."],
    ["Tom pays=pay three euros=euro ."],
    ["The=the seller says=say : Thank=thank you !"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "My Family", [
    ["I have a big family ."],
    ["My=my mother is=be a teacher ."],
    ["My=my father is=be a cook ."],
    ["I have one brother and one sister ."],
    ["We=we eat dinner together every evening ."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "My Saturday", [
    ["On=on Saturday , I sleep long ."],
    ["Then=then I go to the park with my friends=friend ."],
    ["We=we play football ."],
    ["In=in the evening , I watch a film ."],
    ["I am=be happy ."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Our New Puppy", [
    ["We=we have a new puppy ."],
    ["He=he is=be small and brown ."],
    ["He=he likes=like to play with a ball ."],
    ["He=he sleeps=sleep in my room ."],
    ["His=his name is=be Max ."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Snow Day", [
    ["It=it is=be winter ."],
    ["It=it is=be very cold=cold#a ."],
    ["There=there is=be snow everywhere ."],
    ["The=the children=child make a snowman ."],
    ["Then=then they drink hot chocolate ."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "The Lost Phone", [
    ["Anna lost=lose her phone on the bus ."],
    ["She=she was=be very worried ."],
    ["She=she called=call the bus company ."],
    ["A=a driver had=have found=find the phone ."],
    ["The=the next day , she got=get it back and thanked=thank him=he ."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Dinner for Friends", [
    ["Yesterday=yesterday , I cooked=cook for my friends=friend for the first time ."],
    ["I made=make pasta with tomato sauce ."],
    ["The=the sauce was=be too salty ."],
    ["But=but my friends=friend laughed=laugh and ate=eat everything ."],
    ["Next=next time , I will use less salt ."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "In the Mountains", [
    ["Last=last summer , we went=go to the mountains=mountain ."],
    ["We=we walked=walk for five hours=hour every day ."],
    ["The=the air was=be fresh and the lakes=lake were=be very clear ."],
    ["In=in the evening , we slept=sleep in a small hut ."],
    ["It=it was=be our best holiday ."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "The Big Exam", [
    ["Tomorrow=tomorrow , Ben has=have an=a important exam ."],
    ["He=he studies=study in the library all afternoon ."],
    ["He=he is=be nervous , but he knows=know a lot ."],
    ["After=after the exam , he feels=feel relieved ."],
    ["He=he passed=pass !"],
  ]),
];
