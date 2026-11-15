// Every word the player reads, in Arabic and English. Owner: Set C.
//
//   t('menu.start')                 interface text by id, in the chosen language
//   t('save.chapter', { n: 3 })     with {placeholders}
//   translate('Hold E: ...')        a sentence written in English inside chapter code, in the chosen language
//   registerPairs(json)             teach translate() every { en, ar } pair inside a content file
//
// Chapter scripts (Set A) write their prompts in English. Instead of editing every chapter, the interface
// translates those sentences where it draws them (HUD, objective, navigation). Sentences that already carry
// both languages ("English · عربي") show only the chosen half.
import { prefs } from './prefs.js';

const UI = {
  // Landing page
  'landing.challenge': { en: 'NASA Space Apps Challenge 2026', ar: 'تحدي ناسا لتطبيقات الفضاء 2026' },
  'landing.theme': { en: 'Abandoned, but not Forgotten', ar: 'مهجورة، لكنها لم تُنسَ' },
  'landing.title': { en: 'RELICA: Still Here', ar: 'ريليكا: ما زلتُ هنا' },
  'landing.line': {
    en: 'Drive, fly and listen as the machines humanity left in space tell the stories they lived.',
    ar: 'قُد وحلّق واستمع إلى الآلات التي تركها البشر في الفضاء وهي تروي حكاياتها.',
  },
  'landing.github': { en: 'GitHub', ar: 'GitHub' },
  'landing.githubSub': { en: 'repository', ar: 'المستودع' },
  'landing.start': { en: 'Start the game', ar: 'ابدأ اللعبة' },
  'landing.team': { en: 'Relica team', ar: 'فريق ريليكا' },
  'landing.desktop': { en: 'Best played on a computer with a keyboard', ar: 'تُلعب بأفضل شكل على جهاز كمبيوتر بلوحة مفاتيح' },

  // Loader
  'load.title': { en: 'Preparing the expedition', ar: 'نجهّز الرحلة' },
  'load.code': { en: 'Loading the game engine', ar: 'تحميل محرّك اللعبة' },
  'load.models': { en: 'Loading the machines', ar: 'تحميل الآلات' },
  'load.photos': { en: 'Loading NASA photographs', ar: 'تحميل صور ناسا' },
  'load.data': { en: 'Loading missions and texts', ar: 'تحميل المهمات والنصوص' },
  'load.textures': { en: 'Loading the ground textures', ar: 'تحميل خامات الأرض' },
  'load.fonts': { en: 'Loading fonts', ar: 'تحميل الخطوط' },
  'load.start': { en: 'Starting physics and worlds', ar: 'تشغيل الفيزياء والعوالم' },
  'load.ready': { en: 'Ready', ar: 'جاهز' },
  'load.error': { en: 'Some files could not load. Check the connection and try again.', ar: 'تعذّر تحميل بعض الملفات. تحقّق من الاتصال وأعد المحاولة.' },
  'load.retry': { en: 'Try again', ar: 'أعد المحاولة' },
  'load.files': { en: '{done} of {total} files', ar: '{done} من {total} ملفًا' },

  // Main menu
  'menu.continue': { en: 'Continue', ar: 'متابعة' },
  'menu.new': { en: 'New game', ar: 'لعبة جديدة' },
  'menu.chapters': { en: 'Chapters', ar: 'الفصول' },
  'menu.settings': { en: 'Settings', ar: 'الإعدادات' },
  'menu.howto': { en: 'How to play', ar: 'طريقة اللعب' },
  'menu.credits': { en: 'Credits', ar: 'فريق العمل' },
  'menu.back': { en: 'Back', ar: 'رجوع' },
  'menu.close': { en: 'Close', ar: 'إغلاق' },
  'menu.resume': { en: 'Resume', ar: 'تابع اللعب' },
  'menu.restart': { en: 'Restart chapter', ar: 'أعد الفصل' },
  'menu.quit': { en: 'Main menu', ar: 'القائمة الرئيسية' },
  'menu.paused': { en: 'Paused', ar: 'اللعبة متوقفة' },
  'menu.newConfirm': { en: 'Start again from the beginning? Your saved progress will be replaced.', ar: 'تبدأ من البداية؟ سيُستبدل تقدّمك المحفوظ.' },
  'menu.yes': { en: 'Start again', ar: 'ابدأ من جديد' },
  'menu.no': { en: 'Keep my progress', ar: 'احتفظ بتقدّمي' },
  'save.chapter': { en: 'Chapter {n} · {name}', ar: 'الفصل {n} · {name}' },
  'save.when': { en: 'Saved {when}', ar: 'حُفظ {when}' },
  'save.none': { en: 'No saved game yet', ar: 'لا توجد لعبة محفوظة بعد' },
  'save.memories': { en: '{n} photos collected', ar: 'جمعت {n} صور' },

  // Chapter names for the menu and saves
  'chapter.opening': { en: 'Wake up', ar: 'الاستيقاظ' },
  'chapter.moon': { en: 'The Moon', ar: 'القمر' },
  'chapter.mars': { en: 'Mars', ar: 'المريخ' },
  'chapter.sky': { en: 'Jezero crater', ar: 'فوهة جيزيرو' },
  'chapter.epilogue': { en: 'Deep space', ar: 'الفضاء السحيق' },

  // Settings
  'set.language': { en: 'Language', ar: 'اللغة' },
  'set.graphics': { en: 'Graphics quality', ar: 'جودة الرسومات' },
  'set.low': { en: 'Low', ar: 'منخفضة' },
  'set.medium': { en: 'Medium', ar: 'متوسطة' },
  'set.high': { en: 'High', ar: 'عالية' },
  'set.lowInfo': { en: 'Smoothest on older laptops', ar: 'الأنعم على الأجهزة الأقدم' },
  'set.mediumInfo': { en: 'Balanced detail and speed', ar: 'توازن بين التفاصيل والسرعة' },
  'set.highInfo': { en: 'Sharpest picture and shadows', ar: 'أوضح صورة وظلال' },
  'set.applying': { en: 'Applying…', ar: 'جارٍ التطبيق…' },
  'set.failed': { en: 'Could not change the graphics. The previous setting is kept.', ar: 'تعذّر تغيير الرسومات، وبقي الإعداد السابق.' },
  'set.sound': { en: 'Sound', ar: 'الصوت' },
  'set.master': { en: 'All sound', ar: 'الصوت العام' },
  'set.music': { en: 'Music', ar: 'الموسيقى' },
  'set.voice': { en: 'Character voices', ar: 'أصوات الشخصيات' },
  'set.sfx': { en: 'Effects', ar: 'المؤثرات' },
  'set.mute': { en: 'Mute everything', ar: 'كتم كل الأصوات' },
  'set.on': { en: 'On', ar: 'تشغيل' },
  'set.off': { en: 'Off', ar: 'إيقاف' },
  'set.subtitles': { en: 'Second-language subtitles', ar: 'ترجمة باللغة الأخرى' },
  'set.subtitlesInfo': { en: 'Show the other language under each line', ar: 'إظهار اللغة الأخرى تحت كل جملة' },
  'set.saved': { en: 'Settings are saved on this device', ar: 'تُحفظ الإعدادات على هذا الجهاز' },

  // How to play
  'how.drive': { en: 'Drive and steer', ar: 'القيادة والتوجيه' },
  'how.driveInfo': { en: 'Forward, back, left and right', ar: 'للأمام وللخلف ولليمين ولليسار' },
  'how.act': { en: 'Interact', ar: 'التفاعل' },
  'how.actInfo': { en: 'Hold near a marked spot', ar: 'اضغط باستمرار قرب الموقع المحدد' },
  'how.fly': { en: 'Jump and fly', ar: 'القفز والطيران' },
  'how.flyInfo': { en: 'Hold to lift, let go to land', ar: 'اضغط باستمرار للإقلاع واتركه للهبوط' },
  'how.next': { en: 'Continue', ar: 'متابعة' },
  'how.nextInfo': { en: 'Next line or photo', ar: 'الجملة أو الصورة التالية' },
  'how.pause': { en: 'Pause and settings', ar: 'الإيقاف والإعدادات' },
  'how.restart': { en: 'Restart chapter', ar: 'إعادة الفصل' },
  'how.skip': { en: 'Skip a cutscene', ar: 'تخطي المشهد' },
  'how.goal': { en: 'Follow the marker', ar: 'اتبع العلامة' },
  'how.goalInfo': { en: 'The dot on the compass points to your next goal', ar: 'النقطة على البوصلة تشير إلى هدفك التالي' },

  // In game
  'hud.settings': { en: 'Settings', ar: 'الإعدادات' },
  'hud.pause': { en: 'Pause', ar: 'إيقاف مؤقت' },
  'hud.hold': { en: 'Hold', ar: 'اضغط باستمرار' },
  'controls.liftoff': { en: 'Hold to lift off', ar: 'اضغط باستمرار للإقلاع' },
  'controls.climb': { en: 'Hold to climb, let go to descend', ar: 'اضغطه للصعود واتركه للنزول' },
  'controls.fly': { en: 'Fly forward and back', ar: 'للطيران للأمام والخلف' },
  'controls.turn': { en: 'Turn', ar: 'للالتفاف' },
  'controls.drive': { en: 'Drive', ar: 'للقيادة' },
  'controls.steer': { en: 'Steer', ar: 'للتوجيه' },
  'controls.hop': { en: 'Hop', ar: 'للقفز' },
  'hud.unverified': { en: 'Not yet checked against a NASA source', ar: 'لم تُراجع المعلومة بعد مع مصدر ناسا' },
  'hud.discovery': { en: 'Discovery', ar: 'اكتشاف' },
  'hud.next': { en: 'Continue', ar: 'متابعة' },
  'hud.skip': { en: 'Skip', ar: 'تخطٍّ' },
  'hud.realPhoto': { en: 'A real photo from NASA', ar: 'صورة حقيقية من ناسا' },
  'hud.mission': { en: 'Mission', ar: 'المهمة' },
  'hud.planned': { en: 'planned {n}', ar: 'المخطط {n}' },

  // End screens
  'end.tribute': { en: 'In honor of their service', ar: 'تقديرًا لما قدّمته هذه الآلات' },
  'end.collected': { en: 'Your collected memories', ar: 'الذكريات التي جمعتها' },
  'end.none': { en: 'No memories collected yet', ar: 'لم تُجمع ذكريات بعد' },
  'end.discovered': { en: 'What you discovered', ar: 'اكتشافاتك' },
  'end.source': { en: 'NASA source {n}', ar: 'مصدر ناسا {n}' },
  'end.photoError': { en: 'The NASA image could not load. You can continue and retry this chapter.', ar: 'تعذّر تحميل صورة ناسا. يمكنك المتابعة وإعادة هذا الفصل لاحقًا.' },
  'credits.title': { en: 'Credits', ar: 'فريق العمل والمصادر' },
  'credits.team': { en: 'Made by', ar: 'صُنعت بأيدي' },
  'credits.photos': { en: 'NASA photographs (images.nasa.gov)', ar: 'صور ناسا (images.nasa.gov)' },
  'credits.again': { en: 'Play from the start', ar: 'العب من البداية' },
  'credits.menu': { en: 'Back to main menu', ar: 'العودة إلى القائمة الرئيسية' },
  'credits.thanks': { en: 'Thank you for listening', ar: 'شكرًا لأنك أصغيت' },
  'credits.lede': { en: 'They were left behind, but their signals still speak. A game by five friends for NASA Space Apps 2026.', ar: 'تُركت هناك، لكن إشاراتها ما زالت تتكلم. لعبة صنعها خمسة أصدقاء لتحدي ناسا لتطبيقات الفضاء 2026.' },
  'credits.sources': { en: 'Sources and tools', ar: 'المصادر والأدوات' },
  'credits.fin': { en: 'Still here.', ar: 'ما زلنا هنا.' },
};

