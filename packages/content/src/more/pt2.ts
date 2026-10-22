import type { RawEntry, RawStory } from "../raw";

/* eslint-disable */
export const dict: Record<string, RawEntry> = {
  "Tomás": ["name", "Tomás (a name)"], "Max": ["name", "Max (the puppy's name)"], "Ana": ["name", "Ana (a name)"], "Bruno": ["name", "Bruno (a name)"],
  "comprar": ["verb", "to buy"], "maçã": ["noun", "apple"], "banana": ["noun", "banana"], "vermelho": ["adjective", "red"], "amarelo": ["adjective", "yellow"],
  "pagar": ["verb", "to pay"], "três": ["number", "three"], "real": ["noun", "real (Brazilian money; reais)"], "vendedora": ["noun", "seller (female)"], "dizer": ["verb", "to say"],
  "obrigado": ["interjection", "thank you (obrigada when said by a woman)"], "família": ["noun", "family"], "grande": ["adjective", "big"], "mãe": ["noun", "mother"],
  "professor": ["noun", "teacher (professora = female teacher)"], "pai": ["noun", "father"], "cozinheiro": ["noun", "cook"], "irmão": ["noun", "brother"], "irmã": ["noun", "sister"],
  "jantar": ["verb", "to have dinner"], "junto": ["adverb", "together (juntos)"], "toda": ["determiner", "every (toda noite = every evening)"], "noite": ["noun", "night; evening"],
  "sábado": ["noun", "Saturday"], "dormir": ["verb", "to sleep"], "até": ["preposition", "until; dormir até tarde = sleep in"], "tarde": ["adverb", "late; afternoon"],
  "parque": ["noun", "park"], "amigo": ["noun", "friend"], "jogar": ["verb", "to play"], "futebol": ["noun", "football; soccer"], "assistir": ["verb", "to watch"], "filme": ["noun", "film; movie"],
  "feliz": ["adjective", "happy"], "cachorrinho": ["noun", "puppy"], "marrom": ["adjective", "brown"], "gostar": ["verb", "gostar de = to like"], "brincar": ["verb", "to play (children, animals)"],
  "bola": ["noun", "ball"], "quarto": ["noun", "bedroom"], "chamar": ["verb", "to call; ele se chama = his name is"], "inverno": ["noun", "winter"], "frio": ["noun", "cold; faz frio = it is cold"],
  "neve": ["noun", "snow"], "todo": ["determiner", "all; every; todo lugar = everywhere"], "lugar": ["noun", "place"], "criança": ["noun", "child"], "boneco": ["noun", "boneco de neve = snowman"],
  "chocolate": ["noun", "chocolate; chocolate quente = hot chocolate"], "quente": ["adjective", "hot"], "beber": ["verb", "to drink"], "perder": ["verb", "to lose"], "celular": ["noun", "mobile phone"],
  "ônibus": ["noun", "bus"], "preocupado": ["adjective", "worried"], "ligar": ["verb", "to call (by phone)"], "empresa": ["noun", "company"], "motorista": ["noun", "driver"],
  "encontrar": ["verb", "to find"], "recuperar": ["verb", "to get back"], "agradecer": ["verb", "to thank"], "dia": ["noun", "day"], "seguinte": ["adjective", "next; following"],
  "ontem": ["adverb", "yesterday"], "cozinhar": ["verb", "to cook"], "primeiro": ["adjective", "first"], "vez": ["noun", "time (occurrence)"], "fazer": ["verb", "to make; to do"],
  "macarrão": ["noun", "pasta"], "molho": ["noun", "sauce"], "tomate": ["noun", "tomato"], "salgado": ["adjective", "salty"], "demais": ["adverb", "too much"], "rir": ["verb", "to laugh"],
  "comer": ["verb", "to eat"], "tudo": ["pronoun", "everything"], "próximo": ["adjective", "next"], "usar": ["verb", "to use"], "menos": ["adverb", "less"], "sal": ["noun", "salt"],
  "verão": ["noun", "summer"], "passado": ["adjective", "last; past"], "ir": ["verb", "to go"], "montanha": ["noun", "mountain"], "caminhar": ["verb", "to walk"], "cinco": ["number", "five"],
  "hora": ["noun", "hour"], "ar": ["noun", "air"], "fresco": ["adjective", "fresh"], "lago": ["noun", "lake"], "limpo": ["adjective", "clean; clear"], "cabana": ["noun", "hut; cabin"],
  "pequeno": ["adjective", "small"], "melhor": ["adjective", "best; better"], "férias": ["noun", "holiday; vacation"], "amanhã": ["adverb", "tomorrow"], "prova": ["noun", "exam; test"],
  "importante": ["adjective", "important"], "estudar": ["verb", "to study"], "biblioteca": ["noun", "library"], "nervoso": ["adjective", "nervous"], "saber": ["verb", "to know"],
  "muito": ["adverb", "very; a lot"], "aliviado": ["adjective", "relieved"], "passar": ["verb", "to pass (an exam)"], "depois": ["adverb", "after; depois da = after the"],
  "lhe": ["pronoun", "to him / to her"],
};

const L = (id: string, level: string, cat: string, min: number, date: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `pt-${id}`, lang: "pt", level, cat, min, date, title, tt, sents });

