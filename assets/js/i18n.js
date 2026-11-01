var SUPPORTED_LANGS = ['he', 'en', 'ru', 'ar'];
var LANG_NAMES = { he: 'עברית', en: 'English', ru: 'Русский', ar: 'العربية' };

function detectLang() {
  var p = null;
  try {
    p = new URLSearchParams(window.location.search).get('lang');
  } catch (e) {
    p = null;
  }
  if (p && SUPPORTED_LANGS.indexOf(p) !== -1) {
    try {
      localStorage.setItem('radar_lang', p);
    } catch (e) {}
    return p;
  }
  try {
    var saved = localStorage.getItem('radar_lang');
    if (saved && SUPPORTED_LANGS.indexOf(saved) !== -1) {
      return saved;
    }
  } catch (e) {}
  return 'he';
}

var LANG = detectLang();
var IS_RTL = LANG === 'he' || LANG === 'ar';
document.documentElement.lang = LANG;
document.documentElement.dir = IS_RTL ? 'rtl' : 'ltr';

try {
  var langParam = new URLSearchParams(window.location.search).get('lang');
  if (langParam === 'he') {
    var bareUrl = new URL(window.location.href);
    bareUrl.searchParams.delete('lang');
    window.history.replaceState(null, '', bareUrl.toString());
  }
} catch (e) {}

