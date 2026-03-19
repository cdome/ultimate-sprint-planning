const adjectives = [
  "admiring", "adoring", "agitated", "amazing", "angry", "awesome", "blissful",
  "bold", "boring", "brave", "busy", "charming", "clever", "cool", "cranky",
  "crazy", "dazzling", "determined", "distracted", "dreamy", "eager", "ecstatic",
  "elastic", "elated", "elegant", "epic", "exciting", "fervent", "festive",
  "flamboyant", "focused", "friendly", "frosty", "funny", "gallant", "gifted",
  "goofy", "gracious", "happy", "hardcore", "heuristic", "hopeful", "hungry",
  "infallible", "inspiring", "jolly", "jovial", "keen", "kind", "laughing",
  "loving", "lucid", "magical", "modest", "musing", "nervous", "nifty",
  "nostalgic", "objective", "optimistic", "peaceful", "pedantic", "pensive",
  "practical", "priceless", "quirky", "recursing", "relaxed", "reverent",
  "romantic", "sad", "serene", "sharp", "silly", "sleepy", "stoic", "strange",
  "suspicious", "sweet", "tender", "thirsty", "trusting", "unruffled", "upbeat",
  "vibrant", "vigilant", "wizardly", "wonderful", "xenial", "youthful", "zealous",
];

// Notable scientists, engineers, and pioneers
const names = [
  "agnesi", "albattani", "allen", "almeida", "antonelli", "archimedes", "ardinghelli",
  "aryabhata", "austin", "babbage", "banach", "banzai", "bardeen", "bartik",
  "bassi", "beaver", "bell", "benz", "bhabha", "bhaskara", "black", "blackburn",
  "blackwell", "bohr", "booth", "borg", "bose", "bouman", "boyd", "brahmagupta",
  "brattain", "brown", "buck", "burnell", "cannon", "carson", "cartwright",
  "carver", "cerf", "chandrasekhar", "chaplygin", "chatelet", "chatterjee",
  "chebyshev", "cohen", "chaum", "clarke", "colden", "cori", "cray", "curie",
  "darwin", "davinci", "dewdney", "dhawan", "diffie", "dijkstra", "dirac",
  "driscoll", "dubinsky", "easley", "edison", "einstein", "elbakyan", "elion",
  "engelbart", "euclid", "euler", "faraday", "feistel", "fermat", "fermi",
  "feynman", "franklin", "gagarin", "galileo", "galois", "gates", "gauss",
  "germain", "goldberg", "goldstine", "golick", "goodall", "gould", "greider",
  "grothendieck", "haibt", "hamilton", "haslett", "hawking", "heisenberg",
  "hellman", "hertz", "heyrovsky", "hodgkin", "hofstadter", "hoover", "hopper",
  "hugle", "hypatia", "ishizaka", "jackson", "jang", "jennings", "jepsen",
  "johnson", "joliot", "jones", "kalam", "kapitsa", "kare", "keldysh", "keller",
  "kepler", "khorana", "kilby", "knuth", "kowalevski", "lalande", "lamarr",
  "lamport", "leakey", "leavitt", "lewin", "lichterman", "liskov", "lovelace",
  "lumiere", "mahavira", "margulis", "matsumoto", "maxwell", "mccarthy",
  "mcclintock", "mclaren", "meitner", "mendel", "mendeleev", "merkle", "mestorf",
  "mirzakhani", "morse", "moser", "nightingale", "newton", "noether", "noyce",
  "panini", "pare", "pascal", "pasteur", "payne", "perlman", "pike", "poincare",
  "poitras", "ramanujan", "ride", "ritchie", "robinson", "rosalind", "rubin",
  "saha", "sammet", "sanderson", "satoshi", "shamir", "shannon", "shaw",
  "shockley", "shtern", "sinoussi", "snyder", "solomon", "spence", "stallman",
  "stonebraker", "sutherland", "swartz", "swirles", "taussig", "tesla", "tharp",
  "thompson", "torvalds", "turing", "varahamihira", "vaughan", "visvesvaraya",
  "volhard", "wescoff", "wilbur", "wiles", "williams", "wilson", "wing",
  "wozniak", "wright", "wu", "yalow", "yonath", "zhukovsky",
];

export function randomRoomName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  return `${adj}-${name}`;
}