export const stories: RawStory[] = [
  L("fruit", "A1", "food", 1, "Oct 22", "Na feira de frutas", "At the Fruit Shop", [
    ["Tomás compra=comprar maçãs=maçã e bananas=banana .", "Tomás buys apples and bananas."],
    ["As=o maçãs=maçã são=ser vermelhas=vermelho .", "The apples are red."],
    ["As=o bananas=banana são=ser amarelas=amarelo .", "The bananas are yellow."],
    ["Tomás paga=pagar três reais=real .", "Tomás pays three reais."],
    ["A=o vendedora diz=dizer : Obrigada=obrigado !", "The seller says: Thank you!"],
  ]),
  L("family", "A1", "home", 1, "Oct 22", "Minha família", "My Family", [
    ["Eu=eu tenho=ter uma=um família grande .", "I have a big family."],
    ["Minha=meu mãe é=ser professora=professor .", "My mother is a teacher."],
    ["Meu=meu pai é=ser cozinheiro .", "My father is a cook."],
    ["Tenho=ter um irmão e uma=um irmã .", "I have one brother and one sister."],
    ["Toda=toda noite , jantamos=jantar juntos=junto .", "We have dinner together every evening."],
  ]),
  L("weekend", "A1", "daily", 1, "Oct 22", "Meu sábado", "My Saturday", [
    ["No=em sábado , eu durmo=dormir até tarde .", "On Saturday, I sleep in."],
    ["Depois=depois , vou=ir ao parque com meus=meu amigos=amigo .", "Then I go to the park with my friends."],
    ["Nós=nós jogamos=jogar futebol .", "We play football."],
    ["À=a noite , eu assisto=assistir a um filme .", "In the evening, I watch a film."],
    ["Eu=eu estou=estar feliz .", "I am happy."],
  ]),
  L("puppy", "A1", "animals", 1, "Oct 22", "Nosso cachorrinho", "Our New Puppy", [
    ["Nós=nós temos=ter um cachorrinho novo .", "We have a new puppy."],
    ["Ele=ele é=ser pequeno e marrom .", "He is small and brown."],
    ["Ele=ele gosta=gostar de brincar com a=o bola .", "He likes to play with the ball."],
    ["Ele=ele dorme=dormir no=em meu quarto .", "He sleeps in my room."],
    ["Ele=ele se chama=chamar Max .", "His name is Max."],
  ]),
  L("winter", "A1", "weather", 1, "Oct 22", "Um dia de neve", "Snow Day", [
    ["É=ser inverno .", "It is winter."],
    ["Faz=fazer muito frio .", "It is very cold."],
    ["Tem=ter neve em todo lugar .", "There is snow everywhere."],
    ["As=o crianças=criança fazem=fazer um boneco de neve .", "The children make a snowman."],
    ["Depois=depois , elas=ela bebem=beber chocolate quente .", "Then they drink hot chocolate."],
  ]),
  L("lostphone", "A2", "city", 2, "Oct 21", "O celular perdido", "The Lost Phone", [
    ["Ana perdeu=perder o celular no=em ônibus .", "Ana lost her phone on the bus."],
    ["Ela=ela ficou=ficar muito preocupada=preocupado .", "She was very worried."],
    ["Ela=ela ligou=ligar para a=o empresa de ônibus .", "She called the bus company."],
    ["Um=um motorista tinha=ter encontrado=encontrar o celular .", "A driver had found the phone."],
    ["No=em dia seguinte , ela o=o#p recuperou=recuperar e lhe agradeceu=agradecer .", "The next day, she got it back and thanked him."],
  ]),
  L("cooking", "A2", "food", 2, "Oct 21", "Jantar para os amigos", "Dinner for Friends", [
    ["Ontem=ontem , cozinhei=cozinhar para meus=meu amigos=amigo pela=por primeira=primeiro vez .", "Yesterday, I cooked for my friends for the first time."],
    ["Fiz=fazer macarrão com molho de tomate .", "I made pasta with tomato sauce."],
    ["O=o molho estava=estar salgado demais .", "The sauce was too salty."],
    ["Mas=mas meus=meu amigos=amigo riram=rir e comeram=comer tudo .", "But my friends laughed and ate everything."],
    ["Da=de próxima=próximo vez , vou=ir usar menos sal .", "Next time, I will use less salt."],
  ]),
  L("mountains", "A2", "travel", 2, "Oct 21", "Nas montanhas", "In the Mountains", [
    ["No=em verão passado , fomos=ir para as=o montanhas=montanha .", "Last summer, we went to the mountains."],
    ["Caminhávamos=caminhar cinco horas=hora por dia .", "We walked five hours a day."],
    ["O=o ar era=ser fresco e os=o lagos=lago eram=ser muito limpos=limpo .", "The air was fresh and the lakes were very clear."],
    ["À=a noite , dormíamos=dormir numa=em cabana pequena=pequeno .", "At night, we slept in a small hut."],
    ["Foram=ser as=o nossas=nosso melhores=melhor férias .", "It was our best holiday."],
  ]),
  L("exam", "A2", "daily", 2, "Oct 21", "A grande prova", "The Big Exam", [
    ["Amanhã=amanhã , Bruno tem=ter uma=um prova importante .", "Tomorrow, Bruno has an important exam."],
    ["Ele=ele estuda=estudar na=em biblioteca a=o tarde toda=todo .", "He studies in the library all afternoon."],
    ["Ele=ele está=estar nervoso , mas sabe=saber muito .", "He is nervous, but he knows a lot."],
    ["Depois=depois da=de prova , ele se sente=sentir aliviado .", "After the exam, he feels relieved."],
    ["Ele=ele passou=passar !", "He passed!"],
  ]),
];