// Chapter prompts written in English inside chapter code, and fixed HUD words.
const DICT = new Map(Object.entries({
  gravity: 'الجاذبية', temperature: 'درجة الحرارة', pressure: 'الضغط', battery: 'البطارية', date: 'التاريخ',
  sol: 'اليوم المريخي', flight: 'الرحلة', flights: 'الرحلات', altitude: 'الارتفاع', driven: 'المسافة',
  phase: 'المرحلة', mission: 'المهمة', 'water evidence': 'أدلة المياه', 'solar input': 'الطاقة الشمسية',
  'sample boxes': 'صناديق العينات', Bonus: 'إنجاز إضافي', 'Longest jump': 'أطول قفزة',
  'Assembly building': 'مبنى التجهيز', 'Taurus–Littrow valley': 'وادي توروس ليترو', Surface: 'السطح',
  'Beyond the planets': 'ما وراء الكواكب', 'Jezero crater': 'فوهة جيزيرو',
  'about 20 °C, clean room': 'نحو 20 °C، غرفة نظيفة', '1 atmosphere (1,014 mbar)': 'ضغط جوي واحد (1,014 mbar)',
  'about +117 °C day, −178 °C night': 'نحو +117 °C نهارًا و−178 °C ليلًا', 'almost none (3 × 10⁻¹⁵ bar)': 'شبه معدوم (3 × 10⁻¹⁵ bar)',
  'about −59 °C on average': 'نحو −59 °C في المتوسط', 'about 6 mbar, under 1% of Earth': 'نحو 6 mbar، أقل من 1% من الأرض',
  'about −270 °C (2.7 K)': 'نحو −270 °C (2.7 K)', vacuum: 'فراغ', 'm/s² (drifting)': 'm/s² (طفو حر)',
  'The Moon': 'القمر', Mars: 'المريخ', 'Deep space': 'الفضاء السحيق', Factory: 'غرفة التجهيز', Earth: 'الأرض',
  'Jupiter flyby': 'التحليق قرب المشتري', 'Pioneer 10': 'بايونير 10', 'Viking 1': 'فايكنغ 1',
  Opportunity: 'أوبورتيونيتي', Ingenuity: 'إنجينويتي', Jupiter: 'المشتري',
  'December 1973': 'ديسمبر 1973', 'Dec 1972': 'ديسمبر 1972', 'Last signal: 2003': 'آخر إشارة: 2003', planned: 'المخطط لها', 'imagined conversation': 'محادثة متخيّلة',
  'Chryse Planitia · August 1976': 'سهل كريس · أغسطس 1976',
  'Extended mission · compressed scouting route': 'المهمة الممتدة · مسار استطلاع مختصر',
  'Search for evidence of past liquid water': 'ابحث عن أدلة على مياه سائلة قديمة',
  'Battery protected through the science traverse': 'حُميت البطارية طوال الرحلة العلمية',

  // Opening
  'W and S: try your wheels': 'جرّب عجلاتك بالمفتاحين W و S', 'A and D: try your steering': 'جرّب التوجيه بالمفتاحين A و D',
  // Moon
  'Drive the crew to science stop 1': 'انقل الطاقم إلى المحطة العلمية الأولى', 'Drive on to science stop 2': 'تابع إلى المحطة العلمية الثانية',
  'Drive blind: follow the beeping marker': 'قُد دون رؤية: اتبع صوت العلامة', 'Carry the crew to the last geology site': 'انقل الطاقم إلى آخر موقع جيولوجي',
  'The crew is collecting lunar geology samples': 'يجمع الطاقم عينات من صخور القمر', 'The crew is repairing the fender': 'يصلح الطاقم واقي العجلة',
  'The last samples': 'العينات الأخيرة', 'Park where you can see the Lunar Module': 'توقّف في مكان ترى منه المركبة القمرية',
  'Hold E: secure the crew’s rock samples for the return trip': 'ثبّت عينات الطاقم لرحلة العودة',
  'Hold E: secure the second geology sample box': 'ثبّت صندوق العينات الثاني', 'Hold E: secure the last geology samples': 'ثبّت العينات الأخيرة',
  // Mars
  'Reach the hematite blueberries': 'توجّه إلى كرات الهيماتيت الصغيرة',
  'Find the outcrop: test its minerals for a watery past': 'ابحث عن الصخور المكشوفة وافحص معادنها بحثًا عن ماضٍ مائي',
  'Inspect the fine layers in the next outcrop': 'افحص الطبقات الدقيقة في الصخور التالية',
  'Hold E: examine the blueberries with your instruments': 'افحص الكرات الصغيرة بأدواتك',
  'Hold E: grind the crust, then analyze the exposed rock': 'اطحن القشرة ثم حلّل الصخر المكشوف',
  'Hold E: scan the tilted layers in the rock': 'امسح الطبقات المائلة في الصخر', 'Hold E: examine the Potts rock target': 'افحص صخرة بوتس',
  'Hold E: transmit the science record to Earth': 'أرسل السجل العلمي إلى الأرض',
  'Hold E: deliver a soil sample to the biology experiments': 'أوصل عينة تربة إلى تجارب الأحياء',
  'Hematite-rich spheres formed in water-altered rock.': 'كرات غنية بالهيماتيت تكوّنت في صخور غيّرها الماء.',
  'Jarosite: a mineral that records contact with acidic water.': 'الجاروسيت معدن يسجّل تلامس الصخر مع ماء حمضي.',
  'Cross-lamination: evidence of ripples made by flowing water.': 'طبقات متقاطعة: دليل على تموّجات صنعها ماء جارٍ.',
  'Still investigating, twelve years later': 'بعد اثنتي عشرة سنة، ما زالت تفحص الصخور',
  'Dust is blocking the sunlight. Solar power is falling.': 'يحجب الغبار ضوء الشمس، والطاقة الشمسية تنخفض.',
  'No sunlight reaches the panels. Last contact: 10 June 2018.': 'لا يصل ضوء الشمس إلى الألواح. آخر اتصال: 10 يونيو 2018.',
  'More than fourteen years of discovery': 'أكثر من أربع عشرة سنة من الاكتشاف',
  'Evidence of ancient water sent home. Last contact: 10 June 2018.': 'أرسلت أدلة على مياه قديمة. آخر اتصال: 10 يونيو 2018.',
  'Viking 1 · Chryse Planitia · 1976': 'فايكنغ 1 · سهل كريس · 1976',
  'First successful U.S. Mars landing': 'أول هبوط أمريكي ناجح على المريخ',
  'A search for life, not a confirmed discovery': 'بحث عن الحياة، لا اكتشاف مؤكد',
  'The experiments found no definitive evidence of life.': 'لم تؤكّد التجارب وجود حياة.',
  '2017 · imagined conversation': '2017 · حوار متخيّل', 'Imagined conversation': 'حوار متخيّل',
  'IMAGINED RADIO · CHRYSE PLANITIA': 'حوار متخيّل · سهل كريس',
  // Ingenuity
  'Hold Space to spin up the rotor': 'اضغط Space باستمرار لتشغيل المروحة', 'Keep holding Space: climb to 3 metres': 'استمر بالضغط على Space حتى ترتفع 3 أمتار',
  'Too low: tap Space to stay inside the band': 'منخفض جدًا: اضغط Space لتبقى داخل النطاق', 'Too high: let go of Space': 'مرتفع جدًا: اترك Space',
  'Let go of Space to land on the pad': 'اترك Space لتهبط على المنصة',
  'Beyond the five-flight demonstration': 'أبعد من الرحلات الخمس التجريبية', 'Now an aerial scout for Perseverance': 'صارت الآن مستكشفًا جويًا لبيرسيفيرانس',
  'Press E: report the hazard': 'اضغط E للإبلاغ عن الخطر', 'Land on the pad before the battery runs out': 'اهبط على المنصة قبل نفاد البطارية',
  'Land on the pad': 'اهبط على المنصة', 'The rover follows your safe route': 'تتبع العربة المسار الآمن الذي رسمته',
  'Last flight: scout the smooth sand ahead': 'الرحلة الأخيرة: استطلع الرمال الملساء أمامك',
  'Space: try to lift off again': 'اضغط Space لتحاول الإقلاع مجددًا', 'Space: try once more · Enter: let the rover continue': 'اضغط Space لتحاول مرة أخرى، أو Enter لتكمل العربة طريقها',
  'Landing pad': 'منصة الهبوط', 'Let go of Space to land': 'اترك Space للهبوط',
  'Not on the pad. Hold Space to lift off again': 'لست على المنصة. اضغط Space باستمرار لتقلع مجددًا',
  'the sand trap': 'مصيدة الرمال', 'the cliff edge': 'حافة الجرف', 'the boulder field': 'حقل الصخور',
  // Photos and Pioneer
  'Space: capture this mission view': 'اضغط Space لالتقاط هذا المشهد',
  'Recreated camera view · A/D and W/S to frame · Space to photograph': 'مشهد معاد بناؤه · وجّه بالمفاتيح A و D و W و S ثم اضغط Space للتصوير',
  'Jupiter captured in the game': 'صورة المشتري الملتقطة في اللعبة', 'Game image': 'صورة من اللعبة',
  'Space: capture Jupiter': 'اضغط Space لتصوير المشتري', 'A / D: frame Jupiter': 'استخدم A و D لتضع المشتري داخل الإطار',
  'A / D: turn toward Earth to send': 'استخدم A و D لتتجه نحو الأرض وترسل الصورة', 'Image sent home': 'أُرسلت الصورة إلى الأرض',
  '21 months planned. More than 30 years.': 'مهمة مقررة لـ21 شهرًا امتدت أكثر من 30 سنة.',
  // Epilogue
  'A and D: turn back toward the Sun': 'استخدم A و D لتعود باتجاه الشمس', 'Hold still…': 'ابقَ ثابتًا…',
  'The end. Press 1 to play again': 'النهاية. اضغط 1 لتلعب من جديد',
  'The end': 'النهاية',
  // Memory photo titles (content/memories.json keeps one English title per photo)
  'A training rover, 1971': 'عربة تدريب، 1971', 'The fender repair, Apollo 17': 'إصلاح واقي العجلة، أبولو 17',
  'Grinding a rock': 'طحن صخرة', 'Frost on Opportunity': 'صقيع على أوبورتيونيتي', 'Orion crater': 'فوهة أوريون',
  'Ingenuity, ready to fly': 'إنجينويتي جاهزة للطيران', 'Its two cameras': 'الكاميرتان', 'Pioneer 10, being readied': 'تجهيز بايونير 10',
  'The Pioneer plaque': 'لوحة بايونير', "Beside Viking 1's footpad": 'بجوار قدم فايكنغ 1', 'Jupiter through Pioneer 10’s eyes': 'المشتري بعيني بايونير 10',
  // Objectives and navigation
  'Stop here': 'توقف هنا', 'You are here': 'وصلت', 'Stop inside the circle': 'توقف داخل الدائرة',
  Ahead: 'أمامك', 'Behind you': 'خلفك', 'To your right': 'على يمينك', 'To your left': 'على يسارك',
}));

