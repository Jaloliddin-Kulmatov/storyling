import type { GrammarTopic, Row } from "./grammar";

/** Turkish grammar. Original explanations and sentences written for Storyling. Suffixes follow vowel harmony. */
const topic = (id: string, level: string, title: string, explain: string, rows: Row[]): GrammarTopic => ({
  id: `tr-${id}`,
  lang: "tr",
  level,
  title,
  explain,
  items: rows.map(([q, a, o, why, tr]) => ({ q, a, o, why, ...(tr ? { tr } : {}) })),
});

const PICK = "Which sentence is correct?";

export const TURKISH: GrammarTopic[] = [
  // ───────────── A1 ─────────────
  topic("to-be", "A1", "To be: ben öğrenciyim", "Turkish has no separate word for “to be”. You add a personal ending to the noun or adjective.\n\n- ben -im · sen -sin · o (no ending) · biz -iz · siz -siniz · onlar (no ending or -ler)\n- The vowel in the ending follows the last vowel of the word (vowel harmony): öğretmenim, doktorum, mutluyum.\n- After a vowel, a y is added: öğrenciyim, öğrenciyiz.", [
    ["Ben öğretmen___.", "im", ["im", "sin", "iz"], "ben → -im. The last vowel of öğretmen is e, so the ending has i.", "I am a teacher."],
    ["Sen öğrenci___.", "sin", ["sin", "im", "siniz"], "sen → -sin.", "You are a student."],
    ["Biz öğrenci___.", "yiz", ["yiz", "iz", "yim"], "biz → -iz, and after a vowel (i) a y is added: öğrenciyiz.", "We are students."],
    ["Siz doktor___.", "sunuz", ["sunuz", "siniz", "sınız"], "siz → -siniz; with the last vowel o, harmony gives -sunuz: doktorsunuz.", "You (formal/plural) are a doctor."],
    [PICK, "O öğretmen.", ["O öğretmen.", "O öğretmenim.", "O öğretmensin."], "With o (he/she) there is no ending.", "He/She is a teacher."],
  ]),
  topic("plural", "A1", "Plural: -ler / -lar", "The plural ending is -ler after front vowels (e, i, ö, ü) and -lar after back vowels (a, ı, o, u). Look at the last vowel of the word.\n\n- ev → evler · göz → gözler\n- kitap → kitaplar · çocuk → çocuklar\nAfter a number, the noun stays singular: iki kitap (two books).", [
    ["kitap → ___", "kitaplar", ["kitaplar", "kitapler", "kitaplır"], "The last vowel is a (back), so -lar.", "books"],
    ["ev → ___", "evler", ["evler", "evlar", "evlır"], "The last vowel is e (front), so -ler.", "houses"],
    ["çocuk → ___", "çocuklar", ["çocuklar", "çocukler", "çocuklur"], "The last vowel is u (back), so -lar.", "children"],
    ["göz → ___", "gözler", ["gözler", "gözlar", "gözlür"], "The last vowel is ö (front), so -ler.", "eyes"],
    [PICK, "İki kitap aldım.", ["İki kitap aldım.", "İki kitaplar aldım.", "İki kitapler aldım."], "After a number the noun stays singular.", "I bought two books."],
  ]),
  topic("locative", "A1", "Where? The locative: -de / -da", "To say where something is, add -de/-da (in, at, on). Harmony: -de after front vowels, -da after back vowels. After the hard consonants ç, f, h, k, p, s, ş, t the d becomes t: -te/-ta.\n\n- evde (at home) · okulda (at school)\n- parkta (in the park) · sınıfta (in the classroom)\nWith names an apostrophe is used: Ankara'da, İzmir'de.", [
    ["Ben ev___.", "de", ["de", "da", "te"], "The last vowel of ev is e (front), and v is a soft consonant: -de.", "I am at home."],
    ["Ali okul___.", "da", ["da", "de", "ta"], "The last vowel of okul is u (back), and l is soft: -da.", "Ali is at school."],
    ["Çocuklar park___ oynuyor.", "ta", ["ta", "da", "te"], "park ends in the hard consonant k and has a back vowel: -ta.", "The children are playing in the park."],
    ["Biz İzmir___.", "de", ["de", "da", "te"], "The last vowel of İzmir is i (front): -de (İzmir'de).", "We are in Izmir."],
    ["Kitap masa___.", "da", ["da", "de", "ta"], "masa ends in a back vowel: masada.", "The book is on the table."],
  ]),
  topic("question", "A1", "Yes/no questions: mi?", "Add the question word mi (mı, mu, mü) after the word you ask about. It follows vowel harmony (four ways), and it is written separately.\n\n- Bu ev mi? · Bu çay mı? · O doktor mu? · Okul büyük mü?\nWith a person ending: Sen öğrenci misin? Siz hasta mısınız?", [
    ["Bu çay ___?", "mı", ["mı", "mi", "mu"], "The last vowel of çay is a (back, unrounded): mı.", "Is this tea?"],
    ["Bu ev ___?", "mi", ["mi", "mı", "mü"], "The last vowel of ev is e (front, unrounded): mi.", "Is this a house?"],
    ["O doktor ___?", "mu", ["mu", "mı", "mü"], "The last vowel of doktor is o (back, rounded): mu.", "Is he/she a doctor?"],
    ["Okul büyük ___?", "mü", ["mü", "mi", "mu"], "The last vowel of büyük is ü (front, rounded): mü.", "Is the school big?"],
    ["Sen öğrenci ___?", "misin", ["misin", "mısın", "musun"], "The last vowel is i: mi + sin = misin.", "Are you a student?"],
  ]),
  topic("present", "A1", "The present continuous: -iyor", "For what is happening now (and often for plans): verb stem + -iyor (with harmony: -iyor, -ıyor, -uyor, -üyor) + the personal ending.\n\n- gel → geliyor · bak → bakıyor · oku → okuyor · gör → görüyor\n- A stem ending in a vowel drops it: ye → yiyor, de → diyor.\n- Personal endings: -um/-im (ben), -sun/-sin (sen), (o), -uz/-iz (biz), -sunuz (siz), -lar (onlar).\n- gitmek → gidiyor (t → d), etmek → ediyor.", [
    ["Şimdi Ali kitap ___. (okumak)", "okuyor", ["okuyor", "okur", "okudu"], "oku + yor: after a vowel an extra y appears. Ali = o: okuyor.", "Ali is reading a book now."],
    ["Ben şimdi çay ___. (içmek)", "içiyorum", ["içiyorum", "içiyor", "içiyoruz"], "iç + iyor + um (ben).", "I am drinking tea now."],
    ["Biz Türkçe ___. (öğrenmek)", "öğreniyoruz", ["öğreniyoruz", "öğreniyorum", "öğrenir"], "öğren + iyor + uz (biz).", "We are learning Turkish."],
    ["Sen ne ___? (yapmak)", "yapıyorsun", ["yapıyorsun", "yapıyor", "yapıyorum"], "yap + ıyor + sun (sen).", "What are you doing?"],
    ["O sinemaya ___. (gitmek)", "gidiyor", ["gidiyor", "gitiyor", "gider"], "In gitmek the t becomes d before a vowel: gidiyor.", "He/She is going to the cinema."],
  ]),
  topic("negation", "A1", "Saying no: -me / -ma", "Negate a verb by putting -me (front vowels) or -ma (back vowels) after the stem, before the tense ending.\n\n- gel → gelmiyor · bak → bakmıyor · oku → okumuyor\n- Before -yor the e/a of the negative narrows to i, ı, u, ü: gelmiyorum.\nFor “there is / there isn't”: var (there is) and yok (there is not).", [
    ["Ben bugün okula ___. (gitmek)", "gitmiyorum", ["gitmiyorum", "gitmeyorum", "gidiyorum"], "git + me + iyor + um: the e of -me narrows to i before -yor: gitmiyorum.", "I'm not going to school today."],
    ["Ali süt ___. (içmek)", "içmiyor", ["içmiyor", "içiyor", "içmaz"], "iç + mi + yor: Ali does not drink milk.", "Ali doesn't drink milk."],
    ["Biz televizyon ___. (izlemek)", "izlemiyoruz", ["izlemiyoruz", "izlemiyorum", "izliyoruz"], "izle + mi + yor + uz.", "We aren't watching television."],
    ["Evde süt ___.", "yok", ["yok", "var", "değil"], "“There is no milk” = süt yok.", "There is no milk at home."],
    ["Benim bir kedim ___.", "var", ["var", "yok", "değil"], "“I have a cat” = bir kedim var (literally: my cat exists).", "I have a cat."],
  ]),
  // ───────────── A2 ─────────────
  topic("accusative", "A2", "The definite object: -i / -ı / -u / -ü", "A definite object (a specific thing) takes the accusative ending: -i, -ı, -u, -ü (four-way harmony). After a vowel add -yi/-yı/-yu/-yü.\n\n- Ben o filmi izledim. · Annem çorbayı yaptı. · Ali kapıyı açıyor.\nAn object without “the/that” stays bare: Ben elma yiyorum (I eat apples).", [
    ["Ben elma___ yiyorum.", "yı", ["yı", "yi", "ı"], "elma ends in a vowel, so y is added; the last vowel a gives ı: elmayı.", "I am eating the apple."],
    ["Ali kapı___ açıyor.", "yı", ["yı", "ı", "yi"], "kapı ends in a vowel: kapıyı.", "Ali is opening the door."],
    ["Biz ev___ satıyoruz.", "i", ["i", "ı", "yi"], "ev ends in a consonant and has e: evi.", "We are selling the house."],
    ["Ben o film___ izledim.", "i", ["i", "ı", "u"], "film has the vowel i: filmi.", "I watched that film."],
    ["Annem çorba___ yaptı.", "yı", ["yı", "ı", "yu"], "çorba ends in a vowel (a): çorbayı.", "My mother made the soup."],
  ]),
  topic("dative", "A2", "Where to? The dative: -e / -a", "For a direction (to, towards) add -e/-a. After a vowel add -ye/-ya.\n\n- eve (home) · okula (to school) · parka (to the park)\n- Ankara'ya · İstanbul'a · sinemaya", [
    ["Ben okul___ gidiyorum.", "a", ["a", "e", "ya"], "okul has a back vowel and ends in a consonant: okula.", "I am going to school."],
    ["Biz ev___ dönüyoruz.", "e", ["e", "a", "ye"], "ev has a front vowel: eve.", "We are going back home."],
    ["Ali Ankara___ gidiyor.", "ya", ["ya", "a", "ye"], "Ankara ends in a vowel, so y is added: Ankara'ya.", "Ali is going to Ankara."],
    ["Çocuklar park___ koşuyor.", "a", ["a", "e", "ya"], "park ends in a consonant and has a: parka.", "The children run to the park."],
    ["Biz sinema___ gidiyoruz.", "ya", ["ya", "ye", "a"], "sinema ends in a vowel: sinemaya.", "We are going to the cinema."],
  ]),
  topic("ablative", "A2", "Where from? The ablative: -den / -dan", "For coming from, leaving or since: -den/-dan (-ten/-tan after hard consonants ç, f, h, k, p, s, ş, t).\n\n- evden (from home) · okuldan · İstanbul'dan · parktan", [
    ["Ben okul___ geliyorum.", "dan", ["dan", "den", "tan"], "okul: back vowel, soft consonant l: okuldan.", "I am coming from school."],
    ["Ali ev___ çıkıyor.", "den", ["den", "dan", "ten"], "ev: front vowel: evden.", "Ali is leaving the house."],
    ["Biz Ankara___ geliyoruz.", "dan", ["dan", "den", "tan"], "Ankara: back vowel: Ankara'dan.", "We are coming from Ankara."],
    ["Kitap masa___ düştü.", "dan", ["dan", "den", "tan"], "masa: back vowel: masadan.", "The book fell off the table."],
    ["O park___ dönüyor.", "tan", ["tan", "dan", "ten"], "park ends in the hard consonant k: -tan.", "He/She is coming back from the park."],
  ]),
  topic("past", "A2", "The past tense: -di", "The common past tense is stem + -di (with harmony: di, dı, du, dü) + personal ending. After the hard consonants ç, f, h, k, p, s, ş, t it becomes -ti, -tı, -tu, -tü.\n\n- gel → geldi · yaz → yazdı · oku → okudu · git → gitti\n- Personal endings: -m (ben), -n (sen), (o), -k (biz), -niz (siz), -ler (onlar): geldim, geldin, geldi, geldik, geldiniz, geldiler.", [
    ["Dün ben okula ___. (gitmek)", "gittim", ["gittim", "gitdim", "gitti"], "git ends in t (hard), so -ti; + m (ben): gittim.", "Yesterday I went to school."],
    ["Ali dün kitap ___. (okumak)", "okudu", ["okudu", "okuttu", "okuyor"], "oku + du (u is the last vowel): okudu.", "Ali read a book yesterday."],
    ["Biz dün sinemaya ___. (gitmek)", "gittik", ["gittik", "gittim", "gitti"], "git + ti + k (biz): gittik.", "We went to the cinema yesterday."],
    ["Sen ne ___? (yemek)", "yedin", ["yedin", "yedim", "yedi"], "ye + di + n (sen): yedin.", "What did you eat?"],
    ["Onlar geç ___. (gelmek)", "geldiler", ["geldiler", "geldik", "geldim"], "gel + di + ler (onlar): geldiler.", "They came late."],
  ]),
  topic("possessive", "A2", "My, your, his: possessive endings", "Turkish adds an ending to the thing owned.\n\n- ev: evim (my) · evin (your) · evi (his/her) · evimiz (our) · eviniz (your, pl.) · evleri (their)\n- After a vowel: annem (my mother), baban (your father), arabası (his/her car).\n- The owner can be added before: benim evim, senin evin, onun evi.", [
    ["Benim ev___ büyük.", "im", ["im", "ım", "m"], "ev ends in a consonant, last vowel e: evim.", "My house is big."],
    ["Senin ev___ güzel.", "in", ["in", "ın", "n"], "evin = your house.", "Your house is beautiful."],
    ["Onun araba___ yeni.", "sı", ["sı", "ı", "si"], "araba ends in a vowel: its owner ending is -sı: arabası.", "His/Her car is new."],
    ["Bizim okul___ yakın.", "umuz", ["umuz", "ımız", "imiz"], "okul has u and ends in a consonant: okulumuz.", "Our school is near."],
    ["Benim anne___ doktor.", "m", ["m", "im", "sı"], "After a vowel the ending is only -m: annem.", "My mother is a doctor."],
  ]),
  topic("comparison", "A2", "Comparing: daha and en", "- daha + adjective = more (and -den for “than”): Ali Ayşe'den daha uzun.\n- en + adjective = the most: Bu en büyük ev.\nThe adjective does not change.", [
    ["Bu kitap o kitaptan ___ ilginç.", "daha", ["daha", "en", "çok"], "daha makes the comparison (more interesting than).", "This book is more interesting than that book."],
    ["İstanbul Türkiye'nin ___ büyük şehri.", "en", ["en", "daha", "çok"], "en makes the superlative (the biggest).", "Istanbul is the biggest city in Turkey."],
    ["Bu ev o evden ___ ucuz.", "daha", ["daha", "en", "gibi"], "“cheaper than that house” = o evden daha ucuz.", "This house is cheaper than that house."],
    ["Bu sınıfta ___ uzun öğrenci Ali.", "en", ["en", "daha", "çok"], "“the tallest student” = en uzun öğrenci.", "The tallest student in this class is Ali."],
    ["Ayşe, Ali___ daha hızlı koşuyor.", "den", ["den", "de", "e"], "“than” = the ablative -den: Ali'den.", "Ayşe runs faster than Ali."],
  ]),
  // ───────────── B1 ─────────────
  topic("future", "B1", "The future: -ecek / -acak", "Add -ecek (front vowels) or -acak (back vowels) to the stem, then a personal ending. Before an ending that starts with a vowel the final k becomes ğ.\n\n- gel → gelecek · yap → yapacak · git → gidecek\n- gideceğim · gideceksin · gidecek · gideceğiz · gideceksiniz · gidecekler", [
    ["Yarın ben İstanbul'a ___. (gitmek)", "gideceğim", ["gideceğim", "gidecekim", "gittim"], "git + ecek + im: t → d and k → ğ before a vowel: gideceğim.", "Tomorrow I will go to Istanbul."],
    ["Ali yarın bize ___. (gelmek)", "gelecek", ["gelecek", "geldi", "geliyor"], "gel + ecek: Ali (o) has no ending: gelecek.", "Ali will come to us tomorrow."],
    ["Biz hafta sonu film ___. (izlemek)", "izleyeceğiz", ["izleyeceğiz", "izlecekiz", "izledik"], "izle ends in a vowel, so y is added: izle + y + eceğ + iz.", "We will watch a film this weekend."],
    ["Onlar yarın ___. (başlamak)", "başlayacaklar", ["başlayacaklar", "başlayacak", "başladılar"], "başla + y + acak + lar.", "They will start tomorrow."],
    ["Sen ne zaman ___? (dönmek)", "döneceksin", ["döneceksin", "dönecek", "döndün"], "dön + ecek + sin (sen).", "When will you come back?"],
  ]),
  topic("conditional", "B1", "If: -se / -sa", "To say “if”, add -se (front vowels) or -sa (back vowels) to the tense stem, then the personal ending.\n\n- Yağmur yağarsa evde kalırım. (If it rains, I stay home.)\n- Vaktin olursa bize gel. (If you have time, come to us.)\n- Often the aorist -ir/-ar goes before: gelirse, yaparsa.", [
    ["Yağmur ___ evde kalırım. (yağmak)", "yağarsa", ["yağarsa", "yağdı", "yağıyor"], "yağ + ar + sa: if it rains.", "If it rains, I stay home."],
    ["Vaktin ___ bize gel. (olmak)", "olursa", ["olursa", "olur", "oldu"], "ol + ur + sa: if you have time.", "If you have time, come to us."],
    ["Hava güzel ___ parka gideriz. (olmak)", "olursa", ["olursa", "olacak", "olduk"], "ol + ur + sa.", "If the weather is nice, we go to the park."],
    ["Çok çalışırsan sınavı ___.", "geçersin", ["geçersin", "geçtin", "geçti"], "The result of the condition: geç + er + sin (you will pass).", "If you study hard, you will pass the exam."],
    ["Yarın erken ___ yetişirsin. (kalkmak)", "kalkarsan", ["kalkarsan", "kalktın", "kalkıyorsun"], "kalk + ar + san: if you get up.", "If you get up early tomorrow, you will make it."],
  ]),
  topic("reasons", "B1", "Because: çünkü, için, bu yüzden", "- çünkü + clause = because: Okula gitmedim çünkü hastaydım.\n- için after a verb noun or noun = for / because of: Hasta olduğum için okula gitmedim.\n- bu yüzden / bu nedenle = that is why: Hastaydım, bu yüzden okula gitmedim.", [
    ["Okula gitmedim ___ hastaydım.", "çünkü", ["çünkü", "için", "ama"], "çünkü introduces the reason clause.", "I didn't go to school because I was ill."],
    ["Hasta olduğum ___ okula gitmedim.", "için", ["için", "çünkü", "ama"], "the reason comes first, followed by için.", "Because I was ill, I didn't go to school."],
    ["Yorgundum, ___ erken yattım.", "bu yüzden", ["bu yüzden", "çünkü", "ama"], "bu yüzden = that is why (result).", "I was tired, so I went to bed early."],
    ["Türkçe öğreniyorum ___ Türkiye'de yaşamak istiyorum.", "çünkü", ["çünkü", "ama", "veya"], "çünkü gives the reason.", "I am learning Turkish because I want to live in Turkey."],
    ["Yağmur yağıyor, ___ evde kalıyoruz.", "bu yüzden", ["bu yüzden", "çünkü", "gibi"], "bu yüzden = therefore.", "It is raining, so we stay at home."],
  ]),
  topic("ability", "B1", "Can: -ebil / -abil", "To say “can”, add -ebil (front vowels) or -abil (back vowels) to the stem, then the tense.\n\n- yüz → yüzebilirim (I can swim) · çal → çalabilir · anla → anlayabiliriz\n- The negative is -eme / -ama + the tense: taşıyamam (I can't carry).", [
    ["Ben iyi ___. (yüzmek)", "yüzebilirim", ["yüzebilirim", "yüzmem", "yüzdüm"], "yüz + ebil + ir + im: I can swim.", "I can swim well."],
    ["Ali piyano ___. (çalmak)", "çalabilir", ["çalabilir", "çalamaz", "çaldı"], "çal + abil + ir: can play.", "Ali can play the piano."],
    ["Biz seni ___. (anlamak)", "anlayabiliriz", ["anlayabiliriz", "anlamayız", "anladık"], "anla + y + abil + iriz.", "We can understand you."],
    ["Sen yarın ___ misin? (gelmek)", "gelebilir", ["gelebilir", "gelmez", "geldi"], "gel + ebil + ir + misin: can you come?", "Can you come tomorrow?"],
    ["Ben bu ağır çantayı ___. (taşımak)", "taşıyamam", ["taşıyamam", "taşıyabilirim", "taşıdım"], "taşı + y + ama + m: the negative of can.", "I can't carry this heavy bag."],
  ]),
];