var T = {
  he: {
    dir: 'rtl',
    siteTitle: 'רדאר 📡 - צבע אדום',
    noAlerts: 'אין התרעות פעילות',
    toHistory: 'להיסטוריה ←',
    backToAlerts: '← לחזרה להתרעות',
    historyTitle: 'התרעות מה-24 שעות האחרונות',
    historyLoading: 'טוען היסטוריה...',
    historyEmpty: 'אין היסטוריה להצגה.',
    historyError: 'שגיאה בטעינת היסטוריה',
    tabAlerts: 'התרעות',
    tabSettings: 'הגדרות ותנאים',
    settingsTargetLabel: 'איפה להתריע',
    settingsTargetSub: 'בחר מרחבים, יישובים, או גם וגם. אם לא בחרת כלום, תראה את כל ההתרעות בארץ.',
    settingsSoundGroupLabel: 'צלילים והקראה',
    settingsSoundGroupSub: 'כאן קובעים מה תשמע כשמגיעה התרעה למקום שבחרת.',
    settingsAreasLabel: 'בחירת מרחבים להתרעה',
    settingsAreasSub: 'סמן מרחב, ותקבל התרעות על כל היישובים שבו.',
    areaSearchPlaceholder: 'חיפוש מרחב...',
    clearSelection: 'נקה בחירה',
    noAreasFound: 'לא נמצאו מרחבים',
    settingsCitiesLabel: 'בחירת יישובים להתרעה',
    settingsCitiesSub: 'הוסף יישוב, ותקבל התרעות עליו גם בלי לסמן את המרחב שלו.',
    addCity: '+ הוסף יישוב',
    cityPlaceholder: 'שם יישוב...',
    soundLabel: '🔊 הפעלת סאונד',
    soundSub: 'כשמופעל, בכל התרעה למקום שבחרת יושמע הצליל שנבחר כאן, פעם אחת, עד 5 שניות.',
    notifLabel: '🔔 התרעות שולחן עבודה',
    notifSub: 'כשמופעל, בכל התרעה למקום שבחרת תופיע הודעת מערכת על המסך, גם כשהדפדפן פתוח ברקע. עובד רק במחשב.',
    readoutLabel: '🗣️ הקראה בעת אזעקה',
    readoutSub: 'כשמופעל, בכל התרעה למקום שבחרת יוקראו בקול שמות היישובים, אחד אחרי השני, בשפה של האתר.',
    platforms: 'הפלטפורמות שלנו',
    locLabel: 'מיקום',
    locSub: 'מאתר את המיקום שלך ומוסיף את העיר או המרחב שלך לבחירה. הבחירה מתווספת לבחירה הקיימת, לא מחליפה אותה.',
    locBtn: '📍 אתר את המיקום שלי',
    locDetecting: 'מאתר...',
    locDenied: 'הגישה למיקום נדחתה. אפשר לאשר גישה למיקום בדפדפן ולנסות שוב.',
    locError: 'לא הצלחתי לאתר את המיקום. נסה שוב.',
    locNearest: 'העיר הקרובה ביותר:',
    locCity: 'עיר',
    locArea: 'מרחב',
    locCityOnly: 'עיר בלבד',
    locAreaOnly: 'מרחב בלבד',
    locBoth: 'עיר + מרחב',
    locApplied: 'נוסף לבחירה.',
    areasSummaryAll: 'ללא הגבלה',
    searchPlaceholder: '🔍 חיפוש יישוב...',
    cities: 'יישובים',
    notFound: '❌ אירוע לא נמצא',
    loadError: '❌ שגיאה בטעינת נתונים',
    loading: 'טוען...',
    themeHint: 'מעבר בין מצב כהה ובהיר',
    tzofarName: 'צופר - צבע אדום',
    hfcName: 'פיקוד העורף',
    creditAreas: 'התאמת מרחבים ליישובים באדיבות',
    creditData: 'נתוני ההתרעות באדיבות',
    creditHebcal: 'התאריך העברי באתר מופעל באמצעות Hebcal.com (רישיון Creative Commons Attribution 4.0)',
    disclaimer: 'אתר זה אינו ערוץ רשמי של פיקוד העורף, ואין לראות בו אמצעי בטיחות בשעת חירום. המידע כאן הוא לידיעה בלבד, ואינו מחליף הנחיה רשמית של פיקוד העורף או של גורם מוסמך אחר.',
    legalTitle: 'משפטי',
    tabPrivacy: 'מדיניות הפרטיות',
    tabTerms: 'תנאי השימוש',
    tabCredits: 'קרדיטים',
    privacyPoints: [
      'האתר אינו אוסף מידע אישי ואינו דורש הרשמה.',
      'המיקום שלך (אם אישרת) משמש רק במכשיר שלך לאיתור העיר או המרחב, ואינו נשלח לשרתים שלנו.',
      'ההגדרות שלך (שפה, ערכת נושא, אזורים נבחרים) נשמרות רק בדפדפן שלך.',
      'איננו משתפים מידע כלשהו עם צדדים שלישיים.',
      'שירותים חיצוניים (Hebcal לתאריך עברי) פועלים לפי מדיניות הפרטיות שלהם.'
    ],
    termsPoints: [
      'האתר נועד לידיעה בלבד ואינו ערוץ רשמי של פיקוד העורף. אין לראות בו אמצעי בטיחות בשעת חירום. אין התחייבות שהאתר יהיה זמין בכל עת.',
      'אין להעתיק, לשכפל או להפיץ את תוכן האתר, עיצובו או הקוד שלו ללא אישור בכתב.',
      'הקלטות האודיו באתר (הקראת שמות היישובים) הן קניין האתר — אין להעתיק, להוריד או לעשות בהן שימוש כלשהו ללא אישור.',
      'בעלי האתר אינם אחראים לעיכובים, שגיאות או התרעות שלא התקבלו.',
      'השימוש באתר מהווה הסכמה לתנאים אלה.',
      'בעלי האתר רשאים לעדכן את תנאי השימוש בכל עת ללא הודעה מוקדמת.',
      'הדין החל על תנאים אלה הוא דין מדינת ישראל.'
    ],
    cat: {
      "1":  { emoji: '🚨', text: 'צבע אדום', instruction: 'היכנסו למרחב המוגן.' },
      "5":  { emoji: '🌊', text: 'חשש לצונאמי', instruction: 'יש להתרחק קילומטר אחד לפחות מהחוף.' },
      "6":  { emoji: '🛩', text: 'חדירת כלי טיס עוין', instruction: 'היכנסו למרחב המוגן.' },
      "13": { emoji: '🚪', text: 'חשש לחדירת מחבלים', instruction: 'היכנסו מיד למבנה, נעלו את הדלתות וסגרו את החלונות.' },
      "3":  { emoji: '🏚', text: 'רעידת אדמה', instruction: 'צאו מיד לשטח פתוח והתרחקו מפריטים שיכולים ליפול.' },
      "7":  { emoji: '⚠️', text: 'אירוע חומרים מסוכנים', instruction: 'יש להישאר בתוך מבנה, לסגור דלתות וחלונות ולכבות מזגנים.' }
    }
  },
  en: {
    dir: 'ltr',
    siteTitle: 'Radar 📡 - Red Alerts',
    noAlerts: 'No active alerts',
    toHistory: 'History →',
    backToAlerts: '← Back to Alerts',
    historyTitle: 'Alerts from the last 24 hours',
    historyLoading: 'Loading history...',
    historyEmpty: 'No history to display.',
    historyError: 'Error loading history',
    tabAlerts: 'Alerts',
    tabSettings: 'Settings & Terms',
    settingsTargetLabel: 'Where to alert',
    settingsTargetSub: 'Pick districts, localities, or both. If you pick nothing, you will see every alert in the country.',
    settingsSoundGroupLabel: 'Sounds and readout',
    settingsSoundGroupSub: 'Here you decide what you will hear when an alert arrives for a place you picked.',
    settingsAreasLabel: 'Select districts for alerts',
    settingsAreasSub: 'Tick a district to get alerts for all its localities.',
    areaSearchPlaceholder: 'Search district...',
    clearSelection: 'Clear selection',
    noAreasFound: 'No districts found',
    settingsCitiesLabel: 'Select localities for alerts',
    settingsCitiesSub: 'Add a locality to get alerts for it even without ticking its district.',
    addCity: '+ Add city',
    cityPlaceholder: 'City name...',
    soundLabel: '🔊 Enable Sound',
    soundSub: 'When on, every alert for a place you picked plays the sound chosen here, once, for up to 5 seconds.',
    notifLabel: '🔔 Desktop Notifications',
    notifSub: 'When on, every alert for a place you picked shows a system notification on screen, even when the browser is in the background. Works on desktop only.',
    readoutLabel: '🗣️ Read aloud on alert',
    readoutSub: 'When on, every alert for a place you picked reads the locality names aloud, one after another, in the site language.',
    platforms: 'Our Platforms',
    locLabel: 'Location',
    locSub: 'Locates you and adds your city or area to the selection. It adds to your current selection, it does not replace it.',
    locBtn: '📍 Locate me',
    locDetecting: 'Locating...',
    locDenied: 'Location access was denied. Allow location access in the browser and try again.',
    locError: 'Could not locate you. Try again.',
    locNearest: 'Nearest city:',
    locCity: 'City',
    locArea: 'Area',
    locCityOnly: 'City only',
    locAreaOnly: 'Area only',
    locBoth: 'City + area',
    locApplied: 'Added to your selection.',
    areasSummaryAll: 'No restriction',
    searchPlaceholder: '🔍 Search city...',
    cities: 'cities',
    notFound: '❌ Event not found',
    loadError: '❌ Error loading data',
    loading: 'Loading...',
    themeHint: 'Switch between dark and light mode',
    tzofarName: 'Tzofar - Red Alert',
    hfcName: 'Home Front Command',
    creditAreas: 'Matching districts to localities courtesy of',
    creditData: 'Alert data courtesy of',
    creditHebcal: 'The Hebrew date on this site is powered by Hebcal.com (Creative Commons Attribution 4.0 license)',
    disclaimer: 'This site is not an official Home Front Command channel, and it should not be treated as a safety measure in an emergency. The information here is for general knowledge only and does not replace official guidance from the Home Front Command or any other authorized source.',
    legalTitle: 'Legal',
    tabPrivacy: 'Privacy Policy',
    tabTerms: 'Terms of Use',
    tabCredits: 'Credits',
    privacyPoints: [
      'The site does not collect personal information and does not require registration.',
      'Your location (if you allow it) is used only on your device to find your city or area, and is never sent to our servers.',
      'Your settings (language, theme, selected areas) are stored only in your browser.',
      'We do not share any information with third parties.',
      'External services (Hebcal for the Hebrew date) operate under their own privacy policies.'
    ],
    termsPoints: [
      'This site is for informational purposes only and is not an official Home Front Command channel. It must not be treated as a safety measure in an emergency. There is no guarantee the site will always be available.',
      'Do not copy, reproduce, or distribute the site\u2019s content, design, or code without written permission.',
      'The site\u2019s audio recordings (locality name readouts) are the property of the site \u2014 do not copy, download, or use them in any way without permission.',
      'The site owners are not responsible for delays, errors, or missed alerts.',
      'Use of the site constitutes agreement to these terms.',
      'The site owners may update these terms at any time without prior notice.',
      'These terms are governed by the laws of the State of Israel.'
    ],
    cat: {
      "1":  { emoji: '🚨', text: 'Red Alert', instruction: 'Enter the protected space.' },
      "5":  { emoji: '🌊', text: 'Tsunami Warning', instruction: 'Move at least one kilometer from the coast.' },
      "6":  { emoji: '🛩', text: 'Intrusion of Hostile Aircraft', instruction: 'Enter the protected space.' },
      "13": { emoji: '🚪', text: 'Fear of Terrorist Infiltration', instruction: 'Enter the building immediately, lock doors and close windows.' },
      "3":  { emoji: '🏚', text: 'Earthquake', instruction: 'Immediately go to an open area away from falling objects.' },
      "7":  { emoji: '⚠️', text: 'Hazardous Materials Incident', instruction: 'Stay inside, close doors and windows, turn off the air conditioner.' }
    }
  },
  ru: {
    dir: 'ltr',
    siteTitle: 'Радар 📡 - Цева Адом',
    noAlerts: 'Нет активных оповещений',
    toHistory: 'История →',
    backToAlerts: '← Назад к оповещениям',
    historyTitle: 'Оповещения за последние 24 часа',
    historyLoading: 'Загрузка истории...',
    historyEmpty: 'История пуста.',
    historyError: 'Ошибка загрузки истории',
    tabAlerts: 'Оповещения',
    tabSettings: 'Настройки и условия',
    settingsTargetLabel: 'Где оповещать',
    settingsTargetSub: 'Выберите районы, населённые пункты или и то, и другое. Если ничего не выбрано, будут показаны все оповещения в стране.',
    settingsSoundGroupLabel: 'Звуки и озвучивание',
    settingsSoundGroupSub: 'Здесь решается, что вы услышите, когда придёт оповещение по выбранному месту.',
    settingsAreasLabel: 'Выбор районов для оповещений',
    settingsAreasSub: 'Отметьте район, чтобы получать оповещения по всем его населённым пунктам.',
    areaSearchPlaceholder: 'Поиск района...',
    clearSelection: 'Очистить выбор',
    noAreasFound: 'Районы не найдены',
    settingsCitiesLabel: 'Выбор населённых пунктов для оповещений',
    settingsCitiesSub: 'Добавьте населённый пункт, чтобы получать оповещения по нему, даже не отмечая его район.',
    addCity: '+ Добавить город',
    cityPlaceholder: 'Название города...',
    soundLabel: '🔊 Включить звук',
    soundSub: 'Когда включено, каждое оповещение по выбранному месту воспроизводит выбранный здесь звук один раз, до 5 секунд.',
    notifLabel: '🔔 Уведомления на рабочем столе',
    notifSub: 'Когда включено, каждое оповещение по выбранному месту показывает системное уведомление на экране, даже когда браузер в фоне. Работает только на компьютере.',
    readoutLabel: '🗣️ Озвучивание при оповещении',
    readoutSub: 'Когда включено, каждое оповещение по выбранному месту произносит вслух названия населённых пунктов, одно за другим, на языке сайта.',
    platforms: 'Наши платформы',
    locLabel: 'Местоположение',
    locSub: 'Определяет ваше местоположение и добавляет ваш город или регион к выбору. Добавляется к текущему выбору, а не заменяет его.',
    locBtn: '📍 Определить моё местоположение',
    locDetecting: 'Определение...',
    locDenied: 'Доступ к местоположению отклонён. Разрешите доступ в браузере и попробуйте снова.',
    locError: 'Не удалось определить местоположение. Попробуйте снова.',
    locNearest: 'Ближайший город:',
    locCity: 'Город',
    locArea: 'Регион',
    locCityOnly: 'Только город',
    locAreaOnly: 'Только регион',
    locBoth: 'Город + регион',
    locApplied: 'Добавлено к выбору.',
    areasSummaryAll: 'Без ограничений',
    searchPlaceholder: '🔍 Поиск города...',
    cities: 'городах',
    notFound: '❌ Событие не найдено',
    loadError: '❌ Ошибка загрузки данных',
    loading: 'Загрузка...',
    themeHint: 'Переключение между тёмным и светлым режимом',
    tzofarName: 'Цофар - Цева Адом',
    hfcName: 'Командование тыла',
    creditAreas: 'Сопоставление районов и населённых пунктов предоставлено',
    creditData: 'Данные оповещений предоставлены',
    creditHebcal: 'Еврейская дата на сайте предоставлена Hebcal.com (лицензия Creative Commons Attribution 4.0)',
    disclaimer: 'Этот сайт не является официальным каналом Командования тыла, и его нельзя считать средством безопасности в чрезвычайной ситуации. Информация здесь приводится только для сведения и не заменяет официальные указания Командования тыла или другого уполномоченного источника.',
    legalTitle: 'Правовая информация',
    tabPrivacy: 'Политика конфиденциальности',
    tabTerms: 'Условия использования',
    tabCredits: 'Благодарности',
    privacyPoints: [
      'Сайт не собирает личную информацию и не требует регистрации.',
      'Ваше местоположение (если вы разрешили) используется только на вашем устройстве для определения города или региона и никогда не отправляется на наши серверы.',
      'Ваши настройки (язык, тема, выбранные районы) хранятся только в вашем браузере.',
      'Мы не передаём никакую информацию третьим лицам.',
      'Внешние сервисы (Hebcal для еврейской даты) действуют в соответствии со своими политиками конфиденциальности.'
    ],
    termsPoints: [
      'Сайт предназначен только для информации и не является официальным каналом Командования тыла. Его нельзя считать средством безопасности в чрезвычайной ситуации. Нет гарантии, что сайт будет доступен всегда.',
      'Запрещается копировать, воспроизводить или распространять содержимое, дизайн или код сайта без письменного разрешения.',
      'Аудиозаписи сайта (озвучивание названий населённых пунктов) являются собственностью сайта — запрещается копировать, скачивать или использовать их каким-либо образом без разрешения.',
      'Владельцы сайта не несут ответственности за задержки, ошибки или пропущенные оповещения.',
      'Использование сайта означает согласие с настоящими условиями.',
      'Владельцы сайта вправе изменять настоящие условия в любое время без предварительного уведомления.',
      'Настоящие условия регулируются законодательством Государства Израиль.'
    ],
    cat: {
      "1":  { emoji: '🚨', text: 'Цева Адом', instruction: 'Войдите в укрытие.' },
      "5":  { emoji: '🌊', text: 'Предупреждение о цунами', instruction: 'Отойдите не менее чем на один километр от берега.' },
      "6":  { emoji: '🛩', text: 'Проникновение летательного аппарата', instruction: 'Войдите в укрытие.' },
      "13": { emoji: '🚪', text: 'Подозрение на проникновение террористов', instruction: 'Войдите в здание, закройте двери и окна.' },
      "3":  { emoji: '🏚', text: 'Землетрясение', instruction: 'Немедленно перейдите в открытое пространство.' },
      "7":  { emoji: '⚠️', text: 'Авария с опасными материалами', instruction: 'Оставайтесь в помещении, закройте двери и окна, выключите кондиционер.' }
    }
  },
  ar: {
    dir: 'rtl',
    siteTitle: 'رادار 📡 - انذار احمر',
    noAlerts: 'لا توجد تنبيهات نشطة',
    toHistory: 'السجل ←',
    backToAlerts: '← العودة إلى التنبيهات',
    historyTitle: 'تنبيهات آخر 24 ساعة',
    historyLoading: 'جارٍ تحميل السجل...',
    historyEmpty: 'لا يوجد سجل للعرض.',
    historyError: 'خطأ في تحميل السجل',
    tabAlerts: 'التنبيهات',
    tabSettings: 'الإعدادات والشروط',
    settingsTargetLabel: 'أين يتم التنبيه',
    settingsTargetSub: 'اختر مناطق أو بلدات أو كليهما. إذا لم تختر شيئاً، ستظهر جميع التنبيهات في البلاد.',
    settingsSoundGroupLabel: 'الأصوات والقراءة',
    settingsSoundGroupSub: 'هنا تقرر ما ستسمعه عندما يصل تنبيه لمكان اخترته.',
    settingsAreasLabel: 'اختر المناطق للتنبيه',
    settingsAreasSub: 'حدّد منطقة لتلقي التنبيهات عن جميع بلداتها.',
    areaSearchPlaceholder: 'ابحث عن منطقة...',
    clearSelection: 'مسح التحديد',
    noAreasFound: 'لم يتم العثور على مناطق',
    settingsCitiesLabel: 'اختر البلدات للتنبيه',
    settingsCitiesSub: 'أضف بلدة لتلقي التنبيهات عنها حتى دون تحديد منطقتها.',
    addCity: '+ أضف مدينة',
    cityPlaceholder: 'اسم المدينة...',
    soundLabel: '🔊 تفعيل الصوت',
    soundSub: 'عند التفعيل، كل تنبيه لمكان اخترته يشغّل الصوت المختار هنا مرة واحدة، حتى 5 ثوانٍ.',
    notifLabel: '🔔 إشعارات سطح المكتب',
    notifSub: 'عند التفعيل، كل تنبيه لمكان اخترته يُظهر إشعار نظام على الشاشة، حتى عندما يكون المتصفح في الخلفية. يعمل على الحاسوب فقط.',
    readoutLabel: '🗣️ القراءة بصوت عالٍ عند التنبيه',
    readoutSub: 'عند التفعيل، كل تنبيه لمكان اخترته يقرأ أسماء البلدات بصوت عالٍ، واحداً تلو الآخر، بلغة الموقع.',
    platforms: 'منصاتنا',
    locLabel: 'الموقع',
    locSub: 'يحدد موقعك ويضيف مدينتك أو منطقتك إلى الاختيار. يُضاف إلى اختيارك الحالي ولا يستبدله.',
    locBtn: '📍 حدد موقعي',
    locDetecting: 'جارٍ التحديد...',
    locDenied: 'تم رفض الوصول إلى الموقع. اسمح بالوصول إلى الموقع في المتصفح وحاول مجدداً.',
    locError: 'تعذر تحديد موقعك. حاول مجدداً.',
    locNearest: 'أقرب مدينة:',
    locCity: 'مدينة',
    locArea: 'منطقة',
    locCityOnly: 'مدينة فقط',
    locAreaOnly: 'منطقة فقط',
    locBoth: 'مدينة + منطقة',
    locApplied: 'أُضيف إلى اختيارك.',
    areasSummaryAll: 'بدون قيود',
    searchPlaceholder: '🔍 ابحث عن مدينة...',
    cities: 'المدن',
    notFound: '❌ الحدث غير موجود',
    loadError: '❌ خطأ في تحميل البيانات',
    loading: 'جارٍ التحميل...',
    themeHint: 'التبديل بين الوضع الداكن والفاتح',
    tzofarName: 'تسوفر - اللون الأحمر',
    hfcName: 'قيادة الجبهة الداخلية',
    creditAreas: 'مطابقة المناطق للبلدات مقدمة من',
    creditData: 'بيانات التنبيهات مقدمة من',
    creditHebcal: 'التاريخ العبري في الموقع مقدم من Hebcal.com (رخصة المشاع الإبداعي نسب المصنف 4.0)',
    disclaimer: 'هذا الموقع ليس قناة رسمية لقيادة الجبهة الداخلية، ولا ينبغي اعتباره وسيلة أمان في حالات الطوارئ. المعلومات هنا للاطلاع العام فقط ولا تحل محل التوجيهات الرسمية من قيادة الجبهة الداخلية أو أي مصدر مخوّل آخر.',
    legalTitle: 'قانوني',
    tabPrivacy: 'سياسة الخصوصية',
    tabTerms: 'شروط الاستخدام',
    tabCredits: 'اعتمادات',
    privacyPoints: [
      'لا يجمع الموقع معلومات شخصية ولا يتطلب التسجيل.',
      'موقعك (إذا سمحت بذلك) يُستخدم فقط على جهازك لتحديد مدينتك أو منطقتك، ولا يُرسل أبداً إلى خوادمنا.',
      'إعداداتك (اللغة، السمة، المناطق المختارة) تُحفظ في متصفحك فقط.',
      'لا نشارك أي معلومات مع أطراف ثالثة.',
      'الخدمات الخارجية (Hebcal للتاريخ العبري) تعمل وفق سياسات الخصوصية الخاصة بها.'
    ],
    termsPoints: [
      'هذا الموقع للاطلاع فقط وليس قناة رسمية لقيادة الجبهة الداخلية. لا يجوز اعتباره وسيلة أمان في حالات الطوارئ. لا يوجد ضمان بأن الموقع سيكون متاحاً في جميع الأوقات.',
      'يُمنع نسخ محتوى الموقع أو تصميمه أو رمزه البرمجي أو إعادة إنتاجه أو توزيعه دون إذن كتابي.',
      'التسجيلات الصوتية في الموقع (قراءة أسماء البلدات) هي ملك للموقع — يُمنع نسخها أو تنزيلها أو استخدامها بأي شكل دون إذن.',
      'مالكو الموقع غير مسؤولين عن التأخير أو الأخطاء أو التنبيهات الفائتة.',
      'استخدام الموقع يُعد موافقة على هذه الشروط.',
      'يحق لمالكي الموقع تحديث هذه الشروط في أي وقت دون إشعار مسبق.',
      'تخضع هذه الشروط لقوانين دولة إسرائيل.'
    ],
    cat: {
      "1":  { emoji: '🚨', text: 'اللون الأحمر', instruction: 'ادخل إلى المكان المحمي.' },
      "5":  { emoji: '🌊', text: 'خطر تسونامي', instruction: 'ابتعد كيلومتراً عن الشاطئ على الأقل.' },
      "6":  { emoji: '🛩', text: 'تسلل طائرة عدائية', instruction: 'ادخل إلى المكان المحمي.' },
      "13": { emoji: '🚪', text: 'تسلل مخربين', instruction: 'ادخل المبنى فوراً وأغلق الأبواب والنوافذ.' },
      "3":  { emoji: '🏚', text: 'هزة أرضية', instruction: 'توجه فوراً إلى منطقة مفتوحة.' },
      "7":  { emoji: '⚠️', text: 'حادث مواد خطرة', instruction: 'ابق في الداخل وأغلق الأبواب والنوافذ وأوقف المكيف.' }
    }
  }
};