// Some prompts carry a number or a name; these patterns translate them.
const PATTERNS = [
  [/^Hold E: (.+)$/, (m, rest) => translate(`Hold E: ${rest}`, true)],
  [/^(.+) · (\d+) m$/, (m, s, n) => `${translate(s)} · ${n} م`],
  [/^Hold it inside the band\s+([\d.]+) s$/, (m, n) => `ابقَ داخل النطاق ${n} ث`],
  [/^Solar recharge: (\d+)% · lift resumes at 35%$/, (m, n) => `شحن شمسي ${n}% · يعود الإقلاع عند 35%`],
  [/^Fly over (.+)$/, (m, n) => `حلّق فوق ${translate(n)}`],
  [/^Press E above (.+) to report it to the rover$/, (m, n) => `اضغط E فوق ${translate(n)} لإبلاغ العربة`],
  [/^Frame (.+): (A: left|D: right|S: down|W: up)$/, (m, n, d) => `وجّه الكاميرا نحو ${translate(n)} · ${{ 'A: left': 'A لليسار', 'D: right': 'D لليمين', 'S: down': 'S للأسفل', 'W: up': 'W للأعلى' }[d]}`],
  [/^Scanning image (\d+)%$/, (m, n) => `جارٍ تسجيل الصورة ${n}%`],
  [/^Sending image (\d+)%$/, (m, n) => `جارٍ إرسال الصورة ${n}%`],
  [/^planned: (.+)$/, (m, n) => `المخطط ${n}`],
  [/^(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/, (m, d, mo, y) => `${d} ${MONTHS[mo]} ${y}`],
  [/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/, (m, mo, y) => `${MONTHS[mo]} ${y}`],
  [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, (m, d, mo, y) => `${d} ${MONTHS[SHORT[mo]]} ${y}`],
  [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, (m, mo, y) => `${MONTHS[SHORT[mo]]} ${y}`],
  [/^(\d{4}) → (\d{4})$/, (m, a, b) => `من ${a} إلى ${b}`],
  [/^(\d+) months$/, (m, n) => `${n} شهرًا`],
  [/^sol ([\d,]+)$/, (m, n) => `اليوم المريخي ${n}`],
  [/^([\d.,]+) m$/, (m, n) => `${n} م`],
  [/^([\d.,]+) s$/, (m, n) => `${n} ث`],
];
const SHORT = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
const MONTHS = { January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل', May: 'مايو', June: 'يونيو', July: 'يوليو', August: 'أغسطس', September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر', December: 'ديسمبر' };

const PHOTO_WORDS = { 'front hazard camera': 'كاميرا تفادي المخاطر الأمامية', 'Orion crater panorama': 'بانوراما فوهة أوريون', 'Camera 2': 'الكاميرا 2' };
for (const [en, ar] of Object.entries(PHOTO_WORDS)) DICT.set(en, ar);
const SUBJECTS = { 'the tool against the rock': 'الأداة على الصخرة', 'the shallow crater': 'الفوهة الضحلة', 'the exposed soil beside the lander': 'التربة المكشوفة بجانب المركبة' };
for (const [en, ar] of Object.entries(SUBJECTS)) DICT.set(en, ar);

// Learn every { en, ar } pair inside a content file, so its English text can be found again later.
export function registerPairs(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.en === 'string' && typeof value.ar === 'string' && value.en && value.ar) DICT.set(value.en, value.ar);
  for (const v of Object.values(value)) registerPairs(v);
}

