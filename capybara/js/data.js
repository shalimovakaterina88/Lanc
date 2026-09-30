/* Капи-жизнь · справочники игры: возрасты, еда, одежда, игрушки, транспорт, места, занятия, профессии */
'use strict';
window.CAPY = window.CAPY || {};
(function (G) {
  const ALL = ['baby', 'kid', 'teen', 'adult', 'elder'];
  const KID_UP = ['kid', 'teen', 'adult', 'elder'];
  const TEEN_UP = ['teen', 'adult', 'elder'];
  const ADULT_UP = ['adult', 'elder'];
  G.ST = { ALL, KID_UP, TEEN_UP, ADULT_UP };

  G.FURS = {
    classic: { name: 'Классическая', base: '#9b6b45', dark: '#6b4529', light: '#c29169', belly: '#b98a61', muzzle: '#553722' },
    ginger: { name: 'Рыжая', base: '#b4733b', dark: '#7f4c25', light: '#dc9d5f', belly: '#cc9157', muzzle: '#613b20' },
    choco: { name: 'Шоколадная', base: '#6f4b33', dark: '#46301f', light: '#98704f', belly: '#886243', muzzle: '#35231a' },
    sand: { name: 'Песочная', base: '#c39b6c', dark: '#8f6c45', light: '#e5c597', belly: '#dab887', muzzle: '#76573a' },
    ash: { name: 'Дымчатая', base: '#8b7c6e', dark: '#5f544a', light: '#b2a596', belly: '#a69888', muzzle: '#4a4038' },
  };

  // Возрасты. scale — общий размер, head — относительный размер головы, leg — длина лапок, eye — размер глаз
  G.STAGES = [
    { id: 'baby', min: 1, m: 'Малыш', f: 'Малышка', scale: 0.56, head: 1.42, leg: 0.7, eye: 1.7, bx: 0.9, by: 1.02 },
    { id: 'kid', min: 4, m: 'Школьник', f: 'Школьница', scale: 0.68, head: 1.24, leg: 0.82, eye: 1.38, bx: 0.94, by: 1 },
    { id: 'teen', min: 8, m: 'Подросток', f: 'Подросток', scale: 0.8, head: 1.09, leg: 0.93, eye: 1.14, bx: 0.98, by: 0.98 },
    { id: 'adult', min: 12, m: 'Взрослый', f: 'Взрослая', scale: 0.94, head: 1, leg: 1, eye: 1, bx: 1, by: 1 },
    { id: 'elder', min: 20, m: 'Дедушка', f: 'Бабушка', scale: 0.93, head: 1, leg: 0.95, eye: 0.95, bx: 1.02, by: 1 },
  ];
  G.MAX_LVL = 30;
  G.xpNeed = (lvl) => 40 + lvl * 20;
  G.stageOf = (lvl) => {
    let s = G.STAGES[0];
    for (const st of G.STAGES) if (lvl >= st.min) s = st;
    return s;
  };
  G.stageById = (id) => G.STAGES.find((s) => s.id === id) || G.STAGES[3];
  G.stageIdx = (id) => G.STAGES.findIndex((s) => s.id === id);
  G.stageName = (id, gender) => { const s = G.stageById(id); return gender === 'm' ? s.m : s.f; };

  G.NEEDS = [
    { id: 'food', name: 'Сытость', icon: '🥕' },
    { id: 'fun', name: 'Настроение', icon: '😊' },
    { id: 'energy', name: 'Энергия', icon: '⚡' },
    { id: 'clean', name: 'Чистота', icon: '🫧' },
    { id: 'health', name: 'Здоровье', icon: '❤️' },
  ];
  G.SKILLS = [
    { id: 'mind', name: 'Ум', icon: '📚' },
    { id: 'sport', name: 'Спорт', icon: '🎾' },
    { id: 'art', name: 'Творчество', icon: '🎨' },
    { id: 'music', name: 'Музыка', icon: '🎸' },
    { id: 'social', name: 'Дружба', icon: '🤝' },
  ];
  G.LABEL = {
    food: 'Сытость', fun: 'Настроение', energy: 'Энергия', clean: 'Чистота', health: 'Здоровье',
    mind: 'Ум', sport: 'Спорт', art: 'Творчество', music: 'Музыка', social: 'Дружба', coins: 'мандаринок', xp: 'опыта',
  };
  G.ICON = {
    food: '🥕', fun: '😊', energy: '⚡', clean: '🫧', health: '❤️',
    mind: '📚', sport: '🎾', art: '🎨', music: '🎸', social: '🤝', coins: '🍊', xp: '⭐',
  };

  G.FOODS = [
    { id: 'milk', name: 'Бутылочка молока', icon: '🍼', price: 4, food: 18, fun: 4, babyBonus: true },
    { id: 'grass', name: 'Свежая травка', icon: '🌿', price: 2, food: 10 },
    { id: 'carrot', name: 'Морковка', icon: '🥕', price: 5, food: 16 },
    { id: 'mandarin', name: 'Мандарин', icon: '🍊', price: 5, food: 10, fun: 9 },
    { id: 'apple', name: 'Яблоко', icon: '🍎', price: 6, food: 14, fun: 3, health: 2 },
    { id: 'corn', name: 'Кукуруза', icon: '🌽', price: 8, food: 22 },
    { id: 'porridge', name: 'Каша', icon: '🥣', price: 9, food: 26, energy: 6 },
    { id: 'salad', name: 'Салат', icon: '🥗', price: 11, food: 22, health: 6 },
    { id: 'pumpkin', name: 'Тыква', icon: '🎃', price: 12, food: 28 },
    { id: 'icecream', name: 'Мороженое', icon: '🍦', price: 12, food: 10, fun: 16 },
    { id: 'soup', name: 'Суп', icon: '🍲', price: 13, food: 32, health: 5 },
    { id: 'smoothie', name: 'Банановый смузи', icon: '🥤', price: 14, food: 18, energy: 12 },
    { id: 'watermelon', name: 'Арбуз', icon: '🍉', price: 16, food: 30, fun: 12 },
    { id: 'cake', name: 'Тортик', icon: '🍰', price: 30, food: 30, fun: 25, health: -4 },
  ];

  // slot: hat | eyes | neck | body
  G.CLOTHES = [
    { id: 'yuzu', slot: 'hat', name: 'Мандарин на голову', icon: '🍊', price: 12 },
    { id: 'bow', slot: 'hat', name: 'Бантик', icon: '🎀', price: 30 },
    { id: 'partyhat', slot: 'hat', name: 'Праздничный колпак', icon: '🥳', price: 25 },
    { id: 'panama', slot: 'hat', name: 'Панамка', icon: '👒', price: 35 },
    { id: 'cap', slot: 'hat', name: 'Кепка', icon: '🧢', price: 40 },
    { id: 'beanie', slot: 'hat', name: 'Шапка с помпоном', icon: '🧶', price: 45 },
    { id: 'wreath', slot: 'hat', name: 'Венок из ромашек', icon: '🌼', price: 55 },
    { id: 'helmet', slot: 'hat', name: 'Велошлем', icon: '⛑️', price: 60 },
    { id: 'headphones', slot: 'hat', name: 'Наушники', icon: '🎧', price: 120 },
    { id: 'gradcap', slot: 'hat', name: 'Шапочка выпускника', icon: '🎓', price: 150, st: TEEN_UP },
    { id: 'tophat', slot: 'hat', name: 'Цилиндр', icon: '🎩', price: 160 },
    { id: 'boater', slot: 'hat', name: 'Шляпка-канотье', icon: '👒', price: 180 },
    { id: 'crown', slot: 'hat', name: 'Корона', icon: '👑', price: 400 },
    { id: 'roundglasses', slot: 'eyes', name: 'Круглые очки', icon: '👓', price: 70 },
    { id: 'sunglasses', slot: 'eyes', name: 'Солнечные очки', icon: '🕶️', price: 90 },
    { id: 'monocle', slot: 'eyes', name: 'Монокль', icon: '🧐', price: 220, st: ADULT_UP },
    { id: 'bandana', slot: 'neck', name: 'Бандана', icon: '🔺', price: 35 },
    { id: 'scarf', slot: 'neck', name: 'Шарфик', icon: '🧣', price: 45 },
    { id: 'bowtie', slot: 'neck', name: 'Бабочка', icon: '🎀', price: 60 },
    { id: 'tie', slot: 'neck', name: 'Галстук', icon: '👔', price: 70, st: TEEN_UP },
    { id: 'medal', slot: 'neck', name: 'Медаль чемпиона', icon: '🥇', price: 300 },
    { id: 'pearls', slot: 'neck', name: 'Жемчужное колье LANC', icon: '💎', price: 450 },
    { id: 'robe', slot: 'body', name: 'Банный халат', icon: '🥋', price: 70 },
    { id: 'raincoat', slot: 'body', name: 'Жёлтый дождевик', icon: '🧥', price: 80 },
    { id: 'sweater', slot: 'body', name: 'Свитер в полоску', icon: '🧶', price: 90 },
    { id: 'sport', slot: 'body', name: 'Спортивный костюм', icon: '🏃', price: 100 },
    { id: 'hoodie', slot: 'body', name: 'Худи', icon: '👕', price: 110 },
    { id: 'tutu', slot: 'body', name: 'Платье-пачка', icon: '🩰', price: 150 },
    { id: 'rocker', slot: 'body', name: 'Косуха рокера', icon: '🎸', price: 220, st: TEEN_UP },
    { id: 'dress', slot: 'body', name: 'Вечернее платье', icon: '👗', price: 280, st: ADULT_UP },
    { id: 'tailcoat', slot: 'body', name: 'Фрак', icon: '🤵', price: 300, st: ADULT_UP },
  ];
  G.SLOTS = [
    { id: 'hat', name: 'Голова' },
    { id: 'eyes', name: 'Очки' },
    { id: 'neck', name: 'Шея' },
    { id: 'body', name: 'Одежда' },
  ];

  G.TOYS = [
    { id: 'ball', name: 'Мячик', icon: '⚽', price: 25, fun: 15 },
    { id: 'blocks', name: 'Кубики', icon: '🧱', price: 30, fun: 12, mind: 1 },
    { id: 'book', name: 'Книжка сказок', icon: '📖', price: 35, fun: 8, mind: 2 },
    { id: 'teddy', name: 'Плюшевый мишка', icon: '🧸', price: 40, fun: 18 },
    { id: 'kite', name: 'Воздушный змей', icon: '🪁', price: 60, fun: 22 },
    { id: 'yogamat', name: 'Коврик для йоги', icon: '🧘', price: 60, fun: 8, health: 6 },
    { id: 'boardgame', name: 'Настольная игра', icon: '🎲', price: 70, fun: 20, mind: 1 },
    { id: 'racket', name: 'Теннисная ракетка', icon: '🎾', price: 80, fun: 15, sport: 1, note: 'Больше очков на теннисе' },
    { id: 'easel', name: 'Мольберт', icon: '🖼️', price: 120, fun: 12, art: 2, note: 'Картины дороже' },
    { id: 'skates', name: 'Фигурные коньки', icon: '⛸️', price: 150, fun: 15, sport: 1, note: 'Больше очков на катке' },
    { id: 'piano', name: 'Синтезатор', icon: '🎹', price: 200, fun: 16, music: 2 },
    { id: 'guitar', name: 'Электрогитара', icon: '🎸', price: 250, fun: 18, music: 2, note: 'Больше очков на уроке гитары' },
    { id: 'telescope', name: 'Телескоп', icon: '🔭', price: 300, fun: 14, mind: 3 },
  ];

  // lift — насколько поднимается капибара, legs — видны ли лапки
  G.VEHICLES = [
    { id: 'tricycle', name: 'Трёхколёсный велосипед', icon: '🚲', price: 60, st: ['baby', 'kid'], speed: 1.2 },
    { id: 'scooter', name: 'Самокат', icon: '🛴', price: 120, st: KID_UP, speed: 1.5 },
    { id: 'rollers', name: 'Ролики', icon: '🛼', price: 160, st: KID_UP, speed: 1.5 },
    { id: 'skateboard', name: 'Скейтборд', icon: '🛹', price: 180, st: KID_UP, speed: 1.7 },
    { id: 'bike', name: 'Велосипед', icon: '🚲', price: 220, st: KID_UP, speed: 1.9 },
    { id: 'escooter', name: 'Электросамокат', icon: '🛴', price: 380, st: TEEN_UP, speed: 2.2 },
    { id: 'moped', name: 'Мопед', icon: '🛵', price: 700, st: TEEN_UP, speed: 2.5 },
    { id: 'boat', name: 'Лодка', icon: '🚤', price: 900, st: TEEN_UP, speed: 2, water: true },
    { id: 'car', name: 'Машина', icon: '🚗', price: 1500, st: ADULT_UP, speed: 3 },
    { id: 'balloon', name: 'Воздушный шар', icon: '🎈', price: 3000, st: ADULT_UP, speed: 1, air: true },
  ];

  G.GIFTS = [
    { id: 'card', name: 'Открытка', icon: '💌', price: 10, pts: 6 },
    { id: 'chocolate', name: 'Шоколадка', icon: '🍫', price: 15, pts: 8 },
    { id: 'flowers', name: 'Букет ромашек', icon: '💐', price: 30, pts: 14 },
    { id: 'plush', name: 'Плюшевое сердце', icon: '💝', price: 45, pts: 18 },
    { id: 'ring', name: 'Кольцо для предложения', icon: '💍', price: 200, pts: 0, st: ADULT_UP, note: 'Нужно, чтобы сделать предложение' },
  ];

  G.JOBS = [
    { id: 'barista', name: ['Бариста', 'Бариста'], icon: '☕', req: {}, pay: 40, color: '#8a5a3c' },
    { id: 'lifeguard', name: ['Спасатель', 'Спасательница'], icon: '🛟', req: { sport: 15 }, pay: 55, color: '#d9534f' },
    { id: 'cook', name: ['Повар', 'Повар'], icon: '🍳', req: { art: 10 }, pay: 55, color: '#e0a030' },
    { id: 'teacher', name: ['Учитель', 'Учительница'], icon: '🧑‍🏫', req: { mind: 25, social: 10 }, pay: 65, color: '#3f7f5f' },
    { id: 'firefighter', name: ['Пожарный', 'Пожарная'], icon: '🚒', req: { sport: 25 }, pay: 70, color: '#c0392b' },
    { id: 'blogger', name: ['Блогер', 'Блогерша'], icon: '📱', req: { social: 25, art: 10 }, pay: 70, color: '#9b59b6' },
    { id: 'artist', name: ['Художник', 'Художница'], icon: '🎨', req: { art: 30 }, pay: 75, color: '#2e86c1' },
    { id: 'skater', name: ['Фигурист', 'Фигуристка'], icon: '⛸️', req: { sport: 30, art: 15 }, pay: 90, color: '#5dade2' },
    { id: 'musician', name: ['Рок-музыкант', 'Рок-музыкантка'], icon: '🎸', req: { music: 35 }, pay: 90, color: '#2c2c2c' },
    { id: 'jeweler', name: ['Дизайнер украшений', 'Дизайнер украшений'], icon: '💍', req: { art: 35, mind: 15 }, pay: 95, color: '#b8963e' },
    { id: 'tennis', name: ['Теннисист', 'Теннисистка'], icon: '🎾', req: { sport: 40 }, pay: 95, color: '#7cb342' },
    { id: 'doctor', name: ['Врач', 'Врач'], icon: '🩺', req: { mind: 40, social: 10 }, pay: 100, color: '#16a085' },
    { id: 'coder', name: ['Программист', 'Программистка'], icon: '💻', req: { mind: 40 }, pay: 100, color: '#34495e' },
    { id: 'business', name: ['Предприниматель', 'Предпринимательница'], icon: '💼', req: { mind: 30, social: 30 }, pay: 110, color: '#6c4f3d' },
    { id: 'astronaut', name: ['Космонавт', 'Космонавтка'], icon: '🚀', req: { mind: 50, sport: 45 }, pay: 150, color: '#1b2a49' },
  ];
  G.RANKS = ['Стажёр', 'Специалист', 'Мастер', 'Эксперт', 'Звезда'];
  G.jobName = (job, gender) => (Array.isArray(job.name) ? job.name[gender === 'm' ? 0 : 1] : job.name);

  G.PLACES = [
    { id: 'home', name: 'Дом', icon: '🏠', st: ALL, desc: 'Покормить, искупать, уложить спать' },
    { id: 'park', name: 'Парк', icon: '🌳', st: ALL, desc: 'Прогулки, пикник, покататься' },
    { id: 'kindergarten', name: 'Детский сад', icon: '🧸', st: ['baby'], desc: 'Игры, лепка, песенки' },
    { id: 'school', name: 'Школа', icon: '🏫', st: ['kid', 'teen'], desc: 'Уроки, переменки, олимпиады' },
    { id: 'college', name: 'Университет', icon: '🎓', st: TEEN_UP, desc: 'Лекции и выбор профессии' },
    { id: 'work', name: 'Работа', icon: '💼', st: ['adult'], desc: 'Смены, зарплата, карьера' },
    { id: 'sport', name: 'Спорткомплекс', icon: '🎾', st: KID_UP, desc: 'Теннис, фигурное катание, йога' },
    { id: 'music', name: 'Музыкальная школа', icon: '🎸', st: KID_UP, desc: 'Электрогитара, вокал, группа' },
    { id: 'art', name: 'Арт-студия', icon: '🎨', st: ALL, desc: 'Живопись, лепка, украшения' },
    { id: 'library', name: 'Библиотека', icon: '📚', st: KID_UP, desc: 'Книги и подготовка к экзаменам' },
    { id: 'onsen', name: 'Баня и онсэн', icon: '♨️', st: ALL, desc: 'Горячий источник с мандарином' },
    { id: 'cafe', name: 'Кафе «Мандарин»', icon: '☕', st: ALL, desc: 'Вкусно поесть с друзьями' },
    { id: 'cinema', name: 'Кинотеатр', icon: '🎬', st: ALL, desc: 'Мультфильмы и кино' },
    { id: 'circus', name: 'Цирк', icon: '🎪', st: ALL, desc: 'Клоуны, акробаты, жонглёры' },
    { id: 'party', name: 'Вечеринка', icon: '🪩', st: TEEN_UP, desc: 'Танцы, диджей, дни рождения' },
    { id: 'clinic', name: 'Капи-клиника', icon: '🏥', st: ALL, desc: 'Вылечиться и взбодриться' },
    { id: 'dacha', name: 'Дача', icon: '🏡', st: ADULT_UP, desc: 'Огород, рыбалка, внуки' },
    { id: 'square', name: 'Площадь', icon: '⛲', st: ALL, desc: 'Встретить других капибар онлайн' },
  ];

  /* Занятия.
     cost — что тратится (энергия, мандаринки, сытость…), gain — что получаем.
     social — можно пойти вместе с другом. mini — мини-игра. special — особое действие. */
  G.ACTS = [
    // Дом
    { id: 'feed', place: 'home', name: 'Покормить', icon: '🥕', special: 'feed', st: ALL, desc: 'Открыть холодильник' },
    { id: 'bath', place: 'home', name: 'Искупать', icon: '🛁', st: ALL, dur: 4, anim: 'bath', cost: { energy: 3 }, gain: { clean: 45, fun: 6 }, xp: 6 },
    { id: 'sleep', place: 'home', name: 'Уложить спать', icon: '🌙', special: 'sleep', st: ALL, desc: 'Энергия восстановится' },
    { id: 'toy', place: 'home', name: 'Поиграть с игрушкой', icon: '🧸', special: 'toy', st: ALL, desc: 'Выбрать игрушку' },
    { id: 'catch', place: 'home', name: 'Лови мандаринки', icon: '🍊', mini: 'catch', st: ALL, cost: { energy: 8 }, gain: { fun: 22, coins: 18, sport: 1 }, xp: 12, desc: 'Мини-игра' },
    { id: 'chores', place: 'home', name: 'Помочь по дому', icon: '🧹', st: KID_UP, dur: 4, anim: 'work', cost: { energy: 10, clean: 6 }, gain: { coins: 14, social: 1 }, xp: 8, cooldown: 120 },
    { id: 'cook_home', place: 'home', name: 'Приготовить ужин', icon: '🍳', st: TEEN_UP, dur: 5, anim: 'art', cost: { energy: 8 }, gain: { food: 35, art: 2, fun: 6 }, xp: 10, cooldown: 300 },

    // Парк
    { id: 'walk', place: 'park', name: 'Прогулка', icon: '🚶', st: ALL, dur: 5, anim: 'walk', social: true, cost: { energy: 6 }, gain: { fun: 16, health: 5 }, xp: 8 },
    { id: 'ride', place: 'park', name: 'Покататься', icon: '🚲', special: 'ride', st: ALL, need: { vehicle: 1 }, cost: { energy: 8 }, gain: { fun: 26, sport: 2 }, xp: 12, desc: 'На своём транспорте' },
    { id: 'picnic', place: 'park', name: 'Пикник', icon: '🧺', st: ALL, dur: 5, anim: 'eat', social: true, cost: { coins: 10 }, gain: { food: 24, fun: 16, social: 1 }, xp: 10 },
    { id: 'pond', place: 'park', name: 'Поплавать в пруду', icon: '🌊', st: ALL, dur: 5, anim: 'swim', social: true, cost: { energy: 8 }, gain: { fun: 20, clean: 10, sport: 2 }, xp: 10 },
    { id: 'birds', place: 'park', name: 'Покормить птичек', icon: '🐦', st: ALL, dur: 4, anim: 'birds', cost: { coins: 2 }, gain: { fun: 12, social: 1 }, xp: 7 },
    { id: 'catch_park', place: 'park', name: 'Лови мандаринки', icon: '🍊', mini: 'catch', st: ALL, cost: { energy: 8 }, gain: { fun: 22, coins: 18, sport: 1 }, xp: 12, desc: 'Мини-игра' },

    // Детский сад
    { id: 'kg_play', place: 'kindergarten', name: 'Играть с ребятами', icon: '🧸', st: ['baby'], dur: 5, anim: 'play', social: true, cost: { energy: 8 }, gain: { fun: 22, social: 3 }, xp: 12 },
    { id: 'kg_count', place: 'kindergarten', name: 'Занятие: считаем', icon: '🔢', mini: 'quiz', st: ['baby'], social: true, cost: { energy: 5 }, gain: { mind: 4, coins: 10 }, xp: 14, desc: 'Мини-игра' },
    { id: 'kg_model', place: 'kindergarten', name: 'Лепить из пластилина', icon: '🟠', st: ['baby'], dur: 4, anim: 'art', cost: { energy: 5 }, gain: { art: 3, fun: 10 }, xp: 10 },
    { id: 'kg_song', place: 'kindergarten', name: 'Разучить песенку', icon: '🎵', st: ['baby'], dur: 4, anim: 'music', cost: { energy: 4 }, gain: { music: 3, fun: 8 }, xp: 10 },
    { id: 'kg_nap', place: 'kindergarten', name: 'Тихий час', icon: '💤', st: ['baby'], dur: 6, anim: 'nap', gain: { energy: 35 }, xp: 4 },

    // Школа
    { id: 'lesson', place: 'school', name: 'Урок', icon: '✏️', mini: 'quiz', st: ['kid', 'teen'], social: true, cost: { energy: 8, food: 4 }, gain: { mind: 5, coins: 14 }, xp: 18, desc: 'Ответь на вопросы учителя' },
    { id: 'pe', place: 'school', name: 'Физкультура', icon: '🏃', st: ['kid', 'teen'], dur: 5, anim: 'sport', social: true, cost: { energy: 14, food: 8 }, gain: { sport: 4, health: 5 }, xp: 12 },
    { id: 'drawing', place: 'school', name: 'Урок рисования', icon: '🖍️', st: ['kid', 'teen'], dur: 5, anim: 'art', cost: { energy: 6 }, gain: { art: 4, fun: 6 }, xp: 12 },
    { id: 'music_lesson', place: 'school', name: 'Урок музыки', icon: '🎼', st: ['kid', 'teen'], dur: 5, anim: 'music', cost: { energy: 6 }, gain: { music: 4, fun: 6 }, xp: 12 },
    { id: 'recess', place: 'school', name: 'Переменка с друзьями', icon: '🤸', st: ['kid', 'teen'], dur: 4, anim: 'play', social: true, cost: { energy: 6 }, gain: { fun: 18, social: 3 }, xp: 10 },
    { id: 'olymp', place: 'school', name: 'Олимпиада', icon: '🏆', mini: 'quiz', quizBoost: 2, st: ['teen'], cost: { energy: 12 }, gain: { mind: 8, coins: 35 }, xp: 26, cooldown: 600, desc: 'Сложные вопросы' },

    // Университет
    { id: 'lecture', place: 'college', name: 'Лекция', icon: '🧑‍🎓', st: TEEN_UP, dur: 6, anim: 'study', cost: { energy: 14, food: 6 }, gain: { mind: 5 }, xp: 16 },
    { id: 'exam', place: 'college', name: 'Экзамен', icon: '📝', mini: 'quiz', quizBoost: 1, st: TEEN_UP, cost: { energy: 12 }, gain: { mind: 7, coins: 25 }, xp: 22, cooldown: 300 },
    { id: 'choose_job', place: 'college', name: 'Выбрать профессию', icon: '🧭', special: 'job', st: ADULT_UP, desc: 'Зависит от навыков' },
    { id: 'courses', place: 'college', name: 'Курсы мастерства', icon: '📐', st: ADULT_UP, dur: 6, anim: 'study', cost: { energy: 12, coins: 30 }, gain: { mind: 3, art: 3, social: 1 }, xp: 18 },

    // Работа
    { id: 'shift', place: 'work', name: 'Отработать смену', icon: '💼', special: 'shift', st: ['adult'], need: { job: 1 }, cost: { energy: 20, food: 10 }, xp: 22, desc: 'Зарплата и карьера' },
    { id: 'overtime', place: 'work', name: 'Подработка', icon: '⏰', special: 'shift', mult: 0.6, st: ['adult'], need: { job: 1 }, cost: { energy: 12, fun: 8 }, xp: 10, cooldown: 180 },
    { id: 'corporate', place: 'work', name: 'Корпоратив', icon: '🥂', st: ['adult'], need: { job: 1 }, dur: 5, anim: 'dance', social: true, cost: { energy: 10 }, gain: { fun: 24, social: 3 }, xp: 12, cooldown: 600 },

    // Спорткомплекс
    { id: 'tennis', place: 'sport', variant: 'court', name: 'Теннис', icon: '🎾', mini: 'tennis', toy: 'racket', st: KID_UP, social: true, cost: { energy: 14, food: 6 }, gain: { sport: 5, fun: 14, coins: 12 }, xp: 18, desc: 'Мини-игра' },
    { id: 'skating', place: 'sport', variant: 'rink', name: 'Фигурное катание', icon: '⛸️', mini: 'skate', toy: 'skates', st: KID_UP, cost: { energy: 14, food: 6 }, gain: { sport: 4, art: 3, coins: 12 }, xp: 18, desc: 'Повтори программу' },
    { id: 'yoga', place: 'sport', variant: 'yoga', name: 'Йога', icon: '🧘', st: KID_UP, dur: 5, anim: 'yoga', cost: { coins: 5 }, gain: { energy: 12, health: 10, fun: 6 }, xp: 10 },
    { id: 'gym', place: 'sport', variant: 'gym', name: 'Фитнес-зал', icon: '🏋️', st: TEEN_UP, dur: 5, anim: 'sport', cost: { energy: 18, food: 10, coins: 8 }, gain: { sport: 5, health: 8 }, xp: 14 },
    { id: 'swim', place: 'sport', variant: 'pool', name: 'Бассейн', icon: '🏊', st: KID_UP, dur: 5, anim: 'swim', social: true, cost: { energy: 12, coins: 6 }, gain: { sport: 4, clean: 12, fun: 12 }, xp: 14 },

    // Музыкальная школа
    { id: 'guitar', place: 'music', name: 'Электрогитара', icon: '🎸', mini: 'guitar', toy: 'guitar', st: KID_UP, cost: { energy: 10 }, gain: { music: 6, fun: 14, coins: 12 }, xp: 18, desc: 'Сыграй в ритм' },
    { id: 'vocal', place: 'music', name: 'Вокал', icon: '🎤', st: KID_UP, dur: 5, anim: 'music', cost: { energy: 8 }, gain: { music: 4, fun: 8 }, xp: 12 },
    { id: 'band', place: 'music', name: 'Репетиция группы', icon: '🥁', st: TEEN_UP, dur: 6, anim: 'music', social: true, cost: { energy: 12 }, gain: { music: 5, social: 3, fun: 12 }, xp: 16 },
    { id: 'concert', place: 'music', name: 'Концерт', icon: '🎶', st: TEEN_UP, dur: 6, anim: 'dance', cost: { energy: 18 }, gain: { coins: 45, fun: 20, music: 2 }, xp: 22, cooldown: 900, need: { skill: ['music', 30] } },

    // Арт-студия
    { id: 'paint', place: 'art', name: 'Написать картину', icon: '🖌️', special: 'paint', toy: 'easel', st: ALL, dur: 6, anim: 'art', cost: { energy: 10, coins: 4 }, gain: { art: 5, fun: 10 }, xp: 16 },
    { id: 'sculpt', place: 'art', name: 'Лепка из глины', icon: '🏺', st: ALL, dur: 5, anim: 'art', cost: { energy: 8 }, gain: { art: 4, fun: 8 }, xp: 12 },
    { id: 'jewelry', place: 'art', name: 'Дизайн украшений', icon: '💍', st: TEEN_UP, dur: 6, anim: 'art', cost: { energy: 10 }, gain: { art: 5, mind: 1, coins: 18 }, xp: 16 },

    // Библиотека
    { id: 'read', place: 'library', name: 'Читать книги', icon: '📖', st: KID_UP, dur: 5, anim: 'study', cost: { energy: 5 }, gain: { mind: 4, fun: 5 }, xp: 12 },
    { id: 'prepare', place: 'library', name: 'Готовиться к экзаменам', icon: '🗂️', st: KID_UP, dur: 6, anim: 'study', cost: { energy: 14, fun: 6 }, gain: { mind: 7 }, xp: 16 },
    { id: 'club', place: 'library', name: 'Книжный клуб', icon: '☕', st: TEEN_UP, dur: 5, anim: 'study', social: true, cost: { energy: 6 }, gain: { mind: 3, social: 3, fun: 8 }, xp: 12 },

    // Баня и онсэн
    { id: 'onsen', place: 'onsen', variant: 'onsen', name: 'Онсэн с мандарином', icon: '♨️', st: ALL, dur: 6, anim: 'onsen', social: true, cost: { coins: 8 }, gain: { clean: 35, health: 10, fun: 20, energy: 14 }, xp: 12 },
    { id: 'banya', place: 'onsen', variant: 'banya', name: 'Русская баня с веником', icon: '🌿', st: KID_UP, dur: 6, anim: 'banya', social: true, cost: { coins: 10 }, gain: { clean: 45, health: 15, fun: 12 }, xp: 12 },
    { id: 'massage', place: 'onsen', variant: 'onsen', name: 'Массаж', icon: '💆', st: TEEN_UP, dur: 5, anim: 'nap', cost: { coins: 20 }, gain: { fun: 16, health: 6, energy: 10 }, xp: 8 },

    // Кафе
    { id: 'cafe_eat', place: 'cafe', name: 'Пообедать', icon: '🍝', st: ALL, dur: 5, anim: 'eat', social: true, cost: { coins: 24 }, gain: { food: 48, fun: 10 }, xp: 10 },
    { id: 'icecream', place: 'cafe', name: 'Мороженое', icon: '🍨', st: ALL, dur: 4, anim: 'eat', social: true, cost: { coins: 12 }, gain: { food: 10, fun: 18 }, xp: 8 },
    { id: 'date', place: 'cafe', name: 'Свидание', icon: '💞', st: ADULT_UP, dur: 6, anim: 'eat', need: { partner: 1 }, social: 'partner', cost: { coins: 30 }, gain: { fun: 32, social: 4, food: 20 }, xp: 16 },

    // Кино
    { id: 'movie', place: 'cinema', name: 'Смотреть кино', icon: '🍿', special: 'movie', st: ALL, dur: 6, anim: 'watch', social: true, cost: { coins: 18 }, gain: { fun: 28 }, xp: 10 },

    // Цирк
    { id: 'show', place: 'circus', name: 'Цирковое представление', icon: '🤡', st: ALL, dur: 6, anim: 'laugh', social: true, cost: { coins: 22 }, gain: { fun: 34 }, xp: 12 },
    { id: 'juggle', place: 'circus', name: 'Научиться жонглировать', icon: '🤹', st: KID_UP, dur: 5, anim: 'sport', cost: { energy: 10 }, gain: { sport: 2, art: 2, fun: 10 }, xp: 12 },

    // Вечеринка
    { id: 'dance', place: 'party', name: 'Танцевать', icon: '💃', st: TEEN_UP, dur: 6, anim: 'dance', social: true, cost: { energy: 16 }, gain: { fun: 28, social: 4 }, xp: 14 },
    { id: 'dj', place: 'party', name: 'Встать за пульт', icon: '🎧', st: TEEN_UP, dur: 5, anim: 'music', cost: { energy: 10 }, gain: { music: 4, fun: 14 }, xp: 12 },
    { id: 'birthday', place: 'party', name: 'Устроить день рождения', icon: '🎂', st: TEEN_UP, dur: 7, anim: 'dance', social: true, cost: { coins: 60 }, gain: { fun: 45, social: 6, food: 20 }, xp: 25, cooldown: 1800 },

    // Клиника
    { id: 'doctor_visit', place: 'clinic', name: 'Осмотр у врача', icon: '🩺', st: ALL, dur: 5, anim: 'heal', cost: { coins: 15 }, gain: { health: 45 }, xp: 5 },
    { id: 'vitamins', place: 'clinic', name: 'Витаминки', icon: '💊', st: ALL, dur: 3, anim: 'eat', cost: { coins: 8 }, gain: { health: 15, energy: 5 }, xp: 3 },

    // Дача
    { id: 'garden', place: 'dacha', name: 'Огород', icon: '🥬', special: 'garden', st: ADULT_UP, dur: 6, anim: 'work', cost: { energy: 14 }, gain: { health: 5, fun: 6 }, xp: 14, cooldown: 300 },
    { id: 'fishing', place: 'dacha', name: 'Рыбалка', icon: '🎣', st: ADULT_UP, dur: 6, anim: 'nap', social: true, cost: { energy: 4 }, gain: { fun: 22 }, xp: 10 },
    { id: 'chess', place: 'dacha', name: 'Шахматы с соседом', icon: '♟️', st: ADULT_UP, dur: 5, anim: 'study', social: true, gain: { mind: 4, fun: 10 }, xp: 10 },
    { id: 'grandkids', place: 'dacha', name: 'Нянчить внуков', icon: '👶', st: ['elder'], need: { kids: 1 }, dur: 6, anim: 'play', cost: { energy: 10 }, gain: { fun: 35, social: 3 }, xp: 18 },
    { id: 'pension', place: 'dacha', name: 'Получить пенсию', icon: '💌', special: 'pension', st: ['elder'], cooldown: 4 * 3600, desc: 'Раз в 4 часа' },
  ];
  G.actById = (id) => G.ACTS.find((a) => a.id === id);

  G.NPCS = [
    { id: 'npc_zefir', name: 'Зефирка', gender: 'f', fur: 'sand', outfit: { hat: 'bow' } },
    { id: 'npc_bublik', name: 'Бублик', gender: 'm', fur: 'ginger', outfit: { hat: 'cap' } },
    { id: 'npc_kuzya', name: 'Кузя', gender: 'm', fur: 'choco', outfit: { neck: 'scarf' } },
    { id: 'npc_yuzu', name: 'Тётушка Юдзу', gender: 'f', fur: 'ash', outfit: { hat: 'yuzu', eyes: 'roundglasses' }, stage: 'elder' },
  ];

  G.MOVIES = [
    'Капибара и мандариновый остров',
    'Пушистый агент 007',
    'Холодное сердечко: капи на льду',
    'Рок-н-ролл на болоте',
    'Капибара, которая умела ждать',
    'Капи-пираты тёплых морей',
    'Быстрее ветра: капибара на скейте',
  ];
  G.PAINTINGS = [
    ['Звёздная ночь над рекой', 'Ван Гог'],
    ['Подсолнухи для капибары', 'Ван Гог'],
    ['Кувшинки и капибара', 'Моне'],
    ['Капи-Лиза', 'Леонардо да Винчи'],
    ['Девочка с мандаринами', 'Серов'],
    ['Утро в сосновом бору, но с капибарами', 'Шишкин'],
    ['Чёрный квадрат, но пушистый', 'Малевич'],
    ['Постоянство сна', 'Дали'],
    ['Танцовщицы на льду', 'Дега'],
    ['Девушка с жемчужной серёжкой', 'Вермеер'],
    ['Композиция в мандариновых тонах', 'Кандинский'],
    ['Крик радости', 'Мунк'],
  ];
  G.PHRASES = ['Привет!', 'Пойдём играть?', 'Ты классная!', 'Ура!', 'Как дела?', 'Го в кино!', 'Спасибо!', 'Спокойной ночи!', 'Хочу мандаринку', 'Давай дружить!'];
  G.EMOTES = ['👋', '❤️', '😂', '🎉', '🍊', '😴'];
  G.NAMES = ['Кэпи', 'Буся', 'Персик', 'Мандаринка', 'Зефир', 'Пончик', 'Ириска', 'Чиза', 'Тоша', 'Юдзу', 'Кекс', 'Плюша'];
})(window.CAPY);