var t = T[LANG];

var CAT10_TITLE_I18N = {
  en: {
    'התרעה מקדימה - רדאר 📡': 'Early Warning - Radar 📡',
    'הנחיה - רדאר 📡': 'Directive - Radar 📡',
    'סיום אירוע - רדאר 📡': 'Incident Ended - Radar 📡',
    'מבזק פיקוד העורף - רדאר 📡': 'Home Front Command Alert - Radar 📡',
    'התרעה מקדימה מלבנון - רדאר 📡': 'Early Warning from Lebanon - Radar 📡',
    'התרעה - רדאר 📡': 'Alert - Radar 📡',
    'חדירת מחבלים | האירוע הסתיים - רדאר 📡': 'Terrorist Infiltration | Incident Ended - Radar 📡'
  },
  ru: {
    'התרעה מקדימה - רדאר 📡': 'Предварительное оповещение - Радар 📡',
    'הנחיה - רדאר 📡': 'Инструкция - Радар 📡',
    'סיום אירוע - רדאר 📡': 'Инцидент завершён - Радар 📡',
    'מבזק פיקוד העורף - רדאר 📡': 'Оповещение Командования тыла - Радар 📡',
    'התרעה מקדימה מלבנון - רדאר 📡': 'Предварительное оповещение из Ливана - Радар 📡',
    'התרעה - רדאר 📡': 'Оповещение - Радар 📡',
    'חדירת מחבלים | האירוע הסתיים - רדאר 📡': 'Проникновение террористов | Инцидент завершён - Радар 📡'
  },
  ar: {
    'התרעה מקדימה - רדאר 📡': 'إنذار مبكر - رادار 📡',
    'הנחיה - רדאר 📡': 'تعليمات - رادار 📡',
    'סיום אירוע - רדאר 📡': 'انتهاء الحادثة - رادار 📡',
    'מבזק פיקוד העורף - רדאר 📡': 'تنبيه قيادة الجبهة الداخلية - رادار 📡',
    'התרעה מקדימה מלבנון - רדאר 📡': 'إنذار مبكر من لبنان - رادار 📡',
    'התרעה - רדאר 📡': 'تنبيه - رادار 📡',
    'חדירת מחבלים | האירוע הסתיים - רדאר 📡': 'تسلل مخربين | انتهاء الحادثة - رادار 📡'
  }
};