const hasArabic = (s) => /[؀-ۿ]/.test(s);
const hasLatinWords = (s) => /[A-Za-z]{3,}/.test(s);

// Translate one English sentence from chapter code. Unknown sentences are shown as they are.
// Arabic text uses the same Western digits as the rest of the game (some content was written with ٠-٩).
const toLatinDigits = (x) => x.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
export function translate(value, inner = false) {
  const out = translateText(value, inner);
  return prefs.language === 'ar' ? toLatinDigits(out) : out;
}
function translateText(value, inner = false) {
  let s = String(value ?? '').trim();
  if (!s) return '';
  const ar = prefs.language === 'ar';
  // "English · عربي" written together: keep the chosen half.
  if (s.includes(' · ') && hasArabic(s) && hasLatinWords(s)) {
    const parts = s.split(' · ');
    const latin = parts.filter((p) => !hasArabic(p)).join(' · ');
    const arabic = parts.filter((p) => hasArabic(p)).join(' · ');
    if (!ar) return latin;
    const fromLatin = translate(latin);
    return fromLatin !== latin ? fromLatin : arabic;
  }
  if (!ar) return s;
  if (hasArabic(s) && !hasLatinWords(s)) return s;
  if (DICT.has(s)) return DICT.get(s);
  if (inner) return s.replace(/^Hold E: /, '');
  for (const [re, fn] of PATTERNS) if (re.test(s)) return s.replace(re, fn);
  // "Opportunity · front hazard camera": translate each part on its own.
  if (s.includes(' · ')) {
    const parts = s.split(' · ');
    const out = parts.map((p) => translate(p));
    if (out.some((p, i) => p !== parts[i])) return out.join(' · ');
  }
  return s;
}

