import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Tommaso": ["name", "Tommaso (a name)"], "Max": ["name", "Max (the puppy's name)"], "Anna": ["name", "Anna (a name)"], "Luca": ["name", "Luca (a name)"],
  "comprare": ["verb", "to buy"], "mela": ["noun", "apple"], "banana": ["noun", "banana"], "rosso": ["adjective", "red"], "giallo": ["adjective", "yellow"],
  "pagare": ["verb", "to pay"], "tre": ["number", "three"], "euro": ["noun", "euro"], "venditrice": ["noun", "seller (female)"], "dire": ["verb", "to say"], "grazie": ["interjection", "thank you"],
  "famiglia": ["noun", "family"], "grande": ["adjective", "big"], "madre": ["noun", "mother"], "insegnante": ["noun", "teacher"], "padre": ["noun", "father"], "cuoco": ["noun", "cook"],
  "fratello": ["noun", "brother"], "sorella": ["noun", "sister"], "cenare": ["verb", "to have dinner"], "insieme": ["adverb", "together"], "ogni": ["determiner", "every"],
  "sera": ["noun", "evening"], "sabato": ["noun", "Saturday"], "dormire": ["verb", "to sleep"], "tanto": ["adverb", "a lot"], "parco": ["noun", "park"], "amico": ["noun", "friend"],
  "giocare": ["verb", "to play"], "calcio": ["noun", "football; soccer"], "guardare": ["verb", "to watch"], "film": ["noun", "film; movie"], "felice": ["adjective", "happy"],
  "cucciolo": ["noun", "puppy"], "marrone": ["adjective", "brown"], "piacere": ["verb", "to like (gli piace = he likes)"], "palla": ["noun", "ball"], "camera": ["noun", "bedroom"],
  "chiamare": ["verb", "to call; si chiama = his name is"], "inverno": ["noun", "winter"], "freddo": ["noun", "cold; fa freddo = it is cold"], "neve": ["noun", "snow"],
  "dappertutto": ["adverb", "everywhere"], "bambino": ["noun", "child"], "pupazzo": ["noun", "pupazzo di neve = snowman"], "cioccolata": ["noun", "hot chocolate"],
  "caldo": ["adjective", "hot"], "bere": ["verb", "to drink"], "perdere": ["verb", "to lose"], "telefono": ["noun", "phone"], "autobus": ["noun", "bus"],
  "preoccupato": ["adjective", "worried"], "azienda": ["noun", "company"], "autista": ["noun", "driver"], "trovare": ["verb", "to find"], "riavere": ["verb", "to get back"],
  "ringraziare": ["verb", "to thank"], "giorno": ["noun", "day"], "dopo#a": ["adjective", "il giorno dopo = the next day"], "ieri": ["adverb", "yesterday"],
  "cucinare": ["verb", "to cook"], "primo": ["adjective", "first"], "volta": ["noun", "time (occurrence)"], "fare": ["verb", "to make; to do"], "pasta": ["noun", "pasta"],
  "sugo": ["noun", "sauce"], "pomodoro": ["noun", "tomato"], "troppo": ["adverb", "too"], "salato": ["adjective", "salty"], "ridere": ["verb", "to laugh"],
  "mangiare": ["verb", "to eat"], "tutto": ["pronoun", "everything"], "prossimo": ["adjective", "next"], "usare": ["verb", "to use"], "meno": ["adverb", "less"], "sale": ["noun", "salt"],
  "estate": ["noun", "summer"], "scorso": ["adjective", "last"], "andare": ["verb", "to go"], "montagna": ["noun", "mountain; in montagna = to the mountains"],
  "camminare": ["verb", "to walk"], "cinque": ["number", "five"], "ora": ["noun", "hour"], "aria": ["noun", "air"], "fresco": ["adjective", "fresh"], "lago": ["noun", "lake"],
  "limpido": ["adjective", "clear"], "rifugio": ["noun", "mountain hut"], "piccolo": ["adjective", "small"], "bello": ["adjective", "beautiful; best (la più bella)"],
  "vacanza": ["noun", "holiday"], "esame": ["noun", "exam"], "importante": ["adjective", "important"], "studiare": ["verb", "to study"], "biblioteca": ["noun", "library"],
  "pomeriggio": ["noun", "afternoon"], "nervoso": ["adjective", "nervous"], "sapere": ["verb", "to know"], "sollevato": ["adjective", "relieved"], "superare": ["verb", "to pass (an exam)"],
  "molto": ["adverb", "very; a lot"], "più": ["adverb", "more; la più bella = the most beautiful"], "lo#p": ["pronoun", "it; him (l')"], "gli": ["pronoun", "to him"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `it-${id}`, lang: "it", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "Dal fruttivendolo", "At the Fruit Shop", [
    ["Tommaso compra=comprare mele=mela e banane=banana .", "Tommaso buys apples and bananas."],
    ["Le=il mele=mela sono=essere rosse=rosso .", "The apples are red."],
    ["Le=il banane=banana sono=essere gialle=giallo .", "The bananas are yellow."],
    ["Tommaso paga=pagare tre euro .", "Tommaso pays three euros."],
    ["La=il venditrice dice=dire : Grazie=grazie !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "La mia famiglia", "My Family", [
    ["Ho=avere una=uno famiglia grande .", "I have a big family."],
    ["Mia=mio madre è=essere insegnante .", "My mother is a teacher."],
    ["Mio=mio padre è=essere cuoco .", "My father is a cook."],
    ["Ho=avere un=uno fratello e una=uno sorella .", "I have one brother and one sister."],
    ["Ogni=ogni sera ceniamo=cenare insieme .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Il mio sabato", "My Saturday", [
    ["Il=il sabato dormo=dormire tanto .", "On Saturdays, I sleep a lot."],
    ["Poi=poi vado=andare al=a parco con i=il miei=mio amici=amico .", "Then I go to the park with my friends."],
    ["Giochiamo=giocare a calcio .", "We play football."],
    ["La=il sera guardo=guardare un=uno film .", "In the evening, I watch a film."],
    ["Sono=essere felice .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Il nostro cucciolo", "Our New Puppy", [
    ["Abbiamo=avere un=uno cucciolo nuovo .", "We have a new puppy."],
    ["È=essere piccolo e marrone .", "He is small and brown."],
    ["Gli=gli piace=piacere giocare con la=il palla .", "He likes to play with the ball."],
    ["Dorme=dormire in camera mia=mio .", "He sleeps in my room."],
    ["Si=si chiama=chiamare Max .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Un giorno di neve", "Snow Day", [
    ["È=essere inverno .", "It is winter."],
    ["Fa=fare molto freddo .", "It is very cold."],
    ["C'è=essere neve dappertutto .", "There is snow everywhere."],
    ["I=il bambini=bambino fanno=fare un=uno pupazzo di neve .", "The children make a snowman."],
    ["Poi=poi bevono=bere una=uno cioccolata calda=caldo .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "Il telefono perso", "The Lost Phone", [
    ["Anna ha=avere perso=perdere il telefono sull'autobus=autobus .", "Anna lost her phone on the bus."],
    ["Era=essere molto preoccupata=preoccupato .", "She was very worried."],
    ["Ha=avere chiamato=chiamare l'azienda=azienda degli=di autobus .", "She called the bus company."],
    ["Un=uno autista aveva=avere trovato=trovare il telefono .", "A driver had found the phone."],
    ["Il=il giorno dopo=dopo#a l'ha=avere riavuto=riavere e l'ha=avere ringraziato=ringraziare .", "The next day, she got it back and thanked him."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Una cena per gli amici", "Dinner for Friends", [
    ["Ieri=ieri ho=avere cucinato=cucinare per i=il miei=mio amici=amico per la=il prima=primo volta .", "Yesterday, I cooked for my friends for the first time."],
    ["Ho=avere fatto=fare la=il pasta al=a sugo di pomodoro .", "I made pasta with tomato sauce."],
    ["Il=il sugo era=essere troppo salato .", "The sauce was too salty."],
    ["Ma=ma i=il miei=mio amici=amico hanno=avere riso=ridere e hanno=avere mangiato=mangiare tutto .", "But my friends laughed and ate everything."],
    ["La=il prossima=prossimo volta userò=usare meno sale .", "Next time, I will use less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "In montagna", "In the Mountains", [
    ["L'estate=estate scorsa=scorso siamo=essere andati=andare in montagna .", "Last summer, we went to the mountains."],
    ["Camminavamo=camminare cinque ore=ora al=a giorno .", "We walked five hours a day."],
    ["L'aria=aria era=essere fresca=fresco e i=il laghi=lago erano=essere limpidi=limpido .", "The air was fresh and the lakes were clear."],
    ["La=il sera dormivamo=dormire in un=uno piccolo rifugio .", "In the evening, we slept in a small mountain hut."],
    ["È=essere stata=essere la=il vacanza più bella=bello .", "It was the most beautiful holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "Il grande esame", "The Big Exam", [
    ["Domani=domani Luca ha=avere un=uno esame importante .", "Tomorrow, Luca has an important exam."],
    ["Studia=studiare in biblioteca tutto il pomeriggio .", "He studies in the library all afternoon."],
    ["È=essere nervoso , ma sa=sapere molto .", "He is nervous, but he knows a lot."],
    ["Dopo=dopo l'esame=esame si sente=sentire sollevato .", "After the exam, he feels relieved."],
    ["L'ha=avere superato=superare !", "He passed it!"],
  ]),
];
