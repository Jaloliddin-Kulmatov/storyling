import type { LangCode } from "@storyling/core";
import { TURKISH } from "./grammar-tr";

/**
 * Grammar exercises. Original explanations and sentences written for Storyling.
 * Each exercise is a multiple-choice gap: `q` has a ___ gap (or asks for the correct sentence), `a` is the right
 * option, `o` the options (the app shuffles them), `why` explains the answer, `tr` is an English translation.
 */
export interface GrammarItem {
  q: string;
  a: string;
  o: string[];
  why: string;
  tr?: string;
}

export interface GrammarTopic {
  id: string;
  lang: LangCode;
  level: string;
  title: string;
  /** Short explanation: paragraphs separated by blank lines; lines starting with "- " are list items. */
  explain: string;
  items: GrammarItem[];
}

export type Row = [q: string, a: string, o: string[], why: string, tr?: string];
export const makeTopic = (lang: LangCode) => (id: string, level: string, title: string, explain: string, rows: Row[]): GrammarTopic => ({
  id: `${lang}-${id}`,
  lang,
  level,
  title,
  explain,
  items: rows.map(([q, a, o, why, tr]) => ({ q, a, o, why, ...(tr ? { tr } : {}) })),
});

const PICK = "Which sentence is correct?";

const topic = makeTopic("de");

