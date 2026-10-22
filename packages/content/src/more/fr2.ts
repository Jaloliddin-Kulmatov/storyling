import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Tom": ["name", "Tom (a name)"], "Max": ["name", "Max (the puppy's name)"], "Anna": ["name", "Anna (a name)"], "Hugo": ["name", "Hugo (a name)"],
  "acheter": ["verb", "to buy"], "pomme": ["noun", "apple"], "banane": ["noun", "banana"], "rouge": ["adjective", "red"], "jaune": ["adjective", "yellow"],
  "payer": ["verb", "to pay"], "trois": ["number", "three"], "euro": ["noun", "euro"], "vendeur": ["noun", "seller (vendeuse = female seller)"], "dire": ["verb", "to say"],
  "merci": ["interjection", "thank you"], "famille": ["noun", "family"], "grand": ["adjective", "big; tall"], "mère": ["noun", "mother"], "professeur": ["noun", "teacher"],
  "père": ["noun", "father"], "cuisinier": ["noun", "cook"], "frère": ["noun", "brother"], "sœur": ["noun", "sister"], "dîner": ["verb", "to have dinner"],
  "ensemble": ["adverb", "together"], "soir": ["noun", "evening"], "samedi": ["noun", "Saturday"], "dormir": ["verb", "to sleep"], "longtemps": ["adverb", "for a long time"],
  "parc": ["noun", "park"], "ami": ["noun", "friend"], "jouer": ["verb", "to play"], "foot": ["noun", "football; soccer"], "regarder": ["verb", "to watch; to look at"],
  "film": ["noun", "film; movie"], "heureux": ["adjective", "happy"], "chiot": ["noun", "puppy"], "marron": ["adjective", "brown"], "aimer": ["verb", "to like; to love"],
  "balle": ["noun", "ball"], "chambre": ["noun", "bedroom"], "appeler": ["verb", "to call; il s'appelle = his name is"], "hiver": ["noun", "winter"],
  "froid": ["adjective", "cold; il fait froid = it is cold"], "neige": ["noun", "snow"], "partout": ["adverb", "everywhere"], "enfant": ["noun", "child"],
  "bonhomme": ["noun", "bonhomme de neige = snowman"], "chocolat": ["noun", "chocolate; hot chocolate"], "chaud": ["adjective", "hot"], "boire": ["verb", "to drink"],
  "perdre": ["verb", "to lose"], "téléphone": ["noun", "phone"], "bus": ["noun", "bus"], "inquiet": ["adjective", "worried"], "société": ["noun", "company"],
  "chauffeur": ["noun", "driver"], "trouver": ["verb", "to find"], "récupérer": ["verb", "to get back"], "remercier": ["verb", "to thank"], "lendemain": ["noun", "the next day"],
  "hier": ["adverb", "yesterday"], "cuisiner": ["verb", "to cook"], "premier": ["adjective", "first (première fois = first time)"], "fois": ["noun", "time (occurrence)"],
  "faire": ["verb", "to make; to do"], "pâtes": ["noun", "pasta"], "sauce": ["noun", "sauce"], "tomate": ["noun", "tomato"], "trop": ["adverb", "too"], "salé": ["adjective", "salty"],
  "rire": ["verb", "to laugh"], "manger": ["verb", "to eat"], "tout": ["pronoun", "everything"], "prochain": ["adjective", "next"], "utiliser": ["verb", "to use"],
  "moins": ["adverb", "less"], "sel": ["noun", "salt"], "été": ["noun", "summer"], "dernier": ["adjective", "last"], "aller": ["verb", "to go"], "montagne": ["noun", "mountain"],
  "marcher": ["verb", "to walk"], "cinq": ["number", "five"], "heure": ["noun", "hour"], "air": ["noun", "air"], "frais": ["adjective", "fresh; cool"], "lac": ["noun", "lake"],
  "clair": ["adjective", "clear"], "cabane": ["noun", "hut; cabin"], "meilleur": ["adjective", "best; better"], "vacances": ["noun", "holiday; vacation"],
  "examen": ["noun", "exam"], "important": ["adjective", "important"], "étudier": ["verb", "to study"], "bibliothèque": ["noun", "library"], "après-midi": ["noun", "afternoon"],
  "stressé": ["adjective", "stressed; nervous"], "savoir": ["verb", "to know"], "soulagé": ["adjective", "relieved"], "réussir": ["verb", "to pass; to succeed"],
  "beaucoup": ["adverb", "a lot"], "chose": ["noun", "thing"], "après": ["preposition", "after"], "lui": ["pronoun", "him; to him"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `fr-${id}`, lang: "fr", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "Chez le marchand de fruits", "At the Fruit Shop", [
    ["Tom achète=acheter des=des pommes=pomme et des=des bananes=banane .", "Tom buys apples and bananas."],
    ["Les=le pommes=pomme sont=être rouges=rouge .", "The apples are red."],
    ["Les=le bananes=banane sont=être jaunes=jaune .", "The bananas are yellow."],
    ["Tom paie=payer trois euros=euro .", "Tom pays three euros."],
    ["La=le vendeuse=vendeur dit=dire : Merci=merci !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "Ma famille", "My Family", [
    ["J'ai=avoir une=un grande=grand famille .", "I have a big family."],
    ["Ma=mon mère est=être professeur .", "My mother is a teacher."],
    ["Mon=mon père est=être cuisinier .", "My father is a cook."],
    ["J'ai=avoir un frère et une=un sœur .", "I have one brother and one sister."],
    ["Nous=nous dînons=dîner ensemble chaque soir .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Mon samedi", "My Saturday", [
    ["Le=le samedi , je dors=dormir longtemps .", "On Saturdays, I sleep for a long time."],
    ["Puis=puis je vais=aller au parc avec mes=mon amis=ami .", "Then I go to the park with my friends."],
    ["Nous=nous jouons=jouer au foot .", "We play football."],
    ["Le=le soir , je regarde=regarder un film .", "In the evening, I watch a film."],
    ["Je=je suis=être heureux .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Notre chiot", "Our New Puppy", [
    ["Nous=nous avons=avoir un nouveau chiot .", "We have a new puppy."],
    ["Il=il est=être petit et marron .", "He is small and brown."],
    ["Il=il aime=aimer jouer avec une=un balle .", "He likes to play with a ball."],
    ["Il=il dort=dormir dans ma=mon chambre .", "He sleeps in my room."],
    ["Il=il s'appelle=appeler Max .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Un jour de neige", "Snow Day", [
    ["C'est=être l'hiver=hiver .", "It is winter."],
    ["Il=il fait=faire très froid .", "It is very cold."],
    ["Il=il y a=avoir de la=le neige partout .", "There is snow everywhere."],
    ["Les=le enfants=enfant font=faire un bonhomme de neige .", "The children make a snowman."],
    ["Puis=puis ils boivent=boire un chocolat chaud .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "Le téléphone perdu", "The Lost Phone", [
    ["Anna a=avoir perdu=perdre son téléphone dans le bus .", "Anna lost her phone on the bus."],
    ["Elle=elle était=être très inquiète=inquiet .", "She was very worried."],
    ["Elle=elle a=avoir appelé=appeler la=le société de bus .", "She called the bus company."],
    ["Un=un chauffeur avait=avoir trouvé=trouver le téléphone .", "A driver had found the phone."],
    ["Le=le lendemain , elle l'a=avoir récupéré=récupérer et l'a=avoir remercié=remercier .", "The next day, she got it back and thanked him."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Un dîner pour mes amis", "Dinner for Friends", [
    ["Hier=hier , j'ai=avoir cuisiné=cuisiner pour mes=mon amis=ami pour la=le première=premier fois .", "Yesterday, I cooked for my friends for the first time."],
    ["J'ai=avoir fait=faire des=des pâtes à la=le sauce tomate .", "I made pasta with tomato sauce."],
    ["La=le sauce était=être trop salée=salé .", "The sauce was too salty."],
    ["Mais=mais mes=mon amis=ami ont=avoir ri=rire et tout mangé=manger .", "But my friends laughed and ate everything."],
    ["La=le prochaine=prochain fois , j'utiliserai=utiliser moins de sel .", "Next time, I will use less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "À la montagne", "In the Mountains", [
    ["L'été=été dernier , nous sommes=être allés=aller à la=le montagne .", "Last summer, we went to the mountains."],
    ["Nous=nous marchions=marcher cinq heures=heure par jour .", "We walked five hours a day."],
    ["L'air=air était=être frais et les=le lacs=lac très clairs=clair .", "The air was fresh and the lakes were very clear."],
    ["Le=le soir , nous dormions=dormir dans une=un petite=petit cabane .", "In the evening, we slept in a small hut."],
    ["C'étaient=être nos=notre meilleures=meilleur vacances .", "It was our best holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "Le grand examen", "The Big Exam", [
    ["Demain=demain , Hugo a=avoir un examen important .", "Tomorrow, Hugo has an important exam."],
    ["Il=il étudie=étudier à la=le bibliothèque tout l'après-midi=après-midi .", "He studies in the library all afternoon."],
    ["Il=il est=être stressé , mais il sait=savoir beaucoup de choses=chose .", "He is nervous, but he knows a lot of things."],
    ["Après=après l'examen=examen , il se sent=sentir soulagé .", "After the exam, he feels relieved."],
    ["Il=il a=avoir réussi=réussir !", "He passed!"],
  ]),
];
