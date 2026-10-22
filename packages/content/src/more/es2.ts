import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Tomás": ["name", "Tomás (a name)"], "Max": ["name", "Max (the puppy's name)"], "Ana": ["name", "Ana (a name)"], "Pablo": ["name", "Pablo (a name)"],
  "comprar": ["verb", "to buy"], "manzana": ["noun", "apple"], "plátano": ["noun", "banana"], "rojo": ["adjective", "red"], "amarillo": ["adjective", "yellow"],
  "pagar": ["verb", "to pay"], "tres": ["number", "three"], "euro": ["noun", "euro"], "vendedor": ["noun", "seller"], "decir": ["verb", "to say"], "gracias": ["interjection", "thank you"],
  "familia": ["noun", "family"], "grande": ["adjective", "big"], "madre": ["noun", "mother"], "profesor": ["noun", "teacher (profesora = female teacher)"],
  "padre": ["noun", "father"], "cocinero": ["noun", "cook"], "hermano": ["noun", "brother"], "hermana": ["noun", "sister"], "cenar": ["verb", "to have dinner"],
  "juntos": ["adverb", "together"], "noche": ["noun", "night; evening"], "sábado": ["noun", "Saturday"], "dormir": ["verb", "to sleep"], "mucho": ["adverb", "a lot; much"],
  "parque": ["noun", "park"], "amigo": ["noun", "friend"], "jugar": ["verb", "to play"], "fútbol": ["noun", "football; soccer"], "ver": ["verb", "to see; to watch"],
  "película": ["noun", "film; movie"], "feliz": ["adjective", "happy"], "cachorro": ["noun", "puppy"], "marrón": ["adjective", "brown"], "gustar": ["verb", "to like (le gusta = he likes)"],
  "pelota": ["noun", "ball"], "habitación": ["noun", "room; bedroom"], "llamar": ["verb", "to call; se llama = his name is"], "invierno": ["noun", "winter"],
  "frío": ["noun", "cold; hace frío = it is cold"], "nieve": ["noun", "snow"], "parte": ["noun", "part; por todas partes = everywhere"],
  "niño": ["noun", "child"], "muñeco": ["noun", "doll; muñeco de nieve = snowman"], "chocolate": ["noun", "chocolate; hot chocolate"], "caliente": ["adjective", "hot"],
  "perder": ["verb", "to lose"], "móvil": ["noun", "mobile phone"], "autobús": ["noun", "bus"], "preocupado": ["adjective", "worried"], "empresa": ["noun", "company"],
  "conductor": ["noun", "driver"], "encontrar": ["verb", "to find"], "recuperar": ["verb", "to get back"], "agradecer": ["verb", "to thank"], "ayer": ["adverb", "yesterday"], "para": ["preposition", "for; to"], "del": ["contraction", "de + el = of the; después del = after the"], "dar": ["verb", "to give; dar las gracias = to thank"], "siguiente": ["adjective", "next; following"],
  "cocinar": ["verb", "to cook"], "primero": ["adjective", "first (primera vez = first time)"], "vez": ["noun", "time (occurrence)"], "hacer": ["verb", "to make; to do"],
  "pasta": ["noun", "pasta"], "salsa": ["noun", "sauce"], "tomate": ["noun", "tomato"], "demasiado": ["adverb", "too"], "salado": ["adjective", "salty"],
  "reír": ["verb", "to laugh"], "comer": ["verb", "to eat"], "todo": ["pronoun", "everything; all"], "próximo": ["adjective", "next"], "usar": ["verb", "to use"],
  "menos": ["adverb", "less"], "sal": ["noun", "salt"], "verano": ["noun", "summer"], "pasado": ["adjective", "last; past"], "ir": ["verb", "to go"], "montaña": ["noun", "mountain"],
  "caminar": ["verb", "to walk"], "cinco": ["number", "five"], "hora": ["noun", "hour"], "aire": ["noun", "air"], "fresco": ["adjective", "fresh; cool"], "lago": ["noun", "lake"],
  "claro": ["adjective", "clear"], "cabaña": ["noun", "hut; cabin"], "mejor": ["adjective", "best; better"], "vacaciones": ["noun", "holiday; vacation"],
  "examen": ["noun", "exam"], "importante": ["adjective", "important"], "estudiar": ["verb", "to study"], "biblioteca": ["noun", "library"], "tarde": ["noun", "afternoon"],
  "nervioso": ["adjective", "nervous"], "saber": ["verb", "to know"], "aliviado": ["adjective", "relieved"], "aprobar": ["verb", "to pass (an exam)"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `es-${id}`, lang: "es", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "En la frutería", "At the Fruit Shop", [
    ["Tomás compra=comprar manzanas=manzana y plátanos=plátano .", "Tomás buys apples and bananas."],
    ["Las=el manzanas=manzana son=ser rojas=rojo .", "The apples are red."],
    ["Los=el plátanos=plátano son=ser amarillos=amarillo .", "The bananas are yellow."],
    ["Tomás paga=pagar tres euros=euro .", "Tomás pays three euros."],
    ["El=el vendedor dice=decir : ¡ Gracias=gracias !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "Mi familia", "My Family", [
    ["Tengo=tener una=un familia grande .", "I have a big family."],
    ["Mi=mi madre es=ser profesora=profesor .", "My mother is a teacher."],
    ["Mi=mi padre es=ser cocinero .", "My father is a cook."],
    ["Tengo=tener un hermano y una=un hermana .", "I have one brother and one sister."],
    ["Cada=cada noche cenamos=cenar juntos .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Mi sábado", "My Saturday", [
    ["El=el sábado duermo=dormir mucho .", "On Saturday, I sleep a lot."],
    ["Luego=luego voy=ir al parque con mis=mi amigos=amigo .", "Then I go to the park with my friends."],
    ["Jugamos=jugar al fútbol .", "We play football."],
    ["Por=por la=el noche veo=ver una=un película .", "In the evening, I watch a film."],
    ["Estoy=estar feliz .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Nuestro cachorro", "Our New Puppy", [
    ["Tenemos=tener un cachorro nuevo .", "We have a new puppy."],
    ["Es=ser pequeño y marrón .", "He is small and brown."],
    ["Le=le gusta=gustar jugar con la=el pelota .", "He likes to play with the ball."],
    ["Duerme=dormir en mi=mi habitación .", "He sleeps in my room."],
    ["Se=se llama=llamar Max .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Un día de nieve", "Snow Day", [
    ["Es=ser invierno .", "It is winter."],
    ["Hace=hacer mucho frío .", "It is very cold."],
    ["Hay=haber nieve por todas=todo partes=parte .", "There is snow everywhere."],
    ["Los=el niños=niño hacen=hacer un muñeco de nieve .", "The children make a snowman."],
    ["Luego=luego beben=beber chocolate caliente .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "El móvil perdido", "The Lost Phone", [
    ["Ana perdió=perder su móvil en el autobús .", "Ana lost her phone on the bus."],
    ["Estaba=estar muy preocupada=preocupado .", "She was very worried."],
    ["Llamó=llamar a la=el empresa de autobuses=autobús .", "She called the bus company."],
    ["Un=un conductor había=haber encontrado=encontrar el móvil .", "A driver had found the phone."],
    ["Al=al día siguiente lo=lo recuperó=recuperar y le=le dio=dar las=el gracias .", "The next day, she got it back and thanked him."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Una cena para amigos", "Dinner for Friends", [
    ["Ayer=ayer cociné=cocinar para mis=mi amigos=amigo por primera=primero vez .", "Yesterday I cooked for my friends for the first time."],
    ["Hice=hacer pasta con salsa de tomate .", "I made pasta with tomato sauce."],
    ["La=el salsa estaba=estar demasiado salada=salado .", "The sauce was too salty."],
    ["Pero=pero mis=mi amigos=amigo se=se rieron=reír y comieron=comer todo .", "But my friends laughed and ate everything."],
    ["La=el próxima=próximo vez usaré=usar menos sal .", "Next time, I will use less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "En las montañas", "In the Mountains", [
    ["El=el verano pasado fuimos=ir a las=el montañas=montaña .", "Last summer, we went to the mountains."],
    ["Caminábamos=caminar cinco horas=hora cada día .", "We walked for five hours every day."],
    ["El=el aire era=ser fresco y los=el lagos=lago muy claros=claro .", "The air was fresh and the lakes were very clear."],
    ["Por=por la=el noche dormíamos=dormir en una=un cabaña pequeña=pequeño .", "At night, we slept in a small hut."],
    ["Fueron=ser nuestras=nuestro mejores=mejor vacaciones .", "It was our best holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "El gran examen", "The Big Exam", [
    ["Mañana=mañana Pablo tiene=tener un examen importante .", "Tomorrow, Pablo has an important exam."],
    ["Estudia=estudiar en la=el biblioteca toda=todo la=el tarde .", "He studies in the library all afternoon."],
    ["Está=estar nervioso , pero sabe=saber mucho .", "He is nervous, but he knows a lot."],
    ["Después=después del examen , se=se siente=sentir aliviado .", "After the exam, he feels relieved."],
    ["¡ Aprobó=aprobar !", "He passed!"],
  ]),
];