function getCat10Title(data) {
  var hebrewTitle = data.title || '';
  if (LANG === 'he') {
    return hebrewTitle;
  }
  var langMap = CAT10_TITLE_I18N[LANG];
  if (langMap && langMap[hebrewTitle]) {
    return langMap[hebrewTitle];
  }
  return hebrewTitle;
}

function getLangUrl(lang) {
  var u = new URL(window.location.href);
  if (lang === 'he') {
    u.searchParams.delete('lang');
  } else {
    u.searchParams.set('lang', lang);
  }
  return u.toString();
}

function creditsHTML() {
  var tzofarLink = '<a href="https://www.tzevaadom.co.il/" target="_blank" rel="noopener">' + t.tzofarName + '</a>';
  var hfcLink = '<a href="https://www.oref.org.il/" target="_blank" rel="noopener">' + t.hfcName + '</a>';
  var hebcalLink = '<a href="https://www.hebcal.com/?utm_source=radar-alerts&utm_medium=referral" target="_blank" rel="noopener">Hebcal.com</a>';
  var hebcalLine = t.creditHebcal.replace('Hebcal.com', hebcalLink);
  return '<div class="credits-line">' + t.creditAreas + ' ' + tzofarLink + '</div>' +
    '<div class="credits-line">' + t.creditData + ' ' + hfcLink + '</div>' +
    (LANG === 'he' ? '<div class="credits-line">' + hebcalLine + '</div>' : '');
}

