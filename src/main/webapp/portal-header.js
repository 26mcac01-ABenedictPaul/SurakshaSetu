/* Citizen page header: language preference, profile menu and "My profile" drawer.
   Also publishes window.SS (language + labels) which Suraksha AI uses.
   Loaded after sections.js / concern-community.js. Uses the page's api(), post(), banner(), esc(). */
(function () {
  const $ = id => document.getElementById(id);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* [code, native name, speech locale] */
  const LANGS = [['en', 'English', 'en-IN'], ['hi', 'हिन्दी', 'hi-IN'], ['kn', 'ಕನ್ನಡ', 'kn-IN'], ['ta', 'தமிழ்', 'ta-IN'],
    ['te', 'తెలుగు', 'te-IN'], ['ml', 'മലയാളം', 'ml-IN'], ['bn', 'বাংলা', 'bn-IN'], ['mr', 'मराठी', 'mr-IN']];

  const KEYS = ['home', 'file', 'efir', 'appt', 'chat', 'civic', 'concern', 'community', 'map', 'cases', 'law', 'road', 'women', 'rag'];
  const NAV = {
    en: ['Home', 'File a case', 'e-FIR', 'Appointments', 'Chat with police', 'Civic issues', 'Report a concern', 'Community', 'Police near me', 'My cases', 'Know Your Law', 'Road Safety', 'Women’s Safety', 'Anti-Ragging'],
    hi: ['होम', 'मामला दर्ज करें', 'e-FIR', 'अपॉइंटमेंट', 'पुलिस से चैट', 'नागरिक समस्याएँ', 'घटना की सूचना दें', 'समुदाय', 'पास का थाना', 'मेरे मामले', 'अपने कानून जानें', 'सड़क सुरक्षा', 'महिला सुरक्षा', 'रैगिंग विरोधी'],
    kn: ['ಮುಖಪುಟ', 'ದೂರು ದಾಖಲಿಸಿ', 'e-FIR', 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', 'ಪೊಲೀಸರೊಂದಿಗೆ ಚಾಟ್', 'ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು', 'ಘಟನೆ ವರದಿ ಮಾಡಿ', 'ಸಮುದಾಯ', 'ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆ', 'ನನ್ನ ಪ್ರಕರಣಗಳು', 'ನಿಮ್ಮ ಕಾನೂನು ತಿಳಿಯಿರಿ', 'ರಸ್ತೆ ಸುರಕ್ಷತೆ', 'ಮಹಿಳಾ ಸುರಕ್ಷತೆ', 'ರ‍್ಯಾಗಿಂಗ್ ವಿರೋಧಿ'],
    ta: ['முகப்பு', 'புகார் அளிக்க', 'e-FIR', 'சந்திப்புகள்', 'காவல்துறையுடன் அரட்டை', 'குடிமைப் பிரச்சினைகள்', 'சம்பவத்தைத் தெரிவிக்க', 'சமூகம்', 'அருகிலுள்ள காவல் நிலையம்', 'என் வழக்குகள்', 'உங்கள் சட்டத்தை அறிக', 'சாலை பாதுகாப்பு', 'பெண்கள் பாதுகாப்பு', 'ராகிங் எதிர்ப்பு'],
    te: ['హోమ్', 'ఫిర్యాదు చేయండి', 'e-FIR', 'అపాయింట్‌మెంట్లు', 'పోలీసులతో చాట్', 'పౌర సమస్యలు', 'సంఘటన తెలియజేయండి', 'సమాజం', 'దగ్గరలోని పోలీస్ స్టేషన్', 'నా కేసులు', 'మీ చట్టం తెలుసుకోండి', 'రహదారి భద్రత', 'మహిళా భద్రత', 'ర్యాగింగ్ వ్యతిరేక'],
    ml: ['ഹോം', 'പരാതി നൽകുക', 'e-FIR', 'അപ്പോയിന്റ്മെന്റുകൾ', 'പോലീസുമായി ചാറ്റ്', 'പൗര പ്രശ്നങ്ങൾ', 'സംഭവം അറിയിക്കുക', 'സമൂഹം', 'അടുത്തുള്ള പോലീസ് സ്റ്റേഷൻ', 'എന്റെ കേസുകൾ', 'നിയമം അറിയുക', 'റോഡ് സുരക്ഷ', 'വനിതാ സുരക്ഷ', 'റാഗിംഗ് വിരുദ്ധം'],
    bn: ['হোম', 'অভিযোগ করুন', 'e-FIR', 'অ্যাপয়েন্টমেন্ট', 'পুলিশের সাথে চ্যাট', 'নাগরিক সমস্যা', 'ঘটনা জানান', 'সম্প্রদায়', 'কাছের থানা', 'আমার মামলা', 'আইন জানুন', 'সড়ক নিরাপত্তা', 'নারী নিরাপত্তা', 'র‍্যাগিং বিরোধী'],
    mr: ['मुख्यपृष्ठ', 'तक्रार दाखल करा', 'e-FIR', 'भेटीची वेळ', 'पोलिसांशी चॅट', 'नागरी समस्या', 'घटना कळवा', 'समुदाय', 'जवळचे पोलीस ठाणे', 'माझी प्रकरणे', 'कायदा जाणून घ्या', 'रस्ता सुरक्षा', 'महिला सुरक्षा', 'रॅगिंगविरोधी']
  };

  /* Anything missing in a language falls back to English. */
  const UI = {
    en: { profile: 'My profile', logout: 'Log out', ph: 'Type your message…', send: 'Send', listening: 'Listening…', thinking: 'Thinking…', open: 'Review & file this case',
      tagline: 'Your friendly safety assistant', talkOn: 'Voice replies', smart: 'AI mode', basic: 'Basic mode',
      disc: 'Suraksha AI gives general information, not legal advice. In an emergency call 112.',
      noMic: 'Voice input is not supported in this browser. Please use Chrome or Edge.',
      noVoice: 'No voice for this language is installed on this device, so replies will be text only.',
      hello: 'Hi {name}! I’m Suraksha AI. Ask me about your rights, laws, the Constitution or the latest police news, or tell me what happened and I’ll help you file a case. You can type, or tap the mic and speak.',
      chips: ['Latest police news', 'My rights if arrested', 'Explain Article 21', 'Help me file a case'] },
    hi: { profile: 'मेरी प्रोफ़ाइल', logout: 'लॉग आउट', ph: 'अपना संदेश लिखें…', send: 'भेजें', listening: 'सुन रहा हूँ…', thinking: 'सोच रहा हूँ…', open: 'जाँचें और यह मामला दर्ज करें',
      tagline: 'आपका दोस्ताना सुरक्षा सहायक', disc: 'सुरक्षा AI सामान्य जानकारी देता है, कानूनी सलाह नहीं। आपात स्थिति में 112 पर कॉल करें।',
      hello: 'नमस्ते {name}! मैं सुरक्षा AI हूँ। कानून, संविधान या ताज़ा पुलिस ख़बरों के बारे में पूछें, या बताइए क्या हुआ, मैं शिकायत दर्ज करने में मदद करूँगा। आप टाइप कर सकते हैं या माइक दबाकर बोल सकते हैं।',
      chips: ['ताज़ा पुलिस ख़बरें', 'गिरफ़्तारी में मेरे अधिकार', 'अनुच्छेद 21 समझाएँ', 'मामला दर्ज करने में मदद करें'] },
    kn: { profile: 'ನನ್ನ ಪ್ರೊಫೈಲ್', logout: 'ಲಾಗ್ ಔಟ್', ph: 'ನಿಮ್ಮ ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ…', send: 'ಕಳುಹಿಸಿ', listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ…', thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…', open: 'ಪರಿಶೀಲಿಸಿ ಈ ದೂರು ದಾಖಲಿಸಿ',
      tagline: 'ನಿಮ್ಮ ಸ್ನೇಹಪರ ಸುರಕ್ಷತಾ ಸಹಾಯಕ', disc: 'ಸುರಕ್ಷಾ AI ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ನೀಡುತ್ತದೆ, ಕಾನೂನು ಸಲಹೆಯಲ್ಲ. ತುರ್ತು ಸ್ಥಿತಿಯಲ್ಲಿ 112 ಗೆ ಕರೆ ಮಾಡಿ.',
      hello: 'ನಮಸ್ಕಾರ {name}! ನಾನು ಸುರಕ್ಷಾ AI. ಕಾನೂನು, ಸಂವಿಧಾನ ಅಥವಾ ಇತ್ತೀಚಿನ ಪೊಲೀಸ್ ಸುದ್ದಿಗಳ ಬಗ್ಗೆ ಕೇಳಿ, ಅಥವಾ ಏನಾಯಿತು ಎಂದು ಹೇಳಿ, ದೂರು ದಾಖಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ.',
      chips: ['ಇತ್ತೀಚಿನ ಪೊಲೀಸ್ ಸುದ್ದಿ', 'ಬಂಧನದಲ್ಲಿ ನನ್ನ ಹಕ್ಕುಗಳು', 'ವಿಧಿ 21 ವಿವರಿಸಿ', 'ದೂರು ದಾಖಲಿಸಲು ಸಹಾಯ ಮಾಡಿ'] },
    ta: { profile: 'என் சுயவிவரம்', logout: 'வெளியேறு', ph: 'உங்கள் செய்தியை எழுதுங்கள்…', send: 'அனுப்பு', listening: 'கேட்கிறேன்…', thinking: 'யோசிக்கிறேன்…', open: 'சரிபார்த்து இந்தப் புகாரை அளிக்கவும்',
      tagline: 'உங்கள் நட்பான பாதுகாப்பு உதவியாளர்', disc: 'சுரக்ஷா AI பொதுவான தகவல்களை மட்டும் தரும், சட்ட ஆலோசனை அல்ல. அவசரத்தில் 112 ஐ அழைக்கவும்.',
      hello: 'வணக்கம் {name}! நான் சுரக்ஷா AI. சட்டம், அரசியலமைப்பு, சமீபத்திய காவல்துறை செய்திகள் பற்றி கேளுங்கள், அல்லது என்ன நடந்தது என்று சொல்லுங்கள், புகார் அளிக்க உதவுவேன். தட்டச்சு செய்யலாம் அல்லது மைக்கை அழுத்திப் பேசலாம்.',
      chips: ['சமீபத்திய காவல்துறை செய்திகள்', 'கைதானால் என் உரிமைகள்', 'பிரிவு 21 விளக்குங்கள்', 'புகார் அளிக்க உதவுங்கள்'] },
    te: { profile: 'నా ప్రొఫైల్', logout: 'లాగ్ అవుట్', ph: 'మీ సందేశం టైప్ చేయండి…', send: 'పంపండి', listening: 'వింటున్నాను…', thinking: 'ఆలోచిస్తున్నాను…', open: 'సమీక్షించి ఈ ఫిర్యాదు చేయండి',
      tagline: 'మీ స్నేహపూర్వక భద్రతా సహాయకుడు', disc: 'సురక్ష AI సాధారణ సమాచారం మాత్రమే ఇస్తుంది, న్యాయ సలహా కాదు. అత్యవసరంలో 112కు కాల్ చేయండి.',
      hello: 'నమస్కారం {name}! నేను సురక్ష AI. చట్టాలు, రాజ్యాంగం, తాజా పోలీసు వార్తల గురించి అడగండి, లేదా ఏం జరిగిందో చెప్పండి, ఫిర్యాదు చేయడంలో సహాయం చేస్తాను. టైప్ చేయండి లేదా మైక్ నొక్కి మాట్లాడండి.',
      chips: ['తాజా పోలీసు వార్తలు', 'అరెస్టు అయితే నా హక్కులు', 'ఆర్టికల్ 21 వివరించండి', 'ఫిర్యాదు చేయడంలో సహాయం చేయండి'] },
    ml: { profile: 'എന്റെ പ്രൊഫൈൽ', logout: 'ലോഗ് ഔട്ട്', ph: 'നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യൂ…', send: 'അയയ്ക്കുക', listening: 'കേൾക്കുന്നു…', thinking: 'ആലോചിക്കുന്നു…', open: 'പരിശോധിച്ച് ഈ പരാതി നൽകുക',
      tagline: 'നിങ്ങളുടെ സൗഹൃദ സുരക്ഷാ സഹായി', disc: 'സുരക്ഷ AI പൊതുവായ വിവരങ്ങളാണ് നൽകുന്നത്, നിയമോപദേശമല്ല. അടിയന്തര സാഹചര്യത്തിൽ 112 വിളിക്കുക.',
      hello: 'നമസ്കാരം {name}! ഞാൻ സുരക്ഷ AI. നിയമം, ഭരണഘടന, പുതിയ പോലീസ് വാർത്തകൾ എന്നിവ ചോദിക്കൂ, അല്ലെങ്കിൽ എന്താണ് സംഭവിച്ചതെന്ന് പറയൂ, പരാതി നൽകാൻ ഞാൻ സഹായിക്കാം. ടൈപ്പ് ചെയ്യാം, അല്ലെങ്കിൽ മൈക്ക് അമർത്തി സംസാരിക്കാം.',
      chips: ['പുതിയ പോലീസ് വാർത്തകൾ', 'അറസ്റ്റിലായാൽ എന്റെ അവകാശങ്ങൾ', 'അനുച്ഛേദം 21 വിശദീകരിക്കൂ', 'പരാതി നൽകാൻ സഹായിക്കൂ'] },
    bn: { profile: 'আমার প্রোফাইল', logout: 'লগ আউট', ph: 'আপনার বার্তা লিখুন…', send: 'পাঠান', listening: 'শুনছি…', thinking: 'ভাবছি…', open: 'দেখে নিয়ে এই অভিযোগ করুন',
      tagline: 'আপনার বন্ধুসুলভ সুরক্ষা সহায়ক', disc: 'সুরক্ষা AI সাধারণ তথ্য দেয়, আইনি পরামর্শ নয়। জরুরি অবস্থায় 112-এ কল করুন।',
      hello: 'নমস্কার {name}! আমি সুরক্ষা AI। আইন, সংবিধান বা সাম্প্রতিক পুলিশ সংবাদ সম্পর্কে জিজ্ঞাসা করুন, অথবা কী ঘটেছে বলুন, আমি অভিযোগ করতে সাহায্য করব। টাইপ করুন বা মাইক চেপে বলুন।',
      chips: ['সাম্প্রতিক পুলিশ সংবাদ', 'গ্রেপ্তার হলে আমার অধিকার', 'অনুচ্ছেদ 21 ব্যাখ্যা করুন', 'অভিযোগ করতে সাহায্য করুন'] },
    mr: { profile: 'माझे प्रोफाइल', logout: 'लॉग आउट', ph: 'तुमचा संदेश लिहा…', send: 'पाठवा', listening: 'ऐकत आहे…', thinking: 'विचार करत आहे…', open: 'तपासून ही तक्रार दाखल करा',
      tagline: 'तुमचा मित्रवत सुरक्षा सहाय्यक', disc: 'सुरक्षा AI सामान्य माहिती देते, कायदेशीर सल्ला नाही. आणीबाणीत 112 वर कॉल करा.',
      hello: 'नमस्कार {name}! मी सुरक्षा AI. कायदे, संविधान किंवा ताज्या पोलीस बातम्यांबद्दल विचारा, किंवा काय घडले ते सांगा, मी तक्रार दाखल करण्यात मदत करेन. टाइप करा किंवा माईक दाबून बोला.',
      chips: ['ताज्या पोलीस बातम्या', 'अटक झाल्यास माझे हक्क', 'कलम 21 समजावा', 'तक्रार दाखल करण्यास मदत करा'] }
  };

  let lang = 'en';
  const valid = c => LANGS.some(l => l[0] === c);
  const SS = window.SS = {
    langs: LANGS, profile: null, me: null,
    lang: () => lang,
    speechLang: () => (LANGS.find(l => l[0] === lang) || LANGS[0])[2],
    t: k => (UI[lang] && UI[lang][k] != null) ? UI[lang][k] : UI.en[k],
    nav: tab => { const i = KEYS.indexOf(tab); return i < 0 ? tab : (NAV[lang] || NAV.en)[i]; },
    setLang
  };

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('#nav button').forEach(b => { const i = KEYS.indexOf(b.dataset.t); if (i >= 0) b.textContent = SS.nav(b.dataset.t); });
    const pr = $('openProfile'), lo = $('logoutLink');
    if (pr) pr.lastChild.textContent = SS.t('profile');
    if (lo) lo.lastChild.textContent = SS.t('logout');
    const sel = $('langPick'); if (sel) sel.value = lang;
    const pl = $('pf-lang'); if (pl) pl.value = lang;
    document.dispatchEvent(new CustomEvent('sslang', { detail: lang }));
  }
  function setLang(c, remember) {
    if (!valid(c)) c = 'en';
    lang = c; if (remember !== false) store.set('ss_lang', c);
    applyLang();
  }

  /* ---------- language picker ---------- */
  const sel = $('langPick');
  if (sel) {
    sel.innerHTML = LANGS.map(l => '<option value="' + l[0] + '">' + l[1] + '</option>').join('');
    sel.addEventListener('change', () => setLang(sel.value));
  }
  const saved = store.get('ss_lang'); if (saved && valid(saved)) lang = saved;

  /* ---------- avatar + menu ---------- */
  const initials = n => (n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const menu = $('profMenu'), abtn = $('avatarBtn');
  function closeMenu() { if (menu) { menu.hidden = true; abtn.setAttribute('aria-expanded', 'false'); } }
  if (abtn) {
    abtn.addEventListener('click', e => { e.stopPropagation(); const open = menu.hidden; menu.hidden = !open; abtn.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', e => { if (menu && !menu.hidden && !e.target.closest('.profwrap')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeDrawer(); } });
  }

  /* ---------- profile drawer ---------- */
  const FIELDS = [
    ['pf-phone', 'phone', 'Mobile number', 'tel', 'e.g. 98765 43210', 16],
    ['pf-email', 'email', 'Email', 'email', 'name@example.com', 120],
    ['pf-dob', 'dob', 'Date of birth', 'date', '', 10],
    ['pf-gender', 'gender', 'Gender', 'select', '', 0],
    ['pf-address', 'address', 'Address', 'text', 'House / street / area', 300],
    ['pf-city', 'city', 'City / district', 'text', 'e.g. Bengaluru', 80],
    ['pf-state', 'state', 'State', 'text', 'e.g. Karnataka', 80],
    ['pf-pin', 'pincode', 'PIN code', 'text', '6 digits', 6],
    ['pf-ename', 'emergencyName', 'Emergency contact name', 'text', 'Family member or friend', 80],
    ['pf-ephone', 'emergencyPhone', 'Emergency contact number', 'tel', '', 16]
  ];
  let lat = null, lng = null;
  const dim = document.createElement('div'); dim.className = 'pdim'; dim.id = 'pdim';
  const dr = document.createElement('aside'); dr.className = 'pdrawer'; dr.id = 'pdrawer'; dr.setAttribute('aria-label', 'My profile'); dr.setAttribute('aria-hidden', 'true');
  const fld = f => '<label for="' + f[0] + '">' + f[2] + '</label>' + (f[3] === 'select'
    ? '<select id="' + f[0] + '"><option value="">Choose…</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select>'
    : '<input id="' + f[0] + '" type="' + f[3] + '" placeholder="' + f[4] + '"' + (f[5] ? ' maxlength="' + f[5] + '"' : '') + '>');
  const F = k => FIELDS.filter(f => f[1] === k)[0];
  dr.innerHTML =
    '<div class="pd-head"><div class="avatar big"><span id="pd-ini">?</span></div><div><h3 id="pd-name">My profile</h3><div class="pd-meter" title="Profile completeness"><i id="pd-meter"></i></div><div class="pm-sub" id="pd-pct"></div></div><button class="x" id="pd-x" type="button" aria-label="Close">&times;</button></div>' +
    '<div class="pd-body">' +
    '<h4>Contact</h4>' + fld(F('phone')) + fld(F('email')) +
    '<h4>About you</h4>' + fld(F('dob')) + fld(F('gender')) +
    '<label for="pf-lang">Preferred language</label><select id="pf-lang">' + LANGS.map(l => '<option value="' + l[0] + '">' + l[1] + '</option>').join('') + '</select>' +
    '<h4>Location</h4>' + fld(F('address')) + fld(F('city')) + fld(F('state')) + fld(F('pincode')) +
    '<div class="pd-loc"><button class="btn" id="pf-gps" type="button">\uD83D\uDCCD Use my current location</button><span class="hint" id="pf-gpsmsg"></span></div>' +
    '<h4>In an emergency</h4>' + fld(F('emergencyName')) + fld(F('emergencyPhone')) +
    '<p class="hint" style="margin-top:14px">Your details are kept private. They help the police reach you faster and pre-fill your forms. Suraksha AI only sees your first name and city.</p></div>' +
    '<div class="pd-foot"><button class="btn primary" id="pf-save" type="button">Save profile</button><div class="banner" id="pf-msg"></div></div>';
  document.body.appendChild(dim); document.body.appendChild(dr);

  function openDrawer() { closeMenu(); fillForm(); dim.classList.add('on'); dr.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { dim.classList.remove('on'); dr.classList.remove('on'); dr.setAttribute('aria-hidden', 'true'); }
  dim.addEventListener('click', closeDrawer);
  $('pd-x').addEventListener('click', closeDrawer);
  const op = $('openProfile'); if (op) op.addEventListener('click', openDrawer);

  function meter() {
    const p = SS.profile || {}; let n = 0;
    FIELDS.forEach(f => { if (p[f[1]]) n++; }); if (p.lat != null) n++;
    const pct = Math.round(n * 100 / (FIELDS.length + 1));
    $('pd-meter').style.width = pct + '%'; $('pd-pct').textContent = 'Profile ' + pct + '% complete';
    const sub = $('pmSub'); if (sub) sub.textContent = pct + '% complete';
  }
  function fillForm() {
    const p = SS.profile || {};
    FIELDS.forEach(f => { $(f[0]).value = p[f[1]] || ''; });
    $('pf-lang').value = lang; lat = p.lat != null ? p.lat : null; lng = p.lng != null ? p.lng : null;
    $('pf-gpsmsg').textContent = lat != null ? 'Saved: ' + (+lat).toFixed(4) + ', ' + (+lng).toFixed(4) : '';
    $('pd-name').textContent = (SS.me && SS.me.name) || 'My profile'; $('pd-ini').textContent = initials(SS.me && SS.me.name);
    $('pf-msg').className = 'banner'; meter();
  }
  $('pf-gps').addEventListener('click', () => {
    if (!navigator.geolocation) { $('pf-gpsmsg').textContent = 'Location is not available in this browser.'; return; }
    navigator.geolocation.getCurrentPosition(p => { lat = p.coords.latitude; lng = p.coords.longitude; $('pf-gpsmsg').textContent = 'Captured: ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ' (tap Save)'; },
      () => { $('pf-gpsmsg').textContent = 'Could not get your location. Please type your address.'; }, { enableHighAccuracy: true, timeout: 10000 });
  });
  $('pf-save').addEventListener('click', async () => {
    const body = { language: $('pf-lang').value, lat: lat == null ? '' : String(lat), lng: lng == null ? '' : String(lng) };
    FIELDS.forEach(f => { body[f[1]] = $(f[0]).value; });
    const b = $('pf-save'); b.disabled = true;
    const r = await post('/api/profile', body);
    b.disabled = false;
    banner('pf-msg', r.ok, r.data.message || (r.ok ? 'Saved.' : 'Something went wrong.'));
    if (r.ok) { SS.profile = Object.assign({}, SS.profile, body, { lat: lat, lng: lng }); setLang(body.language); meter(); prefill(); }
  });

  /* Pre-fill the "File a case" form from the profile (only fields that are still empty). */
  function prefill() {
    const p = SS.profile; if (!p) return;
    [['city', p.city], ['state', p.state]].forEach(x => { const e = $(x[0]); if (e && !e.value && x[1]) e.value = x[1]; });
  }
  const prevShow = window.show;
  window.show = function (t) { prevShow(t); closeMenu(); if (t === 'file') prefill(); };

  /* ---------- load the person and their profile ---------- */
  (async function init() {
    applyLang();
    const me = await api('/api/me'); if (!me.ok) return;
    SS.me = me.data; abtn && ($('avatarIni').textContent = initials(me.data.name));
    const pi = $('avatarIni2'); if (pi) pi.textContent = initials(me.data.name);
    const pr = await api('/api/profile');
    if (pr.ok) {
      SS.profile = pr.data;
      if (!store.get('ss_lang') && valid(pr.data.language)) setLang(pr.data.language, false);
      prefill(); meter();
    }
    document.dispatchEvent(new CustomEvent('ssready'));
  })();
})();
