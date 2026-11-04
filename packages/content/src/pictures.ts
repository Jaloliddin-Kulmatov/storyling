import type { LangCode } from "@storyling/core";

/** Pictures (emoji) for concrete words, used by the picture-matching game. Keyed by lemma. */
const DE: Record<string, string> = {
  Sonne: "☀️", Milch: "🥛", Telefon: "☎️", Oma: "👵", Tomate: "🍅", Käse: "🧀", Erdbeere: "🍓", Kuh: "🐄", Pizza: "🍕",
  Sandburg: "🏰", Supermarkt: "🛒", Hafen: "⚓", Konzert: "🎤", Croissant: "🥐", Kellner: "🤵", "E-Mail": "📧", Müll: "🗑️",
  Glasflasche: "🍾", Knochen: "🦴", Bett: "🛏️", Apfel: "🍎", Banane: "🍌", Euro: "💶", Familie: "👪", Lehrerin: "👩‍🏫",
  Koch: "🧑‍🍳", Fußball: "⚽", Film: "🎬", Welpe: "🐶", Ball: "🏐", Winter: "❄️", Kind: "🧒", Schneemann: "⛄", Schokolade: "🍫",
  Handy: "📱", Bus: "🚌", Nudeln: "🍝", Salz: "🧂", Sommer: "🏖️", Berg: "⛰️", See: "🏞️", Hütte: "🛖", Bibliothek: "📚",
  Zeitschrift: "📰", Planet: "🪐", Träne: "💧", Rauch: "💨", Zwiebel: "🧅", Goldmedaille: "🥇", Glas: "🥃", Teebeutel: "🍵",
  Papier: "📄", Gefängnis: "⛓️", Licht: "💡", Auge: "👁️", Brief: "✉️", Kopfhörer: "🎧", Mikrofon: "🎙️", Flugzeug: "✈️",
  Pferd: "🐴", Zitrone: "🍋", Tablette: "💊", Brunnen: "⛲", Muschel: "🐚", Münze: "🪙", Braunbär: "🐻", Weihnachtsmann: "🎅",
  Schlitten: "🛷", Rentier: "🦌", Mantel: "🧥", Geschenk: "🎁", Ziege: "🐐", Tagebuch: "📔", Feuer: "🔥", Fiedel: "🎻",
  Harfe: "🪕", Pass: "🛂", Stier: "🐂", Prinzessin: "👸", Segel: "⛵", Silber: "🥈", Gold: "🏆", Galaxie: "🌌", Palme: "🌴",
  Nuss: "🥜", Blatt: "🍃", Korb: "🧺", Wüste: "🏜️", Fabrik: "🏭", Auto: "🚗", Gehirn: "🧠", Gorilla: "🦍", Lied: "🎵",
  Markt: "🏪", Pfeffer: "🌶️", Königin: "👑", Maler: "🧑‍🎨", Notizbuch: "📓", Brücke: "🌉", König: "🤴", Satellit: "🛰️",
  Antenne: "📡", Astronaut: "🧑‍🚀", Mond: "🌙", Pyramide: "🔺", Nase: "👃", Tempel: "🛕", Zahnarzt: "🦷", Zahn: "🦷",
  Zahnbürste: "🪥", Gitarre: "🎸", Ritter: "🛡️", Ring: "💍", Wein: "🍷", Weinberg: "🍇", Samurai: "🗡️", Teufel: "😈",
  Theaterstück: "🎭", Vulkanausbruch: "🌋", Internet: "🌐", Socke: "🧦", Tor: "🥅", Hut: "🎩", Schuh: "👞", Schiff: "🚢",
  Eisberg: "🧊", Spinne: "🕷️", Netz: "🕸️", Fliege: "🪰", Mücke: "🦟", Insekt: "🐞", Feuerwerk: "🎆", Musik: "🎶",
  Geld: "💰", Jeans: "👖", Hose: "👖", Kleidung: "👕", Judo: "🥋", Dynamit: "🧨", Polizei: "🚓", Museum: "🏛️", Wald: "🌲",
  Vogel: "🐦", Wind: "🌬️", Baum: "🌳", Pflanze: "🌱", Insel: "🏝️", Kirche: "⛪", Moschee: "🕌", Foto: "📷", Fisch: "🐟",
  Kugelfisch: "🐡", Stein: "🪨", Baby: "👶", Hand: "✋", Finger: "☝️", Riese: "🧌", Pfeil: "🏹", Kopf: "🗣️", Erde: "🌍",
  Fluss: "🏞️", Schach: "♟️", Büro: "🏢", Katze: "🐱", Garten: "🏡", Küche: "🍳", Uhr: "⏰", Wasser: "💧", Brot: "🍞", Ei: "🥚",
  Schule: "🏫", Suppe: "🍲", Regen: "🌧️", Haus: "🏠", Löwe: "🦁", Affe: "🐒", Elefant: "🐘", Geburtstag: "🎂", Kuchen: "🍰",
  Zucker: "🍬", Hotel: "🏨", Fieber: "🤒", Arzt: "🧑‍⚕️", Tee: "🍵", Zug: "🚆", Meer: "🌊", Fenster: "🪟", Dorf: "🏘️",
  Bahnhof: "🚉", Buch: "📖", Stern: "⭐", Nacht: "🌃", Hund: "🐕", Keks: "🍪", Bäckerei: "🥖", Brötchen: "🥯", Kaffee: "☕",
  Schlüssel: "🔑", Sofa: "🛋️", Tür: "🚪", Fahrrad: "🚲", Herz: "❤️", Welle: "🌊", Elfenbein: "🦣", Rüssel: "🐘", Schnabel: "🦜",
};

const PICTURES: Partial<Record<LangCode, Record<string, string>>> = { de: DE };

export function pictureOf(lang: LangCode, lemma: string): string | undefined {
  return PICTURES[lang]?.[lemma];
}

export function pictureWords(lang: LangCode): string[] {
  return Object.keys(PICTURES[lang] ?? {});
}