// The action part of "Hold E: secure the samples" for the hold prompt, without the key words.
export function holdAction(text) {
  const s = String(text ?? '');
  const english = s.replace(/^Hold [A-Z][a-z]*:?\s*/, '').replace(/^Hold [A-Z] to /, '');
  if (prefs.language !== 'ar') return english.charAt(0).toUpperCase() + english.slice(1);
  return DICT.get(s) ?? translate(s, true);
}

// Numbers with units ("20 °C", "(1,014 mbar)", "3.73 m/s²") always read left to right, even inside Arabic.
const UNIT_RUN = /\(?[−+\-]?\d[\d.,×⁻¹²³⁴⁵ ]*\s?(?:°C|K|mbar|bar|m\/s²|km|m|%)?\)?/g;
export function isolateUnits(text) {
  const s = String(text ?? '');
  if (!/[؀-ۿ]/.test(s)) return s;
  return s.replace(UNIT_RUN, (run) => (/\d/.test(run) && /[^\d\s]/.test(run.trim()) ? `⁦${run.trim()}⁩${/\s$/.test(run) ? ' ' : ''}` : run));
}

export function t(id, vars) {
  const entry = UI[id];
  let s = entry ? entry[prefs.language] ?? entry.en : id;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

// Fills every [data-t] element under root with its text; used by the static HTML of the landing page and menus.
export function applyText(root = document) {
  for (const node of root.querySelectorAll('[data-t]')) node.textContent = t(node.dataset.t);
  for (const node of root.querySelectorAll('[data-t-label]')) node.setAttribute('aria-label', t(node.dataset.tLabel));
}
