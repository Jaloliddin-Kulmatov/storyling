import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Tom": ["name", "Tom (a name)"], "Max": ["name", "Max (the puppy's name)"], "Anna": ["name", "Anna (a name)"], "Ben": ["name", "Ben (a name)"],
  "Obstladen": ["noun", "fruit shop"], "kaufen": ["verb", "to buy"], "Apfel": ["noun", "apple"], "Banane": ["noun", "banana"], "rot": ["adjective", "red"], "gelb": ["adjective", "yellow"],
  "bezahlen": ["verb", "to pay"], "drei": ["number", "three"], "Euro": ["noun", "euro"], "Verkäuferin": ["noun", "seller (female)"], "sagen": ["verb", "to say"],
  "danke": ["interjection", "thank you"], "Familie": ["noun", "family"], "groß": ["adjective", "big"], "Mutter": ["noun", "mother"], "Lehrerin": ["noun", "teacher (female)"],
  "Vater": ["noun", "father"], "Koch": ["noun", "cook"], "Bruder": ["noun", "brother"], "Schwester": ["noun", "sister"], "essen": ["verb", "to eat"], "zusammen": ["adverb", "together"],
  "Abendessen": ["noun", "dinner"], "jeder": ["determiner", "every; each"], "Abend": ["noun", "evening"], "Samstag": ["noun", "Saturday"], "schlafen": ["verb", "to sleep"],
  "lange": ["adverb", "for a long time"], "Park": ["noun", "park"], "Freund": ["noun", "friend"], "spielen": ["verb", "to play"], "Fußball": ["noun", "football; soccer"],
  "schauen": ["verb", "to watch; to look"], "Film": ["noun", "film; movie"], "glücklich": ["adjective", "happy"], "Welpe": ["noun", "puppy"], "braun": ["adjective", "brown"],
  "gern": ["adverb", "gladly; spielt gern = likes to play"], "Ball": ["noun", "ball"], "Zimmer": ["noun", "room"], "heißen": ["verb", "to be called"], "Winter": ["noun", "winter"],
  "kalt": ["adjective", "cold"], "überall": ["adverb", "everywhere"], "liegen": ["verb", "to lie; Schnee liegt = there is snow"], "Schnee": ["noun", "snow"], "Kind": ["noun", "child"],
  "bauen": ["verb", "to build"], "Schneemann": ["noun", "snowman"], "trinken": ["verb", "to drink"], "heiß": ["adjective", "hot"], "Schokolade": ["noun", "chocolate; heiße Schokolade = hot chocolate"],
  "verlieren": ["verb", "to lose"], "Handy": ["noun", "mobile phone"], "Bus": ["noun", "bus"], "besorgt": ["adjective", "worried"], "anrufen": ["verb", "to call (by phone)"],
  "Busfirma": ["noun", "bus company"], "Fahrer": ["noun", "driver"], "finden": ["verb", "to find"], "zurückbekommen": ["verb", "to get back"], "danken": ["verb", "to thank"],
  "gestern": ["adverb", "yesterday"], "kochen": ["verb", "to cook"], "erst": ["adjective", "first; zum ersten Mal = for the first time"], "Mal": ["noun", "time (occurrence)"],
  "machen": ["verb", "to make; to do"], "Nudeln": ["noun", "pasta; noodles"], "Tomatensoße": ["noun", "tomato sauce"], "Soße": ["noun", "sauce"], "zu#adv": ["adverb", "too"],
  "salzig": ["adjective", "salty"], "lachen": ["verb", "to laugh"], "aufessen": ["verb", "to eat up"], "alles": ["pronoun", "everything"], "nächst": ["adjective", "next"],
  "nehmen": ["verb", "to take; to use"], "weniger": ["determiner", "less"], "Salz": ["noun", "salt"], "letzt": ["adjective", "last"], "Sommer": ["noun", "summer"],
  "fahren": ["verb", "to go (by vehicle)"], "Berg": ["noun", "mountain; in die Berge = to the mountains"], "wandern": ["verb", "to hike"], "fünf": ["number", "five"],
  "Stunde": ["noun", "hour"], "Luft": ["noun", "air"], "frisch": ["adjective", "fresh"], "See": ["noun", "lake"], "klar": ["adjective", "clear"], "Hütte": ["noun", "hut"],
  "schön": ["adjective", "beautiful; nice"], "Urlaub": ["noun", "holiday; vacation"], "wichtig": ["adjective", "important"], "Prüfung": ["noun", "exam"],
  "lernen": ["verb", "to learn; to study"], "Bibliothek": ["noun", "library"], "Nachmittag": ["noun", "afternoon"], "nervös": ["adjective", "nervous"],
  "wissen": ["verb", "to know"], "erleichtert": ["adjective", "relieved"], "bestehen": ["verb", "to pass (an exam)"], "nach": ["preposition", "after"], "fühlen": ["verb", "sich fühlen = to feel"],
  "ganz": ["adjective", "whole"], "viel": ["determiner", "a lot; much"], "zum": ["contraction", "zu + dem"], "ihm": ["pronoun", "him; to him"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `de-${id}`, lang: "de", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "Im Obstladen", "At the Fruit Shop", [
    ["Tom kauft=kaufen Äpfel=Apfel und Bananen=Banane .", "Tom buys apples and bananas."],
    ["Die=der Äpfel=Apfel sind=sein#v rot .", "The apples are red."],
    ["Die=der Bananen=Banane sind=sein#v gelb .", "The bananas are yellow."],
    ["Tom bezahlt=bezahlen drei Euro .", "Tom pays three euros."],
    ["Die=der Verkäuferin sagt=sagen : Danke=danke !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "Meine Familie", "My Family", [
    ["Ich=ich habe=haben eine=ein große=groß Familie .", "I have a big family."],
    ["Meine=mein Mutter ist=sein#v Lehrerin .", "My mother is a teacher."],
    ["Mein=mein Vater ist=sein#v Koch .", "My father is a cook."],
    ["Ich=ich habe=haben einen=ein Bruder und eine=ein Schwester .", "I have one brother and one sister."],
    ["Jeden=jeder Abend essen=essen wir zusammen Abendessen .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Mein Samstag", "My Saturday", [
    ["Am=an Samstag schlafe=schlafen ich lange .", "On Saturday, I sleep for a long time."],
    ["Dann=dann gehe=gehen ich mit meinen=mein Freunden=Freund in den=der Park .", "Then I go to the park with my friends."],
    ["Wir=wir spielen=spielen Fußball .", "We play football."],
    ["Am=an Abend schaue=schauen ich einen=ein Film .", "In the evening, I watch a film."],
    ["Ich=ich bin=sein#v glücklich .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Unser Welpe", "Our New Puppy", [
    ["Wir=wir haben=haben einen=ein neuen=neu Welpen=Welpe .", "We have a new puppy."],
    ["Er=er ist=sein#v klein und braun .", "He is small and brown."],
    ["Er=er spielt=spielen gern mit einem=ein Ball .", "He likes to play with a ball."],
    ["Er=er schläft=schlafen in meinem=mein Zimmer .", "He sleeps in my room."],
    ["Er=er heißt=heißen Max .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Ein Schneetag", "Snow Day", [
    ["Es=es ist=sein#v Winter .", "It is winter."],
    ["Es=es ist=sein#v sehr kalt .", "It is very cold."],
    ["Überall=überall liegt=liegen Schnee .", "There is snow everywhere."],
    ["Die=der Kinder=Kind bauen=bauen einen=ein Schneemann .", "The children build a snowman."],
    ["Dann=dann trinken=trinken sie heiße=heiß Schokolade .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "Das verlorene Handy", "The Lost Phone", [
    ["Anna hat=haben ihr Handy im Bus verloren=verlieren .", "Anna lost her phone on the bus."],
    ["Sie=sie war=sein#v sehr besorgt .", "She was very worried."],
    ["Sie=sie rief=anrufen die=der Busfirma an=anrufen .", "She called the bus company."],
    ["Ein=ein Fahrer hatte=haben das=der Handy gefunden=finden .", "A driver had found the phone."],
    ["Am=an nächsten=nächst Tag bekam=zurückbekommen sie es zurück=zurückbekommen und dankte=danken ihm .", "The next day, she got it back and thanked him."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Essen für Freunde", "Dinner for Friends", [
    ["Gestern=gestern habe=haben ich zum ersten=erst Mal für meine=mein Freunde=Freund gekocht=kochen .", "Yesterday, I cooked for my friends for the first time."],
    ["Ich=ich habe=haben Nudeln mit Tomatensoße gemacht=machen .", "I made pasta with tomato sauce."],
    ["Die=der Soße war=sein#v zu=zu#adv salzig .", "The sauce was too salty."],
    ["Aber=aber meine=mein Freunde=Freund haben=haben gelacht=lachen und alles aufgegessen=aufessen .", "But my friends laughed and ate everything."],
    ["Nächstes=nächst Mal nehme=nehmen ich weniger Salz .", "Next time, I will use less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "In den Bergen", "In the Mountains", [
    ["Letzten=letzt Sommer sind=sein#v wir in die=der Berge=Berg gefahren=fahren .", "Last summer, we went to the mountains."],
    ["Wir=wir sind=sein#v jeden=jeder Tag fünf Stunden=Stunde gewandert=wandern .", "We hiked five hours every day."],
    ["Die=der Luft war=sein#v frisch und die=der Seen=See waren=sein#v sehr klar .", "The air was fresh and the lakes were very clear."],
    ["Am=an Abend haben=haben wir in einer=ein kleinen=klein Hütte geschlafen=schlafen .", "In the evening, we slept in a small hut."],
    ["Es=es war=sein#v unser schönster=schön Urlaub .", "It was our most beautiful holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "Die große Prüfung", "The Big Exam", [
    ["Morgen=morgen hat=haben Ben eine=ein wichtige=wichtig Prüfung .", "Tomorrow, Ben has an important exam."],
    ["Er=er lernt=lernen den=der ganzen=ganz Nachmittag in der Bibliothek .", "He studies in the library all afternoon."],
    ["Er=er ist=sein#v nervös , aber er weiß=wissen viel .", "He is nervous, but he knows a lot."],
    ["Nach=nach der Prüfung fühlt=fühlen er sich erleichtert .", "After the exam, he feels relieved."],
    ["Er=er hat=haben bestanden=bestehen !", "He passed!"],
  ]),
];