export const GRAMMAR: GrammarTopic[] = [
  // ───────────── A1 ─────────────
  topic("sein-haben", "A1", "sein and haben", "The two most important verbs. Learn them by heart.\n\n- ich bin · du bist · er/sie/es ist · wir sind · ihr seid · sie/Sie sind\n- ich habe · du hast · er/sie/es hat · wir haben · ihr habt · sie/Sie haben", [
    ["Ich ___ aus Usbekistan.", "bin", ["bin", "bist", "ist"], "With ich, sein is bin.", "I am from Uzbekistan."],
    ["Du ___ einen Bruder.", "hast", ["habe", "hast", "hat"], "With du, haben is hast.", "You have a brother."],
    ["Wir ___ müde.", "sind", ["sind", "seid", "ist"], "With wir, sein is sind.", "We are tired."],
    ["Er ___ heute keine Zeit.", "hat", ["hat", "hast", "haben"], "With er, haben is hat.", "He has no time today."],
    ["Ihr ___ in der Schule.", "seid", ["seid", "sind", "bist"], "With ihr, sein is seid.", "You (all) are at school."],
  ]),
  topic("present-regular", "A1", "Regular verbs in the present", "Take the stem (infinitive without -en) and add an ending.\n\n- ich -e · du -st · er/sie/es -t · wir -en · ihr -t · sie/Sie -en\n\nIf the stem ends in -t or -d (arbeiten, finden), add an extra -e- before -st and -t: du arbeitest, er arbeitet.", [
    ["Ich ___ gern Kaffee. (trinken)", "trinke", ["trinke", "trinkst", "trinkt"], "ich + -e.", "I like drinking coffee."],
    ["Du ___ in Berlin. (wohnen)", "wohnst", ["wohne", "wohnst", "wohnt"], "du + -st.", "You live in Berlin."],
    ["Er ___ Deutsch. (lernen)", "lernt", ["lernen", "lernt", "lernst"], "er + -t.", "He is learning German."],
    ["Wir ___ Fußball. (spielen)", "spielen", ["spielen", "spielt", "spiele"], "wir + -en.", "We play football."],
    ["Ihr ___ viel. (arbeiten)", "arbeitet", ["arbeitet", "arbeiten", "arbeite"], "The stem ends in -t, so ihr gets -et: arbeitet.", "You (all) work a lot."],
  ]),
  topic("articles", "A1", "Articles and gender", "Every German noun has a gender: der (masculine), die (feminine), das (neuter). In the plural it is always die.\n\n- der Tisch · die Lampe · das Auto · die Autos\n- ein Tisch · eine Lampe · ein Auto\n\nLearn each noun together with its article.", [
    ["___ Tisch ist groß.", "Der", ["Der", "Die", "Das"], "It is der Tisch.", "The table is big."],
    ["___ Lampe ist neu.", "Die", ["Der", "Die", "Das"], "It is die Lampe.", "The lamp is new."],
    ["___ Auto ist rot.", "Das", ["Der", "Die", "Das"], "It is das Auto.", "The car is red."],
    ["Das ist ___ Frau.", "eine", ["ein", "eine", "einen"], "Frau is feminine: eine Frau.", "That is a woman."],
    ["Das ist ___ Buch.", "ein", ["ein", "eine", "einen"], "Buch is neuter: ein Buch.", "That is a book."],
  ]),
  topic("accusative", "A1", "The accusative (direct object)", "The direct object (what is seen, bought, eaten) is in the accusative. Only the masculine changes.\n\n- der → den · ein → einen\n- die, das, die (plural) and eine, ein stay the same\n\nIch sehe den Mann. Ich sehe die Frau. Ich sehe das Kind.", [
    ["Ich sehe ___ Mann.", "den", ["den", "der", "dem"], "Mann is masculine and the object, so der becomes den.", "I see the man."],
    ["Sie kauft ___ Apfel.", "einen", ["ein", "einen", "einer"], "Apfel is masculine: ein becomes einen.", "She buys an apple."],
    ["Wir haben ___ Hund.", "einen", ["ein", "einen", "einem"], "Hund is masculine: einen Hund.", "We have a dog."],
    ["Er liest ___ Zeitung.", "die", ["die", "den", "der"], "Zeitung is feminine, and feminine does not change in the accusative.", "He reads the newspaper."],
    ["Ich möchte ___ Kaffee.", "einen", ["ein", "einen", "einem"], "Kaffee is masculine: einen Kaffee.", "I would like a coffee."],
  ]),
  topic("word-order", "A1", "Word order: the verb in second place", "In a statement the conjugated verb is always in second position. If you start with another word (time, place), the subject moves after the verb.\n\n- Ich gehe heute ins Kino.\n- Heute gehe ich ins Kino.", [
    [PICK, "Heute gehe ich ins Kino.", ["Heute gehe ich ins Kino.", "Heute ich gehe ins Kino.", "Heute ich ins Kino gehe."], "The verb must be second: Heute gehe ich …"],
    [PICK, "Morgen fahren wir nach Berlin.", ["Morgen fahren wir nach Berlin.", "Morgen wir fahren nach Berlin.", "Wir morgen fahren nach Berlin."], "After Morgen, the verb comes second."],
    [PICK, "Am Montag habe ich frei.", ["Am Montag habe ich frei.", "Am Montag ich habe frei.", "Am Montag ich frei habe."], "The verb is second, then the subject."],
    [PICK, "Dann trinken wir Tee.", ["Dann trinken wir Tee.", "Dann wir trinken Tee.", "Dann wir Tee trinken."], "The verb stays in second position."],
    [PICK, "Im Sommer fahre ich ans Meer.", ["Im Sommer fahre ich ans Meer.", "Im Sommer ich fahre ans Meer.", "Im Sommer ans Meer fahre ich."], "Im Sommer is one unit; the verb follows it."],
  ]),
  topic("questions", "A1", "Asking questions", "Yes/no questions start with the verb. Open questions start with a question word, then the verb.\n\n- Question words: wer (who) · was (what) · wo (where) · woher (from where) · wohin (to where) · wann (when) · wie (how) · warum (why)\n- Wohnst du in Berlin? · Wo wohnst du?", [
    ["___ wohnst du?", "Wo", ["Wo", "Wer", "Wann"], "You ask about a place: wo.", "Where do you live?"],
    ["___ heißt du?", "Wie", ["Wie", "Was", "Wann"], "Wie heißt du? is the fixed question for a name.", "What is your name?"],
    ["___ kommt er? – Aus Spanien.", "Woher", ["Woher", "Wohin", "Wo"], "The answer gives the origin (aus): woher.", "Where is he from?"],
    ["___ du Hunger?", "Hast", ["Hast", "Bist", "Habe"], "Hunger haben: du hast. A yes/no question starts with the verb.", "Are you hungry?"],
    ["___ ist das? – Das ist mein Bruder.", "Wer", ["Wer", "Was", "Wo"], "The answer is a person: wer.", "Who is that?"],
  ]),
  topic("negation", "A1", "Negation: nicht and kein", "- kein negates a noun with ein or no article: Ich habe kein Auto. Wir haben keine Zeit.\n- nicht negates everything else (verbs, adjectives, the): Er kommt nicht. Die Suppe ist nicht heiß.\n\nkein has the same endings as ein: kein, keine, kein, keine (plural).", [
    ["Ich habe ___ Auto.", "kein", ["kein", "keine", "nicht"], "A noun without article is negated with kein (Auto is neuter).", "I don't have a car."],
    ["Er kommt ___ heute.", "nicht", ["nicht", "kein", "keine"], "A verb is negated with nicht.", "He is not coming today."],
    ["Das ist ___ Problem.", "kein", ["kein", "keine", "nicht"], "Problem is neuter: kein Problem.", "That is no problem."],
    ["Wir haben ___ Zeit.", "keine", ["keine", "kein", "nicht"], "Zeit is feminine: keine Zeit.", "We have no time."],
    ["Die Suppe ist ___ heiß.", "nicht", ["nicht", "kein", "keine"], "An adjective is negated with nicht.", "The soup is not hot."],
  ]),
  topic("plural", "A1", "Plural of nouns", "German plurals are not regular, so learn each noun with its plural. Common patterns: -e (Tisch → Tische), -n/-en (Frau → Frauen), -er (Kind → Kinder, Buch → Bücher), -s (Auto → Autos), or no ending.", [
    ["ein Buch → zwei ___", "Bücher", ["Bücher", "Buchs", "Bucher"], "Buch becomes Bücher (-er and an umlaut)."],
    ["eine Frau → zwei ___", "Frauen", ["Frauen", "Fraus", "Fraue"], "Feminine nouns often take -n/-en."],
    ["ein Auto → zwei ___", "Autos", ["Autos", "Autoe", "Autoen"], "Many foreign words take -s."],
    ["ein Tisch → zwei ___", "Tische", ["Tische", "Tischen", "Tischer"], "Many masculine nouns take -e."],
    ["ein Kind → zwei ___", "Kinder", ["Kinder", "Kinde", "Kinds"], "Kind becomes Kinder (-er)."],
  ]),
  topic("modals", "A1", "Modal verbs: können, müssen, wollen", "Modal verbs give the second verb a meaning (ability, duty, wish). The modal is conjugated in position 2; the main verb goes to the end in the infinitive.\n\n- können: ich kann · du kannst · er kann · wir können · ihr könnt\n- müssen: ich muss · du musst · er muss · wir müssen · ihr müsst\n- wollen: ich will · du willst · er will · wir wollen · ihr wollt", [
    ["Ich ___ gut schwimmen.", "kann", ["kann", "kannst", "können"], "With ich: kann.", "I can swim well."],
    ["Du ___ jetzt gehen.", "musst", ["muss", "musst", "müssen"], "With du: musst.", "You have to go now."],
    ["Wir ___ Pizza essen.", "wollen", ["wollen", "will", "willst"], "With wir: wollen.", "We want to eat pizza."],
    ["Ihr ___ heute lernen.", "müsst", ["müsst", "muss", "müssen"], "With ihr: müsst.", "You (all) have to study today."],
    ["Er ___ Deutsch sprechen.", "kann", ["kann", "können", "kannst"], "With er: kann (no -t).", "He can speak German."],
  ]),
  topic("separable", "A1", "Separable verbs", "Many verbs have a prefix that separates in a main clause and goes to the end: aufstehen → Ich stehe um sieben Uhr auf. Common prefixes: an-, auf-, aus-, ein-, mit-, zu-.", [
    [PICK, "Ich stehe um sieben Uhr auf.", ["Ich stehe um sieben Uhr auf.", "Ich aufstehe um sieben Uhr.", "Ich stehe sieben Uhr um auf."], "The prefix auf goes to the end."],
    [PICK, "Der Zug kommt um acht Uhr an.", ["Der Zug kommt um acht Uhr an.", "Der Zug ankommt um acht Uhr.", "Der Zug an kommt um acht Uhr."], "ankommen splits: kommt … an."],
    [PICK, "Wir kaufen heute ein.", ["Wir kaufen heute ein.", "Wir einkaufen heute.", "Wir ein kaufen heute."], "einkaufen splits: kaufen … ein."],
    [PICK, "Er ruft mich jeden Tag an.", ["Er ruft mich jeden Tag an.", "Er anruft mich jeden Tag.", "Er ruft an mich jeden Tag."], "anrufen splits: ruft … an."],
    [PICK, "Mach bitte das Fenster zu!", ["Mach bitte das Fenster zu!", "Zumach bitte das Fenster!", "Mach zu bitte das Fenster!"], "zumachen splits, also in a command."],
  ]),
  topic("possessives", "A1", "Possessive articles", "mein (my) · dein (your) · sein (his/its) · ihr (her) · unser (our) · euer (your, plural) · ihr (their). They take the same endings as ein/kein: mein Vater, meine Mutter, mein Kind, meine Eltern. Masculine object (accusative): meinen Vater.", [
    ["Das ist ___ Mutter. (ich)", "meine", ["mein", "meine", "meinen"], "Mutter is feminine: meine.", "That is my mother."],
    ["Ich liebe ___ Vater. (ich)", "meinen", ["mein", "meinen", "meine"], "Vater is masculine and the object: meinen.", "I love my father."],
    ["Wo ist ___ Handy? (du)", "dein", ["dein", "deine", "deinen"], "Handy is neuter: dein.", "Where is your phone?"],
    ["Er besucht ___ Großmutter. (er)", "seine", ["sein", "seine", "seinen"], "Großmutter is feminine: seine.", "He visits his grandmother."],
    ["Wir mögen ___ Lehrer. (wir)", "unseren", ["unser", "unseren", "unsere"], "Lehrer is masculine and the object: unseren.", "We like our teacher."],
  ]),

  // ───────────── A2 ─────────────
  topic("dative", "A2", "The dative", "The dative answers wem? (to whom). Articles: der → dem · die → der · das → dem · die (plural) → den (+ -n on the noun).\n\n- After: mit, bei, von, zu, nach, aus, seit\n- With verbs: helfen, gehören, gefallen, danken\n- Personal pronouns: mir, dir, ihm, ihr, uns, euch, ihnen", [
    ["Ich fahre mit ___ Bus.", "dem", ["dem", "den", "der"], "mit always takes the dative; Bus is masculine: dem.", "I go by bus."],
    ["Sie wohnt bei ___ Eltern. (sie)", "ihren", ["ihren", "ihre", "ihrer"], "bei + dative plural: ihren (and Eltern stays).", "She lives with her parents."],
    ["Wir gehen zu ___ Arzt.", "dem", ["dem", "den", "der"], "zu takes the dative; Arzt is masculine: dem.", "We go to the doctor."],
    ["Das Buch gehört ___ Frau.", "der", ["der", "die", "dem"], "gehören takes the dative; Frau is feminine: der.", "The book belongs to the woman."],
    ["Kannst du ___ helfen? (ich)", "mir", ["mir", "mich", "ich"], "helfen takes the dative: mir.", "Can you help me?"],
  ]),
  topic("two-way", "A2", "Two-way prepositions (accusative or dative)", "in, an, auf, über, unter, vor, hinter, neben, zwischen:\n\n- Wohin? (movement to a place) → accusative: Ich lege das Buch auf den Tisch.\n- Wo? (location) → dative: Das Buch liegt auf dem Tisch.", [
    ["Ich lege das Buch auf ___ Tisch.", "den", ["den", "dem", "der"], "Wohin? Movement → accusative; Tisch is masculine: den.", "I put the book on the table."],
    ["Das Buch liegt auf ___ Tisch.", "dem", ["dem", "den", "der"], "Wo? Location → dative: dem.", "The book is on the table."],
    ["Wir gehen in ___ Küche.", "die", ["die", "der", "den"], "Wohin? → accusative; Küche is feminine: die.", "We go into the kitchen."],
    ["Er sitzt in ___ Küche.", "der", ["der", "die", "dem"], "Wo? → dative; feminine: der.", "He sits in the kitchen."],
    ["Das Bild hängt an ___ Wand.", "der", ["der", "die", "den"], "Wo? → dative; Wand is feminine: der.", "The picture hangs on the wall."],
  ]),
  topic("perfekt-haben", "A2", "The perfect tense with haben", "Spoken past: haben (conjugated, position 2) + participle (at the end).\n\n- Regular verbs: ge- + stem + -t → gespielt, gemacht\n- Irregular verbs: ge- + stem + -en → gelesen, gegessen, geschlafen\n- Separable: ange-rufen, eingekauft", [
    ["Ich habe gestern Fußball ___.", "gespielt", ["gespielt", "gespielen", "spielt"], "Regular verb: ge- + spiel + -t.", "I played football yesterday."],
    ["Sie hat ein Buch ___.", "gelesen", ["gelesen", "gelest", "lesen"], "lesen is irregular: gelesen.", "She read a book."],
    ["Wir haben Pizza ___.", "gegessen", ["gegessen", "geessen", "gegesst"], "essen is irregular: gegessen.", "We ate pizza."],
    ["Er hat mich ___.", "angerufen", ["angerufen", "angeruft", "geanrufen"], "anrufen: the ge- goes between the prefix and the verb.", "He called me."],
    ["Hast du gut ___?", "geschlafen", ["geschlafen", "geschläft", "geschlaft"], "schlafen is irregular: geschlafen.", "Did you sleep well?"],
  ]),
  topic("perfekt-sein", "A2", "The perfect tense with sein", "Verbs of movement and change of state use sein: gehen → ist gegangen · fahren → ist gefahren · kommen → ist gekommen · bleiben → ist geblieben · aufstehen → ist aufgestanden.", [
    ["Ich ___ nach Hause gegangen.", "bin", ["bin", "habe", "hat"], "gehen uses sein: ich bin gegangen.", "I went home."],
    ["Wir ___ mit dem Zug gefahren.", "sind", ["sind", "haben", "seid"], "fahren uses sein: wir sind gefahren.", "We travelled by train."],
    ["Er ___ gestern gekommen.", "ist", ["ist", "hat", "hast"], "kommen uses sein: er ist gekommen.", "He came yesterday."],
    ["Sie ___ zu Hause geblieben. (sie, plural)", "sind", ["sind", "haben", "ist"], "bleiben uses sein: sie sind geblieben.", "They stayed at home."],
    ["Ich ___ früh aufgestanden.", "bin", ["bin", "habe", "ist"], "aufstehen uses sein: ich bin aufgestanden.", "I got up early."],
  ]),
  topic("weil-dass", "A2", "Clauses with weil and dass", "In clauses with weil (because) and dass (that), the conjugated verb goes to the end.\n\n- Ich bleibe zu Hause, weil ich krank bin.\n- Er sagt, dass er keine Zeit hat.", [
    ["Ich bleibe zu Hause, weil ich krank ___.", "bin", ["bin", "ist", "habe"], "The verb goes to the end: weil ich krank bin.", "I stay at home because I am ill."],
    ["Er sagt, dass er keine Zeit ___.", "hat", ["hat", "haben", "hast"], "The verb goes to the end; er → hat.", "He says that he has no time."],
    [PICK, "Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.", ["Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.", "Ich lerne Deutsch, weil ich möchte in Deutschland arbeiten.", "Ich lerne Deutsch, weil möchte ich in Deutschland arbeiten."], "After weil, the conjugated verb (möchte) is last."],
    ["Ich weiß, dass du heute ___. (kommen)", "kommst", ["kommst", "kommt", "kommen"], "du → kommst, at the end.", "I know that you are coming today."],
    [PICK, "Sie sagt, dass sie morgen kommt.", ["Sie sagt, dass sie morgen kommt.", "Sie sagt, dass sie kommt morgen.", "Sie sagt, dass kommt sie morgen."], "After dass, the verb is last."],
  ]),
  topic("comparison", "A2", "Comparative and superlative", "- Comparative: adjective + -er (+ als): klein → kleiner, groß → größer, warm → wärmer\n- Superlative: am + adjective + -sten, or der/die/das + adjective + -ste: am schnellsten, der beste Film\n- Irregular: gut – besser – am besten · viel – mehr – am meisten · gern – lieber – am liebsten", [
    ["Mein Bruder ist ___ als ich. (groß)", "größer", ["größer", "großer", "großter"], "groß → größer (with an umlaut).", "My brother is taller than I am."],
    ["Dieses Buch ist ___ als das andere. (gut)", "besser", ["besser", "guter", "gutter"], "gut is irregular: besser.", "This book is better than the other."],
    ["Das ist der ___ Film. (gut)", "beste", ["beste", "gute", "bessere"], "The superlative of gut is best-: der beste Film.", "That is the best film."],
    ["Ich trinke ___ Tee als Kaffee. (gern)", "lieber", ["lieber", "gerner", "mehr"], "gern → lieber.", "I prefer tea to coffee."],
    ["Im Sommer ist es ___ als im Winter. (warm)", "wärmer", ["wärmer", "warmer", "wärmeste"], "warm → wärmer (with an umlaut).", "It is warmer in summer than in winter."],
  ]),
  topic("reflexive", "A2", "Reflexive verbs", "With reflexive verbs the action goes back to the subject: ich freue mich, du freust dich, er freut sich, wir freuen uns, ihr freut euch, sie freuen sich. Other examples: sich waschen, sich treffen, sich beeilen.", [
    ["Ich freue ___ auf das Wochenende.", "mich", ["mich", "dich", "sich"], "ich → mich.", "I am looking forward to the weekend."],
    ["Er wäscht ___ die Hände.", "sich", ["sich", "ihn", "mich"], "er → sich.", "He washes his hands."],
    ["Wir treffen ___ um acht.", "uns", ["uns", "sich", "euch"], "wir → uns.", "We meet at eight."],
    ["Du musst ___ beeilen.", "dich", ["dich", "sich", "mich"], "du → dich.", "You have to hurry."],
    ["Die Kinder freuen ___.", "sich", ["sich", "uns", "euch"], "sie (plural) → sich.", "The children are happy."],
  ]),
  topic("praeteritum", "A2", "Simple past of sein, haben and modals", "In speaking, only these verbs are often used in the simple past:\n\n- sein: ich war · du warst · er war · wir waren · ihr wart\n- haben: ich hatte · du hattest · er hatte · wir hatten\n- modals: ich konnte, musste, wollte, durfte, sollte", [
    ["Gestern ___ ich krank.", "war", ["war", "bin", "wäre"], "Simple past of sein with ich: war.", "Yesterday I was ill."],
    ["Wir ___ letzten Sommer in Italien.", "waren", ["waren", "war", "wart"], "wir → waren.", "We were in Italy last summer."],
    ["Er ___ keine Zeit.", "hatte", ["hatte", "hat", "hatten"], "Simple past of haben with er: hatte.", "He had no time."],
    ["Ich ___ nicht kommen. (können)", "konnte", ["konnte", "kann", "könnte"], "Simple past of können: konnte (no umlaut).", "I could not come."],
    ["Sie ___ nach Hause gehen. (müssen)", "musste", ["musste", "muss", "müsste"], "Simple past of müssen: musste (no umlaut).", "She had to go home."],
  ]),

  // ───────────── B1 ─────────────
  topic("relative", "B1", "Relative clauses", "A relative clause gives more detail about a noun. The relative pronoun has the gender and number of that noun, and the case it has in the relative clause. The verb goes to the end.\n\n- Nominative / accusative: der, die, das, die (masculine accusative: den)\n- Dative: dem, der, dem, denen", [
    ["Der Mann, ___ dort steht, ist mein Lehrer.", "der", ["der", "den", "dem"], "Mann is masculine and the subject of steht: der.", "The man who is standing there is my teacher."],
    ["Die Frau, ___ ich gestern gesehen habe, ist Ärztin.", "die", ["die", "der", "den"], "Frau is feminine and the object: die.", "The woman whom I saw yesterday is a doctor."],
    ["Das Buch, ___ ich lese, ist spannend.", "das", ["das", "dem", "den"], "Buch is neuter and the object: das.", "The book that I am reading is exciting."],
    ["Der Film, ___ wir gesehen haben, war lang.", "den", ["der", "den", "dem"], "Film is masculine and the object: den.", "The film that we saw was long."],
    ["Das ist die Kollegin, mit ___ ich arbeite.", "der", ["der", "die", "dem"], "mit takes the dative; Kollegin is feminine: der.", "That is the colleague with whom I work."],
  ]),
  topic("konjunktiv2", "B1", "Konjunktiv II: wishes and polite requests", "Konjunktiv II expresses unreal situations, wishes and polite requests.\n\n- wäre, hätte, könnte, würde + infinitive\n- Wenn ich Zeit hätte, würde ich kommen. (but I don't have time)\n- Könntest du mir helfen? (more polite than Kannst du …?)", [
    ["Wenn ich Zeit ___, würde ich kommen.", "hätte", ["hätte", "habe", "hatte"], "An unreal condition uses Konjunktiv II: hätte.", "If I had time, I would come."],
    ["Wenn ich du ___, würde ich das nicht tun.", "wäre", ["wäre", "bin", "war"], "Unreal condition: wäre.", "If I were you, I wouldn't do that."],
    ["Ich ___ gern ein Eis.", "hätte", ["hätte", "habe", "hatte"], "Ich hätte gern … is the polite way to order.", "I would like an ice cream."],
    ["An deiner Stelle ___ ich das machen.", "würde", ["würde", "werde", "wurde"], "würde + infinitive gives advice.", "In your place I would do it."],
    ["___ du mir bitte helfen?", "Könntest", ["Könntest", "Konntest", "Könnt"], "Könntest du …? is a polite request.", "Could you help me, please?"],
  ]),
  topic("passive", "B1", "The passive (present)", "The passive focuses on the action, not on who does it: werden + participle (at the end). The doer can be added with von + dative.\n\n- Das Haus wird gebaut. · Die Kinder werden gerufen.\n- Das Auto wird von meinem Vater repariert.", [
    ["Das Haus ___ gebaut.", "wird", ["wird", "ist", "hat"], "Passive: werden + participle; Haus (singular) → wird.", "The house is being built."],
    ["Die Kinder ___ von der Lehrerin gerufen.", "werden", ["werden", "wird", "sind"], "Plural subject → werden.", "The children are called by the teacher."],
    ["In Deutschland ___ viel Bier getrunken.", "wird", ["wird", "werden", "ist"], "The subject is viel Bier (singular) → wird.", "A lot of beer is drunk in Germany."],
    ["Die Briefe ___ heute geschrieben.", "werden", ["werden", "wird", "wurden"], "Plural, present tense → werden.", "The letters are written today."],
    ["Das Auto wird von meinem Vater ___.", "repariert", ["repariert", "reparieren", "gerepariert"], "Verbs ending in -ieren have no ge- in the participle.", "The car is repaired by my father."],
  ]),
  topic("adjective-endings", "B1", "Adjective endings after the article", "After der/die/das, the adjective ends in -e in the nominative singular and in the accusative of feminine and neuter; in all other cases and in the plural it ends in -en.\n\n- der alte Mann · die neue Lampe · das schöne Haus\n- Ich sehe den kleinen Hund. · Die neuen Schuhe · in dem alten Haus", [
    ["Der alt___ Mann liest.", "e", ["e", "en", "er"], "Nominative masculine after der: -e.", "The old man reads."],
    ["Ich sehe den klein___ Hund.", "en", ["e", "en", "er"], "Accusative masculine: -en.", "I see the small dog."],
    ["Die neu___ Schuhe sind teuer.", "en", ["e", "en", "er"], "Plural after die: -en.", "The new shoes are expensive."],
    ["Das schön___ Haus ist groß.", "e", ["e", "en", "er"], "Nominative neuter after das: -e.", "The beautiful house is big."],
    ["Wir wohnen in dem alt___ Haus.", "en", ["e", "en", "er"], "After a preposition with dative: -en.", "We live in the old house."],
  ]),
  topic("wenn-als", "B1", "wenn, als, obwohl, damit", "- als: one event in the past (Als ich ein Kind war, …)\n- wenn: repeated events or the present/future (Wenn es regnet, …)\n- obwohl: although (a contrast)\n- damit: so that (a purpose)\n\nAll of them send the verb to the end of the clause.", [
    ["___ ich ein Kind war, habe ich oft Fußball gespielt.", "Als", ["Als", "Wenn", "Obwohl"], "A single period in the past: als.", "When I was a child, I often played football."],
    ["___ es regnet, bleibe ich zu Hause.", "Wenn", ["Wenn", "Als", "Damit"], "Present situation: wenn.", "When it rains, I stay at home."],
    ["Er geht zur Arbeit, ___ er krank ist.", "obwohl", ["obwohl", "damit", "weil"], "A contrast: obwohl.", "He goes to work although he is ill."],
    ["Ich spare Geld, ___ ich ein Auto kaufen kann.", "damit", ["damit", "obwohl", "als"], "A purpose: damit.", "I save money so that I can buy a car."],
    ["___ ich in Berlin bin, besuche ich immer meine Tante.", "Wenn", ["Wenn", "Als", "Obwohl"], "A repeated event: wenn.", "Whenever I am in Berlin, I visit my aunt."],
  ]),
  topic("zu-infinitive", "B1", "zu + infinitive and um … zu", "Many expressions need an infinitive with zu at the end: Ich habe keine Lust, heute zu arbeiten. With separable verbs, zu goes between the prefix and the verb: aufzustehen.\n\num … zu expresses a purpose: Er lernt Deutsch, um in Deutschland zu studieren.", [
    ["Ich habe keine Lust, heute ___.", "zu arbeiten", ["zu arbeiten", "arbeiten zu", "zu arbeite"], "zu stands directly before the infinitive.", "I don't feel like working today."],
    ["Er lernt Deutsch, ___ in Deutschland zu studieren.", "um", ["um", "damit", "weil"], "A purpose with the same subject: um … zu.", "He learns German in order to study in Germany."],
    ["Es ist schwer, einen Job ___ finden.", "zu", ["zu", "um", "damit"], "After es ist schwer: infinitive with zu.", "It is hard to find a job."],
    ["Ich gehe in die Bibliothek, um ein Buch ___ leihen.", "zu", ["zu", "für", "um"], "um … zu + infinitive.", "I go to the library to borrow a book."],
    [PICK, "Ich versuche, früher aufzustehen.", ["Ich versuche, früher aufzustehen.", "Ich versuche, früher zu aufstehen.", "Ich versuche, früher aufstehen zu."], "With a separable verb, zu goes between prefix and verb: aufzustehen."],
  ]),

  // ───────────── B2 ─────────────
  topic("genitive", "B2", "The genitive", "The genitive shows possession: das Auto des Lehrers, die Tasche der Frau. Masculine and neuter nouns usually add -s/-es. Prepositions with the genitive: wegen, trotz, während, statt.", [
    ["Das ist das Auto ___ Lehrers.", "des", ["des", "der", "dem"], "Masculine genitive: des … -s.", "That is the teacher's car."],
    ["Die Tasche ___ Frau ist rot.", "der", ["der", "des", "die"], "Feminine genitive: der.", "The woman's bag is red."],
    ["Wegen des ___ bleiben wir zu Hause. (Regen)", "Regens", ["Regens", "Regen", "Regenen"], "wegen + genitive; masculine nouns add -s.", "Because of the rain we stay at home."],
    ["Trotz ___ Krankheit arbeitet er.", "seiner", ["seiner", "seine", "seinen"], "trotz + genitive; Krankheit is feminine: seiner.", "In spite of his illness he works."],
    ["Während ___ Sommers war es sehr heiß.", "des", ["des", "der", "dem"], "während + genitive; Sommer is masculine: des Sommers.", "During the summer it was very hot."],
  ]),
  topic("participles", "B2", "Participles as adjectives", "Participles can be used like adjectives and get the normal adjective endings.\n\n- Present participle (-d): the action is going on → das spielende Kind\n- Past participle (ge-): the action is finished → das geschlossene Fenster", [
    ["das ___ Kind (spielen)", "spielende", ["spielende", "gespielte", "spielte"], "The child is playing now: present participle spielend + e.", "the playing child"],
    ["das ___ Fenster (schließen)", "geschlossene", ["geschlossene", "schließende", "schloss"], "A finished action: past participle geschlossen + e.", "the closed window"],
    ["der ___ Hund (schlafen)", "schlafende", ["schlafende", "geschlafene", "schlief"], "The dog is sleeping now: schlafend + e.", "the sleeping dog"],
    ["die ___ Zeitung (lesen)", "gelesene", ["gelesene", "lesende", "lesene"], "A newspaper that has been read: gelesen + e.", "the newspaper that has been read"],
    ["ein ___ Problem (lösen)", "gelöstes", ["gelöstes", "lösendes", "gelöste"], "ein + neuter nominative: ending -es.", "a solved problem"],
  ]),
  topic("connectors", "B2", "Connectors: deshalb, trotzdem, außerdem", "These words link two main clauses. They take position 1, so the verb follows right away in position 2, then the subject.\n\n- Es regnet, deshalb bleibe ich zu Hause. (result)\n- Er ist müde. Trotzdem geht er ins Kino. (contrast)\n- Das Hotel ist günstig. Außerdem liegt es zentral. (addition)", [
    [PICK, "Es regnet, deshalb bleibe ich zu Hause.", ["Es regnet, deshalb bleibe ich zu Hause.", "Es regnet, deshalb ich bleibe zu Hause.", "Es regnet, deshalb bleibe zu Hause ich."], "After deshalb, the verb comes first."],
    ["Er ist müde. ___ geht er noch ins Kino.", "Trotzdem", ["Trotzdem", "Deshalb", "Weil"], "A contrast (although tired): trotzdem.", "He is tired. Even so, he still goes to the cinema."],
    ["Ich habe kein Geld. ___ kann ich den Urlaub nicht bezahlen.", "Deshalb", ["Deshalb", "Trotzdem", "Obwohl"], "A result: deshalb.", "I have no money. That is why I cannot pay for the holiday."],
    ["Das Hotel ist günstig. ___ liegt es zentral.", "Außerdem", ["Außerdem", "Deshalb", "Obwohl"], "An addition: außerdem.", "The hotel is cheap. Besides, it is in the centre."],
    [PICK, "Sie war krank, trotzdem ist sie zur Arbeit gegangen.", ["Sie war krank, trotzdem ist sie zur Arbeit gegangen.", "Sie war krank, trotzdem sie ist zur Arbeit gegangen.", "Sie war krank, trotzdem zur Arbeit ist sie gegangen."], "After trotzdem, the verb comes first."],
  ]),
  topic("passive-extended", "B2", "The passive with modals and in the perfect", "- With a modal: modal + participle + werden → Die Aufgabe muss gemacht werden.\n- Perfect: sein + participle + worden → Das Haus ist 1990 gebaut worden.\n- Simple past: wurde + participle → Der Brief wurde gestern geschrieben.", [
    ["Die Aufgabe muss bis morgen ___ werden.", "erledigt", ["erledigt", "erledigen", "erledigte"], "modal + participle + werden.", "The task has to be done by tomorrow."],
    ["Das Haus ist 1990 gebaut ___.", "worden", ["worden", "geworden", "wurde"], "Passive perfect: participle + worden (not geworden).", "The house was built in 1990."],
    ["Der Brief ___ gestern geschrieben.", "wurde", ["wurde", "wird", "ist"], "Yesterday → simple past: wurde.", "The letter was written yesterday."],
    ["Hier ___ nicht geraucht werden.", "darf", ["darf", "dürfen", "darfst"], "The subject (es/man, singular) → darf.", "Smoking is not allowed here."],
    ["Das Problem kann leicht ___ werden.", "gelöst", ["gelöst", "lösen", "gelöset"], "modal + participle + werden.", "The problem can easily be solved."],
  ]),
];

export const grammarFor = (lang: LangCode): GrammarTopic[] => [...GRAMMAR, ...TURKISH].filter((g) => g.lang === lang);
