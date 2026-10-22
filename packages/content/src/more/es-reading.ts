import type { RawEntry, RawStory } from "../raw";
import { dict as glossary } from "./es-reading-dict";

/* eslint-disable */
// Spanish B1 reading texts: culture, people, travel and everyday life. Original texts written for Storyling.
export const dict: Record<string, RawEntry> = glossary;

const L = (id: string, cat: string, title: string, tt: string, sents: RawStory["sents"]): RawStory =>
  ({ id: `es-${id}`, lang: "es", level: "B1", cat, min: 3, date: "Oct 22", title, tt, sents });

export const stories: RawStory[] = [
  L("tapas", "food", "La cultura de las tapas", "The Culture of Tapas", [
    ["En=en España , salir de tapas=tapa es=ser una=un costumbre muy popular .", "In Spain, going out for tapas is a very popular custom."],
    ["Una=un tapa es=ser una=un porción pequeña=pequeño de comida que se=se sirve=servir con una=un bebida .", "A tapa is a small portion of food that is served with a drink."],
    ["Según=según una=un teoría , antes se=se ponía=poner un trozo de pan sobre el vaso para taparlo=tapar .", "According to one theory, people used to put a piece of bread on the glass to cover it."],
    ["Así=así las=el moscas=mosca no entraban=entrar en la=el bebida .", "That way, flies didn't get into the drink."],
    ["Hoy=hoy los=el amigos=amigo van=ir de bar en bar y prueban=probar platos=plato diferentes=diferente .", "Today, friends go from bar to bar and try different dishes."],
    ["Para=para muchos=mucho españoles=español , lo más importante no es=ser la=el comida , sino la=el conversación .", "For many Spaniards, the most important thing is not the food but the conversation."],
  ]),
  L("camino", "travel", "El Camino de Santiago", "The Way of St. James", [
    ["Cada=cada año , miles de personas=persona caminan=caminar hacia la=el ciudad de Santiago de Compostela , en Galicia .", "Every year, thousands of people walk toward the city of Santiago de Compostela, in Galicia."],
    ["Este=este viaje se=se llama=llamar el Camino=camino de Santiago y tiene=tener más de mil años=año de historia .", "This journey is called the Way of St. James and has more than a thousand years of history."],
    ["Algunos=alguno peregrinos=peregrino lo=lo hacen=hacer por motivos=motivo religiosos=religioso ; otros=otro buscan=buscar tranquilidad o aventura .", "Some pilgrims do it for religious reasons; others look for peace or adventure."],
    ["Los=el peregrinos=peregrino duermen=dormir en albergues=albergue sencillos=sencillo y comparten=compartir la=el comida con gente de todo el mundo .", "The pilgrims sleep in simple hostels and share meals with people from all over the world."],
    ["El=el símbolo del Camino=camino es=ser una=un concha , que se=se ve=ver en muchas=mucho señales=señal .", "The symbol of the Way is a shell, which you can see on many signs."],
    ["Quien=quien camina=caminar al menos los=el últimos=último cien kilómetros=kilómetro recibe=recibir un certificado especial .", "Anyone who walks at least the last hundred kilometers receives a special certificate."],
  ]),
  L("gaudi", "history", "Gaudí y la Sagrada Familia", "Gaudí and the Sagrada Familia", [
    ["Antoni Gaudí fue=ser un arquitecto catalán que vivió=vivir entre 1852 y 1926 .", "Antoni Gaudí was a Catalan architect who lived from 1852 to 1926."],
    ["Sus=su edificios=edificio en Barcelona son=ser famosos=famoso por sus=su formas=forma curvas=curvo y sus=su colores=color .", "His buildings in Barcelona are famous for their curved shapes and their colors."],
    ["Gaudí se=se inspiraba=inspirar en la=el naturaleza : en los=el árboles=árbol , las=el conchas=concha y los=el huesos=hueso .", "Gaudí took inspiration from nature: from trees, shells and bones."],
    ["Su=su obra más conocida=conocido es=ser la=el Sagrada Familia , una=un iglesia enorme .", "His best-known work is the Sagrada Familia, an enormous church."],
    ["La=el construcción empezó=empezar en 1882 y todavía no ha=haber terminado=terminar .", "Construction began in 1882 and still has not finished."],
    ["Cada=cada año , millones=millón de turistas=turista visitan=visitar este edificio único .", "Every year, millions of tourists visit this unique building."],
  ]),
  L("siesta", "culture", "¿Todavía existe la siesta?", "Does the Siesta Still Exist?", [
    ["La=el siesta es=ser un descanso corto después de comer , normalmente en las=el horas=hora de más calor .", "The siesta is a short rest after lunch, usually in the hottest hours."],
    ["En=en el pasado , muchas=mucho tiendas=tienda cerraban=cerrar a mediodía para que la=el gente pudiera=poder dormir .", "In the past, many shops closed at midday so that people could sleep."],
    ["Hoy=hoy en día , la=el mayoría de los=el españoles=español que trabajan=trabajar en ciudades=ciudad no duerme=dormir la=el siesta .", "Nowadays, most Spaniards who work in cities don't take a siesta."],
    ["Sin=sin embargo , en los=el pueblos=pueblo pequeños=pequeño y en verano , la=el tradición sigue=seguir viva=vivo .", "However, in small villages and in summer, the tradition is still alive."],
    ["Algunos=alguno estudios=estudio dicen=decir que una=un siesta de veinte minutos=minuto mejora=mejorar la=el concentración .", "Some studies say that a twenty-minute nap improves concentration."],
    ["Por=por eso , ahora también hay=haber empresas=empresa en otros=otro países=país que tienen=tener salas=sala para descansar .", "That is why there are now also companies in other countries that have rooms for resting."],
  ]),
  L("interview", "work", "Mi primera entrevista de trabajo", "My First Job Interview", [
    ["La=el semana pasada=pasado tuve=tener mi=mi primera=primero entrevista de trabajo en una=un agencia de viajes=viaje .", "Last week, I had my first job interview at a travel agency."],
    ["La=el noche anterior apenas dormí=dormir porque estaba=estar muy nerviosa=nervioso .", "The night before, I hardly slept because I was very nervous."],
    ["Cuando=cuando llegué=llegar , la=el directora me=me ofreció=ofrecer un café y me=me hizo=hacer sentir=sentir tranquila=tranquilo .", "When I arrived, the manager offered me a coffee and made me feel calm."],
    ["Me=me preguntó=preguntar por qué quería=querer el puesto y qué idiomas=idioma hablaba=hablar .", "She asked me why I wanted the job and which languages I spoke."],
    ["Le=le conté=contar que había=haber vivido=vivir un año en Francia y que me=me encanta=encantar ayudar a la=el gente .", "I told her that I had lived in France for a year and that I love helping people."],
    ["Dos=dos días=día después me=me llamaron=llamar : ¡ el trabajo era=ser mío !", "Two days later, they called me: the job was mine!"],
  ]),
  L("volunteer", "people", "Un verano como voluntaria", "A Summer as a Volunteer", [
    ["El=el verano pasado , Lucía decidió=decidir pasar dos meses=mes como voluntaria en un parque natural .", "Last summer, Lucía decided to spend two months as a volunteer in a nature park."],
    ["Su=su trabajo consistía=consistir en limpiar los=el caminos=camino y contar las=el aves=ave del lago .", "Her work consisted of cleaning the paths and counting the birds on the lake."],
    ["Al=al principio le=le costaba=costar levantarse=levantar a las=el cinco de la=el mañana .", "At first, she found it hard to get up at five in the morning."],
    ["Pero=pero pronto se=se acostumbró=acostumbrar y empezó=empezar a disfrutar del silencio .", "But she soon got used to it and began to enjoy the silence."],
    ["También=también hizo=hacer amigos=amigo de muchos=mucho países=país y mejoró=mejorar su inglés .", "She also made friends from many countries and improved her English."],
    ["Ahora=ahora dice=decir que fue=ser la=el mejor experiencia de su vida .", "Now she says it was the best experience of her life."],
  ]),
  L("frida", "people", "Frida Kahlo", "Frida Kahlo", [
    ["Frida Kahlo nació=nacer en 1907 en Coyoacán , un barrio de la=el Ciudad=ciudad de México .", "Frida Kahlo was born in 1907 in Coyoacán, a district of Mexico City."],
    ["Cuando=cuando tenía=tener dieciocho años=año , sufrió=sufrir un grave accidente de autobús .", "When she was eighteen, she was in a serious bus accident."],
    ["Durante=durante los=el largos=largo meses=mes en la=el cama , empezó=empezar a pintar con un espejo .", "During the long months in bed, she began to paint using a mirror."],
    ["Por=por eso muchos=mucho de sus=su cuadros=cuadro son=ser autorretratos=autorretrato llenos=lleno de color y de dolor .", "That is why many of her paintings are self-portraits full of color and pain."],
    ["Se=se casó=casar con el pintor Diego Rivera , y su=su relación fue=ser muy intensa=intenso .", "She married the painter Diego Rivera, and their relationship was very intense."],
    ["Hoy=hoy su=su casa , la=el Casa Azul , es=ser un museo que visitan=visitar personas=persona de todo el mundo .", "Today, her house, the Blue House, is a museum visited by people from all over the world."],
  ]),
  L("recycling", "nature", "Reciclar en casa", "Recycling at Home", [
    ["En=en mi=mi casa separamos=separar la=el basura en cuatro cubos=cubo diferentes=diferente .", "At home, we separate the rubbish into four different bins."],
    ["El=el amarillo es=ser para los=el plásticos=plástico y las=el latas=lata , y el azul , para el papel .", "The yellow one is for plastics and cans, and the blue one for paper."],
    ["El=el vidrio va=ir al contenedor verde que hay=haber en la=el esquina .", "Glass goes in the green container on the corner."],
    ["Al=al principio era=ser un poco complicado , pero ahora lo=lo hacemos=hacer sin pensar .", "At first it was a bit complicated, but now we do it without thinking."],
    ["Además=además , intentamos=intentar comprar menos productos=producto con envases=envase de plástico .", "We also try to buy fewer products in plastic packaging."],
    ["Creo=creer que si cada=cada familia hace=hacer un pequeño esfuerzo , el planeta lo=lo notará=notar .", "I think that if every family makes a small effort, the planet will notice it."],
  ]),
];
