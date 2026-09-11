// LANC Jewels — каталог товаров
// Фотографии каждого артикула получены со страниц соответствующих товаров
// официального магазина LANC на OZON (ozon.ru/s/lanc)

const PRODUCTS = [
  {
    id: "4469086188",
    category: "earrings",
    title: "Серьги-трансформеры «2 в 1»",
    subtitle: "с фианитами, съёмная подвеска",
    price: 3000,
    images: 8,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Универсальные серьги-трансформеры: лаконичные пусеты-гвоздики превращаются в эффектные серьги с подвеской одним движением — снимите нижний ярус, и у вас уже другой образ. Огранка фианитов передаёт бриллиантовую игру света, а надёжный винтовой замок подходит для чувствительных ушей.",
    ozonUrl: "https://ozon.ru/product/sergi-transformery-serebryanye-925-zhenskie-2-v-1-s-fianitami-pusety-gvozdiki-s-vintovym-zamkom-4469086188/",
    wbUrl: "https://www.wildberries.ru/catalog/1417803810/detail.aspx"
  },
  {
    id: "3589453179",
    category: "pendants",
    title: "Кулон «Сердце»",
    subtitle: "разноцветные фианиты в серебре",
    price: 3000,
    images: 9,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты"],
    description: "Нежный кулон в форме сердца с разноцветными фианитами — бирюзовым, розовым и жёлтым — в обрамлении сияющей дорожки из белых камней. Тонкая якорная цепочка позволяет носить украшение как самостоятельно, так и в паре с серьгами из этой же коллекции.",
    ozonUrl: "https://ozon.ru/product/kulon-serebryanyy-zhenskiy-detskiy-serdtse-serebro-925-3589453179/",
    wbUrl: "https://www.wildberries.ru/catalog/879358751/detail.aspx"
  },
  {
    id: "3144387292",
    category: "earrings",
    title: "Серьги-гвоздики «Сияние»",
    subtitle: "белые фианиты, ореол-халo",
    price: 3000,
    images: 8,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Классические серьги-гвоздики с крупным центральным фианитом в окружении сияющего ореола мелких камней. Родиевое покрытие делает серебро особенно белым и стойким к потускнению — украшение выглядит как настоящий бриллиант при любом освещении.",
    ozonUrl: "https://ozon.ru/product/sergi-serebryanye-zhenskie-gvozdiki-lanc-serebro-925-rodirovannye-s-belymi-fianitami-vintovoy-zamok-3144387292/",
    wbUrl: "https://www.wildberries.ru/catalog/879298097/detail.aspx"
  },
  {
    id: "3632308896",
    category: "earrings",
    title: "Серьги «Коньки»",
    subtitle: "фигурные коньки, эмаль",
    price: 3000,
    images: 7,
    material: ["Серебро 925", "Позолота", "Эмаль", "Фианит", "Винтовой замок"],
    description: "Игривые серьги в виде фигурных коньков с белой эмалью и сияющим фианитом на носке ботинка. Позолоченное серебро и аккуратная детализация делают их отличным подарком для юной фигуристки или просто любительницы необычных украшений.",
    ozonUrl: "https://ozon.ru/product/sergi-serebryanye-konki-serebro-925-3632308896/",
    wbUrl: "https://www.wildberries.ru/catalog/878767351/detail.aspx"
  },
  {
    id: "3589365207",
    category: "earrings",
    title: "Серьги-пусеты «Сердце»",
    subtitle: "цветные и белые фианиты",
    price: 3000,
    images: 9,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Серьги-сердечки с той же самой цветовой историей, что и кулон «Сердце»: бирюза, розовый и жёлтый фианиты в обрамлении белой дорожки. Идеально дополнят парный кулон или будут хороши как самостоятельный акцент.",
    ozonUrl: "https://ozon.ru/product/sergi-pusety-serebryanye-serdtse-serebro-925-rodirovannye-s-tsvetnymi-i-belymi-fianitami-vintovoy-3589365207/",
    wbUrl: "https://www.wildberries.ru/catalog/879147956/detail.aspx"
  },
  {
    id: "3590437534",
    category: "earrings",
    title: "Серьги «Радуга»",
    subtitle: "разноцветные фианиты-капли",
    price: 3000,
    images: 7,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Яркие серьги-джекеты: крупный красный фианит наверху и россыпь разноцветных камней каскадом внизу. Смелое, но лёгкое украшение — добавляет настроения к однотонному образу и отлично смотрится с собранными волосами.",
    ozonUrl: "https://ozon.ru/product/sergi-serebryanye-raduga-serebro-925-3590437534/",
    wbUrl: "https://www.wildberries.ru/catalog/879155681/detail.aspx"
  },
  {
    id: "2736061100",
    category: "bracelets",
    title: "Браслет «Цветок»",
    subtitle: "розовые и голубые фианиты",
    price: 3000,
    images: 8,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты"],
    description: "Изящный браслет-цепочка с миниатюрным цветком из розовых фианитов и голубым акцентом в центре. Регулируемая длина и подвеска-сердечко делают его удобным и для взрослой руки, и для детского запястья.",
    ozonUrl: "https://ozon.ru/product/braslet-detskiy-serebryanyy-tsvetok-serebro-925-2736061100/",
    wbUrl: "https://www.wildberries.ru/catalog/1417761209/detail.aspx"
  },
  {
    id: "3144951978",
    category: "earrings",
    title: "Серьги-гвоздики с эмалью",
    subtitle: "нежно-розовая эмаль",
    price: 3000,
    images: 8,
    material: ["Серебро 925", "Родиевое покрытие", "Эмаль", "Винтовой замок"],
    description: "Минималистичные круглые гвоздики, покрытые перламутровой розовой эмалью в тонком серебряном кантике. Универсальная пара на каждый день, которая одинаково хорошо смотрится и на взрослой, и на юной моднице.",
    ozonUrl: "https://ozon.ru/product/sergi-serebryanye-zhenskie-detskie-s-emalyu-gvozdiki-rodirovannye-serebro-925-3144951978/",
    wbUrl: "https://www.wildberries.ru/catalog/879250671/detail.aspx"
  },
  {
    id: "3635867668",
    category: "earrings",
    title: "Серьги-гвоздики «Сияющий цветок»",
    subtitle: "россыпь белых фианитов",
    price: 3000,
    images: 7,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Серьги-цветок, полностью вымощенные мелкими белыми фианитами — эффект лёгкого мерцания при любом движении. Фигурный контур лепестков делает силуэт нежным, а плотная посадка камней — по-настоящему «дорогим» на вид.",
    ozonUrl: "https://ozon.ru/product/sergi-zhenskie-serebryanye-gvozdiki-rodirovannye-siyayushchiy-tsvetok-serebro-925-3635867668/",
    wbUrl: "https://www.wildberries.ru/catalog/883916118/detail.aspx"
  },
  {
    id: "2560776809",
    category: "earrings",
    title: "Серьги «Цветок» детские",
    subtitle: "розовые и белые фианиты",
    price: 3000,
    images: 8,
    material: ["Серебро 925", "Родиевое покрытие", "Фианиты", "Винтовой замок"],
    description: "Трогательные серьги-цветок с розовыми лепестками и белым фианитом в сердцевине. Продуманный безопасный винтовой замок и мягкие формы — украшение создано специально для нежных детских и подростковых образов.",
    ozonUrl: "https://ozon.ru/product/sergi-detskie-serebryanye-dlya-devochki-tsvetok-gvozdiki-serebro-925-rodirovannye-s-rozovymi-i-belym-2560776809/",
    wbUrl: "https://www.wildberries.ru/catalog/878749689/detail.aspx"
  }
];

const CATEGORY_LABELS = {
  earrings: "Серьги",
  pendants: "Кулоны",
  bracelets: "Браслеты"
};

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function productImagePath(id, n) {
  const num = String(n).padStart(2, "0");
  return `images/products/${id}/img_${num}.jpg`;
}

function productCardHTML(p) {
  return `
    <div class="feature-card">
      <a class="fc-link" href="product.html?id=${p.id}">
        <div class="ph"><img src="${productImagePath(p.id,1)}" alt="${p.title}" loading="lazy"></div>
        <div class="body">
          <div class="cat">${CATEGORY_LABELS[p.category]}</div>
          <h3>${p.title}</h3>
          <p class="sub">${p.subtitle}</p>
        </div>
      </a>
      <div class="fc-buy">
        <a href="${p.ozonUrl}" target="_blank" rel="noopener" class="fc-buy-btn ozon">Купить на OZON</a>
        <a href="${p.wbUrl}" target="_blank" rel="noopener" class="fc-buy-btn wb">Купить на Wildberries</a>
      </div>
    </div>`;
}