function legalPointsHTML(points) {
  return '<ol class="legal-list">' + points.map(function(p) {
    return '<li>' + p.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>';
  }).join('') + '</ol>';
}

function legalHTML() {
  return '<div class="legal-tabs">' +
    '<button type="button" class="legal-tab-btn active" data-legal="privacy">' + t.tabPrivacy + '</button>' +
    '<button type="button" class="legal-tab-btn" data-legal="terms">' + t.tabTerms + '</button>' +
    '<button type="button" class="legal-tab-btn" data-legal="credits">' + t.tabCredits + '</button>' +
    '</div>' +
    '<div class="legal-pane active" id="legal-privacy">' + legalPointsHTML(t.privacyPoints) + '</div>' +
    '<div class="legal-pane" id="legal-terms">' + legalPointsHTML(t.termsPoints) + '</div>' +
    '<div class="legal-pane" id="legal-credits">' + creditsHTML() + '</div>';
}

function initLegalTabs() {
  var btns = document.querySelectorAll('.legal-tab-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function() {
      for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
      }
      this.classList.add('active');
      var panes = document.querySelectorAll('.legal-pane');
      for (var k = 0; k < panes.length; k++) {
        panes[k].classList.remove('active');
      }
      var target = document.getElementById('legal-' + this.getAttribute('data-legal'));
      if (target) {
        target.classList.add('active');
      }
    });
  }
}
