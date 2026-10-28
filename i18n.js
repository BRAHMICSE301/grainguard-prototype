/* Anaj: English and Hindi text, and the small helper that applies it.
   Every key must exist in both languages (tests.js checks this).
   Hindi text should be reviewed by a native speaker before real use. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnajI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var S = { en: {}, hi: {} };

  function add(key, en, hi) { S.en[key] = en; S.hi[key] = hi; }

  /* ---------- Page chrome ---------- */
  add('page_title', 'Anaj | Grain storage guidance for farmers', 'अनाज | किसानों के लिए अनाज भंडारण की जानकारी');
  add('skip', 'Skip to content', 'सीधे मुख्य भाग पर जाएँ');
  add('brand', 'Anaj', 'अनाज');
  add('nav_today', 'Today', 'आज');
  add('nav_guide', 'Storage guide', 'भंडारण गाइड');
  add('nav_nearby', 'Nearby', 'आस-पास');
  add('nav_store', 'My store', 'मेरा भंडार');
  add('nav_monitor', 'Monitor', 'निगरानी');
  add('nav_judges', 'judges', 'जजों के लिए');
  add('lang_aria', 'Language', 'भाषा');

  /* ---------- Hero ---------- */
  add('hero_eyebrow', 'Grain storage guidance for Indian farmers', 'भारतीय किसानों के लिए अनाज भंडारण की जानकारी');
  add('hero_h1', 'Keep the harvest dry. Know when the weather turns against it.', 'फसल को सूखा रखें। जानें कब मौसम उसे नुकसान पहुँचा सकता है।');
  add('hero_lede',
    "Anaj shows grain stores near your village, tells you what today's weather means for stored grain, and keeps a simple record of what you have in store.",
    'यह साइट आपके गाँव के पास के अनाज गोदाम दिखाती है, बताती है कि आज का मौसम रखे हुए अनाज के लिए क्या मायने रखता है, और आपके भंडार का सरल हिसाब रखती है।');
  add('privacy',
    'Your location is requested only when you press the button. It is not tracked, and exact coordinates are not saved. Place names come from OpenStreetMap, and weather from Open-Meteo. Both receive your approximate coordinates to answer.',
    'आपकी लोकेशन तभी माँगी जाती है जब आप बटन दबाते हैं। आपको ट्रैक नहीं किया जाता और सटीक निर्देशांक सहेजे नहीं जाते। जगह का नाम OpenStreetMap से और मौसम Open-Meteo से आता है। जवाब देने के लिए दोनों को आपके लगभग निर्देशांक मिलते हैं।');
  add('art_caption', 'A wheat ear', 'गेहूँ की बाली');
  add('js_needed', 'Turn on JavaScript to use location features.', 'लोकेशन सुविधाओं के लिए JavaScript चालू करें।');

  /* ---------- Location panel ---------- */
  add('loc_find_title', 'Find storage facilities near you', 'अपने पास के भंडारण स्थान खोजें');
  add('loc_idle_help',
    'We ask for your location once, only to show nearby stores and local weather. You do not need to type anything.',
    'हम आपकी लोकेशन एक बार केवल पास के गोदाम और स्थानीय मौसम दिखाने के लिए माँगते हैं। आपको कुछ लिखने की ज़रूरत नहीं है।');
  add('btn_detect', 'Use My Current Location', 'मेरी मौजूदा लोकेशन इस्तेमाल करें');
  add('link_demo', 'Look at the demo location', 'डेमो लोकेशन देखें');
  add('link_manual', 'choose a place yourself', 'खुद जगह चुनें');
  add('or', ' or ', ' या ');
  add('loc_loading_title', 'Finding your location', 'आपकी लोकेशन खोजी जा रही है');
  add('loc_loading_help', 'Please allow location access when your browser asks.', 'जब ब्राउज़र पूछे तो लोकेशन की अनुमति दें।');
  add('loc_resolving_title', 'Location received', 'लोकेशन मिल गई');
  add('loc_resolving_help', 'Looking up the name of your area.', 'आपके इलाके का नाम खोजा जा रहा है।');
  add('loc_ready_title', 'Your location', 'आपकी लोकेशन');
  add('loc_sub_device', 'Location detected automatically', 'लोकेशन अपने-आप पता चल गई');
  add('loc_sub_device_noname',
    'Location detected. We could not look up the place name, but nearby search still works.',
    'लोकेशन मिल गई। जगह का नाम नहीं मिल सका, पर पास की खोज फिर भी काम करेगी।');
  add('loc_sub_manual', 'Location chosen by you', 'लोकेशन आपने चुनी है');
  add('loc_sub_demo',
    'This is a sample location for demonstration. It is not your actual location.',
    'यह केवल दिखाने के लिए नमूना लोकेशन है। यह आपकी असली लोकेशन नहीं है।');
  add('demo_prefix', 'Demo Location: ', 'डेमो लोकेशन: ');
  add('tag_demo', 'Demo', 'डेमो');
  add('link_refresh', 'Refresh location', 'लोकेशन फिर से लें');
  add('link_change', 'Change', 'बदलें');
  add('link_use_current', 'Use my current location', 'मेरी मौजूदा लोकेशन इस्तेमाल करें');
  add('pin_fmt', 'PIN {p}', 'पिन {p}');
  add('district_fmt', '{d} district', '{d} ज़िला');
  add('loc_denied_title', 'Location access is turned off', 'लोकेशन की अनुमति बंद है');
  add('loc_denied_help',
    'We need your location to show stores near you. Allow location for this site in your browser settings, then try again. The rest of the site works without it.',
    'आपके पास के गोदाम दिखाने के लिए हमें आपकी लोकेशन चाहिए। ब्राउज़र की सेटिंग में इस साइट के लिए लोकेशन की अनुमति दें और फिर कोशिश करें। साइट का बाकी हिस्सा इसके बिना भी चलता है।');
  add('btn_try_again', 'Try again', 'फिर कोशिश करें');
  add('optional_prefix', 'Optional: ', 'वैकल्पिक: ');
  add('loc_err_title', 'Location not available', 'लोकेशन उपलब्ध नहीं है');
  add('loc_err_default',
    'Your location could not be detected. You can try again or select your location manually.',
    'आपकी लोकेशन पता नहीं चल सकी। आप फिर कोशिश कर सकते हैं या खुद जगह चुन सकते हैं।');
  add('loc_err_insecure',
    'Location only works on a secure (HTTPS) page. Open the site through its https address and try again.',
    'लोकेशन केवल सुरक्षित (HTTPS) पेज पर काम करती है। साइट को https पते से खोलकर फिर कोशिश करें।');
  add('loc_err_unsupported',
    'This browser does not support location. You can select your location manually.',
    'यह ब्राउज़र लोकेशन का समर्थन नहीं करता। आप खुद जगह चुन सकते हैं।');
  add('btn_select_manual', 'Select manually', 'खुद चुनें');

  /* ---------- Dashboard ---------- */
  add('dash_eyebrow', 'Today', 'आज');
  add('greet_morning', 'Good morning, Farmer!', 'सुप्रभात, किसान साथी!');
  add('greet_afternoon', 'Good afternoon, Farmer!', 'नमस्कार, किसान साथी!');
  add('greet_evening', 'Good evening, Farmer!', 'शुभ संध्या, किसान साथी!');
  add('area_unset_static', 'Your area is not set.', 'आपका इलाका तय नहीं है।');
  add('area_unset',
    'Your area is not set. Use the location button above to see local information.',
    'आपका इलाका तय नहीं है। स्थानीय जानकारी के लिए ऊपर का लोकेशन बटन दबाएँ।');
  add('area_finding', 'Finding your area...', 'आपका इलाका खोजा जा रहा है...');
  add('area_yours', 'Your area: {a}', 'आपका इलाका: {a}');
  add('area_demo', 'Demo location: {a} (sample, not your actual location)', 'डेमो लोकेशन: {a} (नमूना, आपकी असली लोकेशन नहीं)');
  add('area_nameless', 'Location detected (place name unavailable)', 'लोकेशन मिल गई (जगह का नाम उपलब्ध नहीं)');

  /* ---------- Weather ---------- */
  add('wx_title', 'Weather today', 'आज का मौसम');
  add('wx_none', 'Set your location to see the weather for your area.', 'अपने इलाके का मौसम देखने के लिए लोकेशन तय करें।');
  add('wx_loading', 'Loading weather...', 'मौसम लोड हो रहा है...');
  add('wx_src_live', 'Live data from Open-Meteo', 'Open-Meteo से ताज़ा जानकारी');
  add('wx_src_live_demo', 'Live data from Open-Meteo, for the demo location', 'Open-Meteo से ताज़ा जानकारी, डेमो लोकेशन के लिए');
  add('wx_src_demo',
    'Demo weather. Sample values, not live. Live weather could not be loaded.',
    'डेमो मौसम। नमूना आँकड़े, ताज़ा नहीं। ताज़ा मौसम लोड नहीं हो सका।');
  add('wx_humidity', 'Humidity', 'नमी');
  add('wx_rain', 'Chance of rain', 'बारिश की संभावना');
  add('wx_wind', 'Wind', 'हवा');
  add('na', 'n/a', 'उपलब्ध नहीं');
  add('kmh', 'km/h', 'किमी/घंटा');
  add('wx_0', 'Clear sky', 'साफ़ आसमान');
  add('wx_1', 'Mostly clear', 'ज़्यादातर साफ़');
  add('wx_2', 'Partly cloudy', 'आंशिक बादल');
  add('wx_3', 'Overcast', 'बादल छाए हुए');
  add('wx_45', 'Fog', 'कोहरा');
  add('wx_48', 'Fog', 'कोहरा');
  add('wx_51', 'Light drizzle', 'हल्की फुहार');
  add('wx_53', 'Drizzle', 'फुहार');
  add('wx_55', 'Heavy drizzle', 'तेज़ फुहार');
  add('wx_61', 'Light rain', 'हल्की बारिश');
  add('wx_63', 'Rain', 'बारिश');
  add('wx_65', 'Heavy rain', 'तेज़ बारिश');
  add('wx_66', 'Freezing rain', 'जमने वाली बारिश');
  add('wx_67', 'Freezing rain', 'जमने वाली बारिश');
  add('wx_71', 'Light snow', 'हल्की बर्फ़बारी');
  add('wx_73', 'Snow', 'बर्फ़बारी');
  add('wx_75', 'Heavy snow', 'भारी बर्फ़बारी');
  add('wx_80', 'Rain showers', 'बारिश की बौछारें');
  add('wx_81', 'Rain showers', 'बारिश की बौछारें');
  add('wx_82', 'Heavy showers', 'तेज़ बौछारें');
  add('wx_95', 'Thunderstorm', 'गरज के साथ बारिश');
  add('wx_96', 'Thunderstorm with hail', 'ओलों के साथ आँधी-बारिश');
  add('wx_99', 'Thunderstorm with hail', 'ओलों के साथ आँधी-बारिश');
  add('wx_unknown', 'Conditions unavailable', 'मौसम की जानकारी उपलब्ध नहीं');

  /* ---------- Storage risk ---------- */
  add('risk_title', 'Storage risk', 'भंडारण का जोखिम');
  add('risk_none', 'Storage guidance appears here once weather for your area is available.', 'आपके इलाके का मौसम मिलते ही यहाँ भंडारण की सलाह दिखेगी।');
  add('risk_src_demo', 'Based on demo weather values', 'डेमो मौसम के आँकड़ों पर आधारित');
  add('risk_src_live', "Based on today's weather. General guidance only.", 'आज के मौसम पर आधारित। केवल सामान्य सलाह।');
  add('risk_low', 'Low risk', 'कम जोखिम');
  add('risk_medium', 'Medium risk', 'मध्यम जोखिम');
  add('risk_high', 'High risk', 'अधिक जोखिम');
  add('r_hum_high', 'Humidity is high ({n}%). Stored grain takes up moisture from damp air.', 'नमी अधिक है ({n}%)। रखा हुआ अनाज नम हवा से नमी खींच लेता है।');
  add('r_hum_mid', 'Humidity is moderate ({n}%). Keep an eye on damp patches.', 'नमी मध्यम है ({n}%)। सीलन वाली जगहों पर नज़र रखें।');
  add('r_rain_high', 'Rain is likely today ({n}% chance).', 'आज बारिश की संभावना अधिक है ({n}%)।');
  add('r_rain_mid', 'Some chance of rain today ({n}%).', 'आज बारिश की कुछ संभावना है ({n}%)।');
  add('r_hot', 'It is hot ({n} °C). Insects become more active in heat.', 'गर्मी ज़्यादा है ({n} °C)। गर्मी में कीड़े ज़्यादा सक्रिय हो जाते हैं।');
  add('r_none', 'No weather risk factors found in the current reading.', 'अभी के मौसम में जोखिम का कोई कारण नहीं मिला।');
  add('adv_low',
    'Conditions are favourable. Keep stores closed, dry and ventilated, and continue routine checks.',
    'हालात अच्छे हैं। गोदाम बंद, सूखा और हवादार रखें और नियमित जाँच करते रहें।');
  add('adv_medium',
    'Watch for dampness. Keep bags off the floor and away from walls, and check for damp patches or a musty smell.',
    'सीलन पर नज़र रखें। बोरियाँ फ़र्श और दीवार से दूर रखें, और नमी के धब्बे या सीलन की गंध देखें।');
  add('adv_high',
    'Damp conditions raise the risk of mould and insects. Keep grain covered and off the ground, avoid opening stores in rain, and check moisture before and after wet spells.',
    'नमी से फफूँद और कीड़ों का खतरा बढ़ता है। अनाज को ढककर और ज़मीन से ऊपर रखें, बारिश में गोदाम न खोलें, और बारिश के पहले व बाद में अनाज की नमी जाँचें।');

  /* ---------- Local support ---------- */
  add('sup_title', 'Local agricultural support', 'स्थानीय कृषि सहायता');
  add('sup_for_district', 'For {d} district', '{d} ज़िले के लिए');
  add('btn_find_kvk', 'Find your district KVK', 'अपने ज़िले का केवीके खोजें');
  add('sup_none',
    'Set your location to find support for your district. National services are listed below.',
    'अपने ज़िले की सहायता के लिए लोकेशन तय करें। राष्ट्रीय सेवाएँ नीचे दी गई हैं।');
  add('sup_enam_sfx', ' (national agriculture market)', ' (राष्ट्रीय कृषि बाज़ार)');
  add('sup_soil', 'Soil Health Card portal', 'मृदा स्वास्थ्य कार्ड पोर्टल');
  add('sup_kvk', 'Krishi Vigyan Kendra locator', 'कृषि विज्ञान केंद्र खोजें');
  add('sup_kcc', 'Kisan Call Centre: ', 'किसान कॉल सेंटर: ');
  add('sup_kcc_sfx', ' (toll free)', ' (निःशुल्क)');

  /* ---------- Storage guide ---------- */
  add('guide_eyebrow', 'Storage guide', 'भंडारण गाइड');
  add('guide_title', 'Six steps from field to store', 'खेत से गोदाम तक छह कदम');
  add('guide_note',
    'General good practice. Safe moisture levels differ by crop and region, so confirm the figure for your crop with your local Krishi Vigyan Kendra.',
    'यह सामान्य अच्छी पद्धति है। सुरक्षित नमी का स्तर फसल और इलाके के अनुसार अलग होता है, इसलिए अपनी फसल के लिए सही आँकड़ा अपने स्थानीय कृषि विज्ञान केंद्र से पूछ लें।');
  add('s1h', 'Dry the grain', 'अनाज सुखाएँ');
  add('s1p',
    'Dry well in the sun before storing. Wheat is commonly stored at about 12% moisture or less, paddy at about 14% or less.',
    'भंडारण से पहले अनाज को धूप में अच्छी तरह सुखाएँ। गेहूँ आमतौर पर लगभग 12% या उससे कम नमी पर और धान लगभग 14% या उससे कम नमी पर रखा जाता है।');
  add('s2h', 'Clean it', 'साफ़ करें');
  add('s2p',
    'Remove straw, dust, broken grain and weed seed. Cleaner grain keeps longer and attracts fewer insects.',
    'भूसा, धूल, टूटे दाने और खरपतवार के बीज निकाल दें। साफ़ अनाज ज़्यादा समय टिकता है और उसमें कीड़े कम लगते हैं।');
  add('s3h', 'Prepare the store', 'गोदाम तैयार करें');
  add('s3p',
    'Sweep the floor and walls, close cracks and repair leaks. Clean out old grain from earlier seasons.',
    'फ़र्श और दीवारें साफ़ करें, दरारें भरें और रिसाव ठीक करें। पिछले मौसम का पुराना अनाज निकाल दें।');
  add('s4h', 'Keep it off the ground', 'ज़मीन से ऊपर रखें');
  add('s4p',
    'Stack bags on wooden pallets or dry dunnage, away from walls, with space to walk around the stack.',
    'बोरियों को लकड़ी के पटरों या सूखी बिछावन पर, दीवार से दूर रखें, और ढेर के चारों ओर चलने की जगह छोड़ें।');
  add('s5h', 'Keep it dry and shut', 'सूखा और बंद रखें');
  add('s5p',
    'Keep doors and vents closed in humid or rainy weather. Open for air on dry days.',
    'नम या बारिश के मौसम में दरवाज़े और खिड़कियाँ बंद रखें। सूखे दिनों में हवा के लिए खोलें।');
  add('s6h', 'Check regularly', 'नियमित जाँच करें');
  add('s6p',
    'Look and smell for damp, mould, heating or insects. Act early, and ask your KVK about safe treatment.',
    'सीलन, फफूँद, गर्माहट या कीड़ों के लिए देखें और सूँघें। जल्दी कदम उठाएँ, और सुरक्षित उपचार के बारे में अपने केवीके से पूछें।');

  /* ---------- Nearby ---------- */
  add('nb_eyebrow', 'Nearby', 'आस-पास');
  add('nb_title', 'Places near you', 'आपके पास की जगहें');
  add('seg_aria', 'What to look for', 'क्या खोजना है');
  add('seg_storage', 'Grain storage', 'अनाज भंडारण');
  add('seg_support', 'Agricultural support', 'कृषि सहायता');
  add('within', 'Within', 'दूरी');
  add('km', 'km', 'किमी');
  add('map_aria', 'Map of nearby places', 'आस-पास की जगहों का नक्शा');
  add('nb_prompt', 'Set your location to see nearby places.', 'आस-पास की जगहें देखने के लिए अपनी लोकेशन तय करें।');
  add('nb_searching',
    'Searching OpenStreetMap. This can take up to 30 seconds. Or ',
    'OpenStreetMap में खोज जारी है। इसमें 30 सेकंड तक लग सकते हैं। या ');
  add('gmaps_link', 'Search on Google Maps', 'Google Maps पर खोजें');
  add('nb_trying', 'The main map servers did not answer. Trying another source. ', 'मुख्य नक्शा सर्वर जवाब नहीं दे रहे। दूसरा स्रोत आज़माया जा रहा है। ');
  add('nb_fail',
    'Nearby places could not be loaded right now. The free map data servers are sometimes busy. ',
    'आस-पास की जगहें अभी लोड नहीं हो सकीं। मुफ़्त नक्शा सर्वर कभी-कभी व्यस्त रहते हैं। ');
  add('nb_reason', ' Reason: {r}', ' कारण: {r}');
  add('re_unknown', 'unknown', 'अज्ञात');
  add('re_timeout', 'the server took too long', 'सर्वर ने बहुत देर लगाई');
  add('re_429', 'too many requests (HTTP 429)', 'बहुत ज़्यादा अनुरोध (HTTP 429)');
  add('re_5xx', 'the server is busy ({m})', 'सर्वर व्यस्त है ({m})');
  add('re_4xx', 'the server refused the request ({m})', 'सर्वर ने अनुरोध ठुकरा दिया ({m})');
  add('re_conn',
    'could not connect (a network, VPN or browser extension may be blocking it)',
    'कनेक्ट नहीं हो सका (नेटवर्क, VPN या ब्राउज़र एक्सटेंशन इसे रोक रहा हो सकता है)');
  add('nb_none',
    'No listings found within {r} km on OpenStreetMap. Coverage is incomplete in many rural areas, so this does not mean none exist. ',
    'OpenStreetMap पर {r} किमी के भीतर कोई सूची नहीं मिली। कई ग्रामीण इलाकों में जानकारी अधूरी है, इसलिए इसका मतलब यह नहीं कि कोई है ही नहीं। ');
  add('nb_found',
    '{n} places found within {r} km. Listings come from OpenStreetMap contributors and may be incomplete or out of date. ',
    '{r} किमी के भीतर {n} जगहें मिलीं। ये सूचियाँ OpenStreetMap के योगदानकर्ताओं से आती हैं और अधूरी या पुरानी हो सकती हैं। ');
  add('tip_you', 'Your location', 'आपकी लोकेशन');
  add('tip_demo', 'Demo location', 'डेमो लोकेशन');
  add('k_warehouse', 'Warehouse', 'गोदाम');
  add('k_silo', 'Silo', 'साइलो');
  add('k_shop', 'Agricultural supply shop', 'कृषि सामग्री की दुकान');
  add('k_market', 'Marketplace', 'बाज़ार');
  add('k_office', 'Agriculture office', 'कृषि कार्यालय');
  add('k_place', 'Place', 'जगह');
  add('unnamed', ' (unnamed on OpenStreetMap)', ' (OpenStreetMap पर नाम नहीं)');
  add('dist_fmt', '{d} km', '{d} किमी');

  /* ---------- Inventory ---------- */
  add('inv_eyebrow', 'My store', 'मेरा भंडार');
  add('inv_title', 'What is in your store', 'आपके भंडार में क्या है');
  add('inv_note', 'Saved only on this device. Nothing is sent anywhere.', 'केवल इसी डिवाइस पर सहेजा जाता है। कुछ भी कहीं भेजा नहीं जाता।');
  add('f_crop', 'Crop', 'फसल');
  add('crop_wheat', 'Wheat', 'गेहूँ');
  add('crop_paddy', 'Paddy', 'धान');
  add('crop_rice', 'Rice', 'चावल');
  add('crop_maize', 'Maize', 'मक्का');
  add('crop_bajra', 'Bajra', 'बाजरा');
  add('crop_pulses', 'Pulses', 'दालें');
  add('crop_other', 'Other', 'अन्य');
  add('f_qty', 'Quantity (quintal)', 'मात्रा (क्विंटल)');
  add('f_place', 'Where it is kept', 'कहाँ रखा है');
  add('f_place_ph', 'For example, home store room', 'जैसे, घर का भंडार कमरा');
  add('f_date', 'Date stored', 'भंडारण की तारीख');
  add('btn_add', 'Add to my store', 'मेरे भंडार में जोड़ें');
  add('inv_empty', 'Nothing added yet.', 'अभी कुछ नहीं जोड़ा गया।');
  add('th_crop', 'Crop', 'फसल');
  add('th_qty', 'Quintal', 'क्विंटल');
  add('th_place', 'Kept at', 'रखने की जगह');
  add('th_date', 'Stored on', 'तारीख');
  add('th_remove', 'Remove', 'हटाएँ');
  add('inv_qty_err', 'Enter a quantity greater than zero.', 'शून्य से अधिक मात्रा लिखें।');
  add('inv_total', 'Total in store: ', 'भंडार में कुल: ');
  add('inv_item', '{q} quintal {c}', '{q} क्विंटल {c}');
  add('remove_aria', 'Remove {c} entry', '{c} की प्रविष्टि हटाएँ');
  add('btn_remove', 'Remove', 'हटाएँ');

  /* ---------- Monitor ---------- */
  add('mon_eyebrow', 'Monitoring view', 'निगरानी दृश्य');
  add('mon_title', 'Store monitor', 'गोदाम की निगरानी');
  add('mon_what',
    "<strong>What is this?</strong> It shows the idea for a future feature. A farmer could place small sensors in a store. Each store's temperature, humidity and grain moisture would appear here, and the status would turn to <em>Watch</em> or <em>Act now</em> before the grain spoils.",
    '<strong>यह क्या है?</strong> यह एक भविष्य की सुविधा का विचार दिखाता है। किसान गोदाम में छोटे सेंसर लगा सकता है। हर गोदाम का तापमान, नमी और अनाज की नमी यहाँ दिखेगी, और अनाज खराब होने से पहले स्थिति <em>ध्यान दें</em> या <em>अभी कदम उठाएँ</em> हो जाएगी।');
  add('mon_sim',
    '<strong>These numbers are simulated.</strong> No sensors are connected. Press "Simulate next reading" to see how the status changes.',
    '<strong>ये आँकड़े नकली (सिम्युलेटेड) हैं।</strong> कोई सेंसर जुड़ा नहीं है। स्थिति कैसे बदलती है यह देखने के लिए "अगली रीडिंग दिखाएँ" दबाएँ।');
  add('th_store', 'Store', 'गोदाम');
  add('th_temp', 'Temp (°C)', 'तापमान (°C)');
  add('th_hum', 'Humidity (%)', 'नमी (%)');
  add('th_moist', 'Grain moisture (%)', 'अनाज की नमी (%)');
  add('th_status', 'Status', 'स्थिति');
  add('th_trend', 'Humidity, last 12', 'नमी, पिछली 12');
  add('btn_step', 'Simulate next reading', 'अगली रीडिंग दिखाएँ');
  add('btn_reset', 'Reset', 'रीसेट');
  add('st_ok', 'Safe', 'सुरक्षित');
  add('st_warn', 'Watch', 'ध्यान दें');
  add('st_danger', 'Act now', 'अभी कदम उठाएँ');
  add('store_n', 'Store {l}', 'गोदाम {l}');
  add('spark_aria', 'Humidity trend', 'नमी का रुझान');
  add('mon_limits',
    'Limits used (wheat, for demonstration): temperature watch at 30 °C and act at 35 °C; humidity watch at 70% and act at 80%; grain moisture watch at 12% and act at 14%. Status always shows a word as well as a colour.',
    'इस्तेमाल की गई सीमाएँ (गेहूँ, दिखाने के लिए): तापमान 30 °C पर ध्यान दें और 35 °C पर कदम उठाएँ; नमी 70% पर ध्यान दें और 80% पर कदम उठाएँ; अनाज की नमी 12% पर ध्यान दें और 14% पर कदम उठाएँ। स्थिति हमेशा रंग के साथ शब्द में भी दिखती है।');
  add('log_title', 'Technical log', 'तकनीकी लॉग');
  add('log_intro',
    'For judges. It shows, step by step, what the location feature is doing behind the scenes. Farmers do not need it. Entries are in English.',
    'यह जजों के लिए है। यह कदम-दर-कदम दिखाता है कि लोकेशन सुविधा पर्दे के पीछे क्या कर रही है। किसानों को इसकी ज़रूरत नहीं। प्रविष्टियाँ अंग्रेज़ी में हैं।');
  add('log_state', 'Location state:', 'लोकेशन की स्थिति:');
  add('log_aria', 'Location service log', 'लोकेशन सुविधा का लॉग');

  /* ---------- Footer and dialog ---------- */
  add('footer',
    'Anaj is a hackathon prototype. Weather is from Open-Meteo. Place names and nearby listings are from OpenStreetMap contributors and may be incomplete. Storage guidance is general and is not a substitute for advice from your local agriculture office.',
    'अनाज एक हैकथॉन प्रोटोटाइप है। मौसम की जानकारी Open-Meteo से है। जगह के नाम और आस-पास की सूचियाँ OpenStreetMap के योगदानकर्ताओं से हैं और अधूरी हो सकती हैं। भंडारण की सलाह सामान्य है और यह आपके स्थानीय कृषि कार्यालय की सलाह का विकल्प नहीं है।');
  add('dlg_title', 'Choose a place', 'जगह चुनें');
  add('dlg_help',
    'Type your village, town or district. This is optional. The location button is the easier way.',
    'अपने गाँव, कस्बे या ज़िले का नाम लिखें। यह वैकल्पिक है। लोकेशन बटन ज़्यादा आसान तरीका है।');
  add('f_place_name', 'Place name', 'जगह का नाम');
  add('btn_search', 'Search', 'खोजें');
  add('btn_close', 'Close', 'बंद करें');
  add('dlg_min', 'Type at least 3 letters.', 'कम से कम 3 अक्षर लिखें।');
  add('dlg_searching', 'Searching...', 'खोज रहे हैं...');
  add('dlg_nomatch', 'No match found. Try a nearby town or district name.', 'कोई मिलान नहीं मिला। पास के कस्बे या ज़िले का नाम आज़माएँ।');
  add('dlg_choose', 'Choose your place:', 'अपनी जगह चुनें:');
  add('dlg_fail', 'Search failed. Please try again.', 'खोज विफल रही। कृपया फिर कोशिश करें।');

  /* ---------- Helper ---------- */
  var lang = 'en';

  function fmt(s, params) {
    if (!params) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return params.hasOwnProperty(k) ? String(params[k]) : m; });
  }
  function tIn(l, key, params) {
    var s = (S[l] && S[l][key]);
    if (s == null) s = S.en[key];
    if (s == null) s = key;
    return fmt(s, params);
  }
  function t(key, params) { return tIn(lang, key, params); }
  function has(key) { return S.en.hasOwnProperty(key); }
  function setLang(l) { lang = (l === 'hi') ? 'hi' : 'en'; return lang; }
  function getLang() { return lang; }

  /* Choose the starting language: saved choice first, then the browser language. */
  function detect(saved, browserLang) {
    if (saved === 'hi' || saved === 'en') return saved;
    return /^hi\b/i.test(browserLang || '') ? 'hi' : 'en';
  }

  /* Apply the current language to every marked element in the page. Strings are our own constants. */
  function apply(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;
    var i, els;
    els = doc.querySelectorAll('[data-i18n]');
    for (i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-i18n'));
    els = doc.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < els.length; i++) els[i].innerHTML = t(els[i].getAttribute('data-i18n-html'));
    els = doc.querySelectorAll('[data-i18n-placeholder]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('placeholder', t(els[i].getAttribute('data-i18n-placeholder')));
    els = doc.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('aria-label', t(els[i].getAttribute('data-i18n-aria')));
    doc.title = t('page_title');
    if (doc.documentElement) doc.documentElement.lang = lang;
  }

  return { STRINGS: S, t: t, tIn: tIn, has: has, setLang: setLang, getLang: getLang, detect: detect, apply: apply };
});
