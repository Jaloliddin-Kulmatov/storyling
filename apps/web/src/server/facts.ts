import type { LangCode } from "@storyling/core";

/**
 * True, well-documented facts for the daily "True facts" story. The AI retells one and may not add facts of its own,
 * so every number, name and date here must be right. Add more at the end; ids must stay unique.
 * `lang` puts a fact first in the rotation for that language (it is about a place where the language is spoken).
 */
export interface Fact { id: string; fact: string; lang?: LangCode }

export const FACTS: Fact[] = [
  { id: "octopus", fact: "An octopus has three hearts and blue blood." },
  { id: "honey", fact: "Honey hardly ever goes bad. Archaeologists have found pots of honey in ancient Egyptian tombs that were thousands of years old and still edible." },
  { id: "banana", fact: "In botany a banana counts as a berry, but a strawberry does not." },
  { id: "venus", fact: "A day on the planet Venus is longer than its year: Venus turns around itself more slowly than it goes around the Sun." },
  { id: "otters", fact: "Sea otters often hold paws while they sleep on the water, so that they do not drift apart." },
  { id: "wombat", fact: "Wombats, animals from Australia, make poo in the shape of little cubes." },
  { id: "venice", fact: "Venice stands on millions of wooden posts that were pushed deep into the mud of the lagoon hundreds of years ago." },
  { id: "greatwall", fact: "Contrary to a popular myth, you cannot see the Great Wall of China from space with your bare eyes." },
  { id: "koala", fact: "Koalas sleep about 18 to 22 hours a day. Their food, eucalyptus leaves, gives them very little energy." },
  { id: "hummingbird", fact: "Hummingbirds can fly backwards. They are the only birds that can do this." },
  { id: "lightning", fact: "A bolt of lightning is about five times hotter than the surface of the Sun." },
  { id: "sahara", fact: "About 6,000 to 10,000 years ago the Sahara was green, with grass, lakes and animals like hippos. Rock paintings there show this." },
  { id: "penguin-egg", fact: "Emperor penguin fathers keep their egg warm on their feet for about two months in the Antarctic winter, and they eat nothing during this time." },
  { id: "bamboo", fact: "Some kinds of bamboo can grow almost one metre in a single day." },
  { id: "guineapig", fact: "In Switzerland it is against the law to keep only one guinea pig, because guinea pigs are social animals and get lonely." },
  { id: "sirnils", fact: "A king penguin called Nils Olav at Edinburgh Zoo in Scotland was made a knight by the Norwegian King's Guard. He is 'Sir Nils Olav'." },
  { id: "unicorn", fact: "The national animal of Scotland is the unicorn." },
  { id: "shortwar", fact: "The shortest war in history was between Britain and Zanzibar in 1896. It lasted less than an hour." },
  { id: "oxford", fact: "The University of Oxford is older than the Aztec Empire: teaching began at Oxford around 1096, and the Aztec city Tenochtitlan was founded in 1325." },
  { id: "cleopatra", fact: "Cleopatra lived closer in time to the first Moon landing than to the building of the Great Pyramid of Giza." },
  { id: "cats-sweet", fact: "Cats cannot taste sweet things. They do not have the taste receptors for sugar." },
  { id: "pacific", fact: "The Pacific Ocean is bigger than all the land on Earth put together." },
  { id: "everest", fact: "Mount Everest is still growing, by a few millimetres every year, because the Indian plate keeps pushing into Asia." },
  { id: "butterfly", fact: "Butterflies taste with their feet. When they land on a leaf, they can tell if it is good for their eggs." },
  { id: "bees", fact: "Honeybees tell each other where to find flowers with a dance, called the waggle dance." },
  { id: "crows", fact: "Crows can recognise individual human faces and remember people who treated them badly for years." },
  { id: "dolphins", fact: "Bottlenose dolphins have their own 'names': each one has a signature whistle, and others can call it with that whistle." },
  { id: "antarctica", fact: "Antarctica is the largest desert in the world. A desert is a place with very little rain or snow, not necessarily a hot place." },
  { id: "australia-moon", fact: "Australia is wider than the Moon: Australia is about 4,000 km from east to west, and the Moon is about 3,474 km across." },
  { id: "sejong", fact: "The Korean alphabet, Hangul, was created by King Sejong and his scholars in 1443, so that ordinary people could learn to read and write easily.", lang: "ko" },
  { id: "baikal", fact: "Lake Baikal in Siberia is the deepest lake in the world, more than 1,600 metres deep, and it holds about a fifth of the world's unfrozen fresh surface water.", lang: "ru" },
  { id: "russia-zones", fact: "Russia is so wide that it has eleven time zones. When people in the far east have breakfast, people in Kaliningrad are still in bed the evening before.", lang: "ru" },
  { id: "istanbul", fact: "Istanbul lies on two continents, Europe and Asia. The Bosphorus strait runs through the middle of the city.", lang: "tr" },
  { id: "tulips", fact: "Tulips came to Western Europe from the Ottoman Empire in the 16th century. The word tulip probably comes from the Turkish word for turban.", lang: "tr" },
  { id: "amazon-bridge", fact: "No bridge crosses the main Amazon River anywhere along its length. People cross it by boat.", lang: "pt" },
  { id: "cork", fact: "Portugal produces about half of the world's cork. Cork comes from the bark of the cork oak, and the tree is not cut down to get it.", lang: "pt" },
  { id: "mexicocity", fact: "Mexico City is slowly sinking, in some places by more than 20 centimetres a year, because water is pumped out from under the ground.", lang: "es" },
  { id: "tomatina", fact: "Every August, in the Spanish town of Buñol, thousands of people throw tomatoes at each other in a festival called La Tomatina.", lang: "es" },
  { id: "montstmichel", fact: "Mont-Saint-Michel in France is a small rocky island with an abbey. At very high tides the sea surrounds it completely.", lang: "fr" },
  { id: "bread-de", fact: "Germany has more than 3,000 officially registered kinds of bread, and German bread culture is on UNESCO's list of cultural heritage in Germany.", lang: "de" },
  { id: "nl-bikes", fact: "The Netherlands has more bicycles than people, and about a quarter of the country lies below sea level." },
  { id: "panda-eat", fact: "A giant panda spends up to 14 hours a day eating, mostly bamboo, because bamboo gives it very little energy.", lang: "zh" },
  { id: "japan-islands", fact: "Japan is made up of more than 14,000 islands, according to a new count by the Japanese government in 2023.", lang: "ja" },
  { id: "canada-lakes", fact: "Canada has more lakes than any other country, more than half of all the lakes in the world.", lang: "en" },
  { id: "bigben", fact: "Big Ben is not the name of the clock tower in London but of its largest bell. The tower is called the Elizabeth Tower.", lang: "en" },
];

/** Today's fact for a language: its own facts first in the rotation, then the shared ones, with a different start per language. */
export function factFor(lang: LangCode, n: number, offset: number): Fact {
  const order = [...FACTS.filter((f) => f.lang === lang), ...FACTS.filter((f) => !f.lang)];
  return order[(n + offset * 7) % order.length]!;
}
