/* Content for the Safety Academy sections. General information only — not legal advice.
   Criminal-law section numbers refer to the Bharatiya Nyaya Sanhita (BNS) 2023 / BNSS 2023, in force since 1 July 2024
   (they replaced the IPC and CrPC). */
Object.assign(IC, {
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13M9 7h6"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5v-7Z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z"/>',
  alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  helmet:'<path d="M4 15a8 8 0 0 1 16 0v2H4v-2Z"/><path d="M4 15h9l3-4M8 20h8"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  school:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  cam:'<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="13" r="3.5"/>'
});

const SOS = {
  law:   [['112','Emergency','tel:112'],['1930','Cyber fraud','tel:1930'],['15100','Free legal aid','tel:15100']],
  road:  [['112','Emergency','tel:112'],['108','Ambulance','tel:108'],['1033','Highway helpline','tel:1033']],
  women: [['112','Emergency','tel:112'],['181','Women helpline','tel:181'],['1091','Women police','tel:1091']],
  rag:   [['1800-180-5522','Anti-ragging helpline','tel:18001805522'],['112','Emergency','tel:112']]
};

/* ---------------- KNOW YOUR LAW ---------------- */
const LAW = {
  learn: [
    {ic:'scale', t:'Your basic rights', s:'What you are entitled to when dealing with the police.', full:[
      'Right to life and personal liberty (Article 21) and equality before the law.',
      'If arrested: you must be told the reason (grounds) of arrest, and can inform a family member or friend.',
      'You have the right to a lawyer of your choice. If you cannot afford one, you can get free legal aid.',
      'You must be produced before a Magistrate within 24 hours of arrest (travel time excluded).',
      'You cannot be forced to be a witness against yourself (right to remain silent, Article 20(3)).',
      'Women should generally be arrested by or in the presence of a woman police officer, and not at night without a Magistrate’s permission.']},
    {ic:'file', t:'What is an FIR?', s:'The First Information Report starts a police investigation.', full:[
      'An FIR is written when you report a <b>cognizable offence</b> (serious crimes where police can act without a court order — e.g. theft, robbery, assault, kidnapping).',
      'Anyone who knows about the offence can report it, not only the victim. Registration is under Section 173 BNSS (earlier Section 154 CrPC).',
      'FIR registration is <b>free</b>. You are entitled to a <b>free copy</b> immediately. Read it before you sign.',
      '<b>Zero FIR</b>: police cannot refuse because the crime happened in another area. They register it and transfer it.',
      '<b>e-FIR</b>: you can report online, but you must sign it within 3 days for it to be registered.',
      'Non-cognizable matters (minor offences) are recorded as a complaint/NCR and usually need a Magistrate’s order to investigate.']},
    {ic:'siren', t:'Common offences in simple words', s:'Crimes people face most often (BNS 2023).', full:[
      '<b>Theft</b> (S.303) — dishonestly taking movable property. <b>Robbery</b> (S.309) — theft with force or fear.',
      '<b>Cheating</b> (S.318) — deceiving someone to make them hand over money or property. Online scams usually fall here too.',
      '<b>Hurt / assault</b> (S.115 and others) — causing physical pain or injury.',
      '<b>Criminal intimidation</b> (S.351) — threatening harm to a person, reputation or property.',
      '<b>Stalking</b> (S.78) — following or repeatedly contacting a woman despite clear disinterest, or monitoring her online.',
      '<b>Defamation</b> (S.356), <b>criminal breach of trust</b> (S.316), <b>kidnapping</b> (S.137), <b>murder</b> (S.103).']},
    {ic:'chat', t:'How to make a complaint', s:'Step by step, and what to do if police refuse.', full:[
      '1. Go to the nearest police station (or file an e-FIR / use this app) and state facts in your own words.',
      '2. Ask for a written copy / receipt of your complaint or FIR number.',
      '3. If the station <b>refuses</b>: send the complaint in writing (post/email) to the Superintendent of Police (S.173(4) BNSS).',
      '4. Still no action? You can approach the <b>Judicial Magistrate</b> who can direct the police to register an FIR (S.175(3) BNSS).',
      '5. For misconduct by police: complain to the SP/DCP, the State Police Complaints Authority or the Human Rights Commission.']},
    {ic:'laptop', t:'Reporting cybercrime', s:'Online fraud, hacking, harassment, fake profiles.', full:[
      'Money lost online? <b>Call 1930 immediately</b> — the first hours are the “golden hour” to freeze the transfer.',
      'File a complaint at <b>cybercrime.gov.in</b> (National Cyber Crime Reporting Portal). Women/children-related content has a dedicated option.',
      'Keep evidence: screenshots, URLs, phone numbers, UPI/transaction IDs, emails with headers, chat exports. Do not delete anything.',
      'Tell your bank at once and request a block/hold. Change passwords and enable 2-step verification.',
      'Relevant laws: IT Act 2000 (S.66C identity theft, S.66D cheating by impersonation, S.66E privacy violation, S.67 obscene content) and BNS cheating/stalking/intimidation.',
      'You can also file in this app under <b>File a case → Cybercrime</b>.']},
    {ic:'users', t:'Civil dispute or criminal matter?', s:'Knowing which door to knock on saves months.', full:[
      'Criminal = the State prosecutes an offence against society (jail/fine). Civil = one person/party sues another to settle a private right (money, property, contract).',
      'Open the <b>Civil vs Criminal</b> tab for a side-by-side comparison and a quick game.']},
    {ic:'badge', t:'Consumer & RTI rights', s:'Two powerful everyday tools.', full:[
      '<b>Consumer Protection Act 2019</b>: defective product, deficient service or unfair trade? Complain at the Consumer Commission, even online at e-Daakhil.',
      '<b>Right to Information Act 2005</b>: ask any public authority for records for a small fee; reply is due within 30 days.',
      'Both are civil remedies — no FIR needed.']}
  ],
  civil: {
    civil:['Dispute between <b>private parties</b> over a right','Remedy: <b>compensation</b>, injunction, recovery, divorce, specific performance','Filed as a <b>suit/petition</b> in civil / family / consumer court','Burden: <b>balance of probabilities</b>','Examples: unpaid rent or loan, property boundary, breach of contract, divorce, tenant eviction, consumer complaint'],
    crim:['An act the law treats as an <b>offence against society</b>','Result: <b>punishment</b> — jail, fine (State prosecutes)','Starts with an <b>FIR / police complaint</b>, then a court trial','Burden: <b>beyond reasonable doubt</b>','Examples: theft, assault, cheating, stalking, cyber fraud, threats'],
    note:'Some situations are both — e.g. cheating (criminal) plus recovery of the money (civil), or a bounced cheque (S.138 NI Act). Police generally cannot decide pure civil disputes: use a lawyer, Lok Adalat or a legal services authority.',
    game:[
      {q:'A tenant has stopped paying rent for 4 months.', a:0, e:'Unpaid rent is a civil matter: legal notice, then a rent/civil court (or mediation).'},
      {q:'Someone snatches your phone and runs away.', a:1, e:'Snatching is theft/robbery — a criminal offence. File an FIR.'},
      {q:'Two neighbours disagree about where their plot boundary lies.', a:0, e:'Boundary disputes are civil. Try mediation / Lok Adalat, or file a civil suit.'},
      {q:'A stranger on social media threatens to leak your photos unless you pay.', a:1, e:'Blackmail / criminal intimidation + IT Act offences. Call 1930 / report on cybercrime.gov.in.'},
      {q:'A shop sold you a mobile phone that stopped working after a week; they refuse a refund.', a:0, e:'Consumer dispute — approach the Consumer Commission (e-Daakhil). Not a police matter.'},
      {q:'Someone pretends to be a bank officer and takes ₹50,000 from your account.', a:1, e:'Cheating by impersonation — criminal. Call 1930 immediately and file an FIR.'},
      {q:'A couple wants a mutual-consent divorce.', a:0, e:'Divorce is a civil/family-court matter.'},
      {q:'A man repeatedly follows a woman and sends unwanted messages.', a:1, e:'Stalking (S.78 BNS) — a criminal offence.'}
    ]
  },
  faq: [
    ['Do I need a lawyer to file an FIR?','No. You can go to the station yourself, or file an e-FIR. A lawyer can help later, but registration needs no lawyer and no fee.'],
    ['Can police refuse to register my FIR?','If the offence is cognizable they must register it (even as a Zero FIR if it happened elsewhere). If they refuse, send it in writing to the SP, and then you can go to the Magistrate.'],
    ['What is the difference between FIR and complaint?','An FIR is the police record of a cognizable offence that starts an investigation. A complaint is a general report to police or a Magistrate; for non-cognizable matters police record it and the Magistrate decides further steps.'],
    ['What is a Zero FIR?','An FIR that can be registered at any police station regardless of where the crime happened. It is later transferred to the station with jurisdiction.'],
    ['How long do I have to report a crime?','There is no time limit for filing an FIR for serious crimes, but report as early as possible — evidence disappears and delay must be explained. For cyber-fraud, minutes and hours matter.'],
    ['Will the accused be arrested immediately after my FIR?','Not automatically. Police investigate first. For many offences they issue a notice to appear (S.35 BNSS) instead of arrest.'],
    ['Can I withdraw an FIR?','The State, not the victim, prosecutes. Only the High Court can quash an FIR (usually where parties have genuinely settled and the offence permits it).'],
    ['What are my rights if I am arrested?','Know the grounds, inform a relative, meet a lawyer, medical examination, produced before a Magistrate within 24 hours, and no torture or humiliation.'],
    ['How do I get free legal aid?','Call NALSA 15100 or contact your District Legal Services Authority. Free aid is available to women, children, SC/ST, persons in custody, disabled persons and those under an income limit.'],
    ['Is an online threat or abusive message a crime?','Yes — criminal intimidation, stalking, defamation or IT Act offences may apply. Save screenshots and report at cybercrime.gov.in.'],
    ['What is a Lok Adalat?','A free, quick dispute-resolution forum for civil and compoundable matters. Its award is final and binding, and there is no court fee.'],
    ['Where can I read the actual law?','India Code (indiacode.nic.in) hosts every central Act, including BNS, BNSS and the IT Act. See the Official links tab.']
  ],
  myths: [
    ['Police can refuse an FIR if the crime happened outside their area.','FALSE. A Zero FIR must be registered at any station and transferred to the right one.'],
    ['You must pay or “adjust” something for an FIR to be filed.','FALSE. FIR registration and the first copy are free. Report any demand for money to the SP or anti-corruption helpline.'],
    ['Only the victim can file an FIR.','FALSE. Any person who knows about a cognizable offence can report it.'],
    ['Police can arrest anyone without telling them why.','FALSE. You must be told the grounds of arrest, and be produced before a Magistrate within 24 hours.'],
    ['Police always need a warrant to arrest.','NOT ALWAYS. For cognizable offences police can arrest without a warrant, but only under legal conditions and with proper procedure.'],
    ['Police can settle my money dispute or property dispute for me.','FALSE. Pure civil disputes belong in civil court, Lok Adalat or mediation. Police act when there is a criminal offence.'],
    ['I cannot report online fraud after a few days.','FALSE — but speed matters. Call 1930 at once; later reports are still valid and should include all transaction details.'],
    ['Screenshots are not valid evidence.','FALSE. Electronic records are admissible (Bharatiya Sakshya Adhiniyam 2023) when properly preserved. Keep originals, dates, URLs, and numbers.'],
    ['After an FIR, the case is over or the matter is automatically settled.','FALSE. An FIR starts the process: investigation, charge-sheet, trial. Keep following up with the Investigating Officer.']
  ],
  links: [
    ['India Code — all central laws','https://indiacode.nic.in','book','Official database of Acts including BNS, BNSS, IT Act'],
    ['National Cyber Crime Reporting Portal','https://cybercrime.gov.in','laptop','Report online fraud, harassment, hacking. Helpline 1930'],
    ['NALSA — free legal aid','https://nalsa.gov.in','scale','National Legal Services Authority. Helpline 15100'],
    ['Tele-Law','https://www.tele-law.in','phone','Free legal advice through Common Service Centres. Tele-Law 14454'],
    ['eCourts Services','https://services.ecourts.gov.in','receipt','Track your case status, orders and cause lists'],
    ['e-Daakhil (consumer complaints)','https://edaakhil.nic.in','badge','File consumer complaints online'],
    ['RTI Online','https://rtionline.gov.in','search','File Right to Information requests to central authorities'],
    ['National Human Rights Commission','https://nhrc.nic.in','shield','Complain about human-rights violations incl. by public servants']
  ],
  videos: [
    ['3Q1MCg1Hs40','How to file an FIR — registration process'],
    ['zmjPGXz5S80','How to file an online FIR in India'],
    ['X2N4DVSr9RQ','What to do if police do not file your FIR (short)'],
    ['x3ZHiQkWkXQ','Awareness on cybercrime']
  ],
  chips: ['How do I file an FIR?','What is a Zero FIR?','Police refused my FIR','Online fraud, what now?','Civil vs criminal?','Free legal aid'],
  kb: [
    {k:'fir file register lodge how', a:'To file an FIR: go to any police station (or use the e-FIR tab in this app), narrate what happened with date, time, place and people involved, check what is written, sign it and take your free copy with the FIR number. It costs nothing and you do not need a lawyer.'},
    {k:'zero fir another area jurisdiction', a:'A Zero FIR can be registered at any police station, even if the crime happened elsewhere. The station then transfers it to the correct one. Police cannot refuse on the ground of jurisdiction.'},
    {k:'refuse refused denied not registering not file', a:'If police refuse a cognizable FIR: (1) ask for the reason in writing, (2) send your complaint by post/email to the Superintendent of Police (S.173(4) BNSS), (3) approach the Judicial Magistrate to direct registration (S.175(3) BNSS). You can also complain to the State Police Complaints Authority.'},
    {k:'cyber online fraud scam upi hacked phishing money', a:'Act fast: (1) Call 1930 right now, (2) tell your bank to block/hold, (3) report at cybercrime.gov.in, (4) save screenshots, transaction IDs, numbers and links, (5) change passwords. You can also file the case in this app under File a case → Cybercrime.'},
    {k:'civil criminal difference dispute', a:'Criminal: an offence against society (theft, assault, cheating) — starts with an FIR, State prosecutes, punishment is jail/fine. Civil: private dispute (rent, property, contract, divorce) — you sue in civil/family/consumer court for compensation or a right. Open the Civil vs Criminal tab to practise.'},
    {k:'legal aid lawyer afford free nalsa', a:'You can get a free lawyer through the District Legal Services Authority. Call NALSA at 15100, visit nalsa.gov.in, or use Tele-Law at 14454. Women, children, SC/ST, persons in custody and people below an income limit are eligible.'},
    {k:'arrest rights arrested', a:'If arrested you must be told the grounds, can inform a relative, can consult a lawyer, must be medically examined if you ask, and must be produced before a Magistrate within 24 hours. You cannot be tortured, and you have the right to remain silent about incriminating facts.'},
    {k:'bail', a:'Bail is permission to stay out of custody during the case. For bailable offences it is a right (police/court must grant it). For non-bailable offences the court decides. A lawyer or legal-aid advocate can apply; legal aid is free if you qualify.'},
    {k:'theft stolen snatch phone wallet', a:'Theft/snatching is a criminal offence (BNS S.303/309). File an FIR with details (IMEI, bill, photos). For a lost phone also use the CEIR portal (ceir.gov.in) to block it. Keep your FIR copy for insurance.'},
    {k:'cheque bounce dishonour', a:'A dishonoured cheque is an offence under Section 138 of the Negotiable Instruments Act. You must send a legal notice within 30 days of the bank memo, and the drawer has 15 days to pay. Then you can file a complaint in court. A lawyer is strongly advised.'},
    {k:'consumer refund defective product', a:'This is a consumer (civil) matter. Send a written complaint to the seller, then file with the Consumer Commission — online at edaakhil.nic.in. No FIR is needed.'},
    {k:'rti information', a:'Under the RTI Act 2005 you can request records from a public authority by writing to its Public Information Officer (or online at rtionline.gov.in for central bodies) with a small fee. A reply is due within 30 days.'},
    {k:'domestic violence husband dowry', a:'Domestic violence and dowry harassment are crimes (BNS S.85, Dowry Prohibition Act) and also covered by the Domestic Violence Act 2005, which gives protection and residence orders. Call 112 or 181, or go to a Protection Officer / One Stop Centre.'},
    {k:'tenant rent landlord evict', a:'Rent and eviction disputes are civil. Use the Rent Control law of your state, send a legal notice, and approach the Rent Controller/civil court. Police can only help if there is a criminal act such as forceful dispossession or threats.'},
    {k:'defamation insult abuse threat', a:'Threatening someone is criminal intimidation (S.351 BNS) and defaming them is S.356. Keep screenshots/recordings and file a complaint; for online abuse use cybercrime.gov.in.'},
    {k:'lok adalat mediation settle', a:'A Lok Adalat settles disputes quickly and free of court fee, and its award is final. Apply through your District Legal Services Authority (NALSA 15100).'},
    {k:'child minor pocso', a:'Offences against children are covered by the POCSO Act. Report to police or Childline 1098. A child’s identity must be protected and the police cannot refuse to register the case.'}
  ],
  hello: 'Hi! I’m your Know-Your-Law guide. I explain things in plain language — FIRs, complaints, cybercrime, civil vs criminal and more. What would you like to know?'
};

/* ---------------- ROAD SAFETY ACADEMY ---------------- */
const ROAD = {
  learn: [
    {ic:'helmet', t:'Helmet use', s:'The single best protection for two-wheeler riders.', full:[
      'Wear a <b>BIS (ISI) certified</b> full-face or open-face helmet — rider and pillion, every trip, even short ones.',
      'Fasten the chin strap. A loose helmet comes off in a crash. It should fit snug with no more than a finger gap.',
      'Replace a helmet after any hard impact or every 3–5 years. Never buy a used helmet.',
      'Not wearing one is punishable under the Motor Vehicles Act (fine and possible licence disqualification) — but the real penalty is head injury.']},
    {ic:'car', t:'Seat belts & child safety', s:'Buckle up on every seat, every time.', full:[
      'Seat belts are mandatory for the driver <b>and all passengers</b>, front and rear.',
      'A seat belt can roughly halve the risk of death for front-seat occupants in a crash.',
      'Children must never sit on a lap. Use an age-appropriate child restraint and keep young children in the rear seat.',
      'Belt flat across the chest and hips, never under the arm or behind the back.']},
    {ic:'users', t:'Pedestrian safety', s:'Be seen, be predictable, be patient.', full:[
      'Use footpaths, subways and <b>zebra crossings</b>. If no footpath, walk on the right side facing traffic.',
      'Stop at the kerb, look right-left-right, make eye contact with drivers before stepping out.',
      'Do not cross while using your phone or earphones. At night wear light or reflective clothes.',
      'Cross at the green pedestrian signal; never between parked vehicles or at blind curves.']},
    {ic:'road', t:'Safe driving practices', s:'Habits that prevent most crashes.', full:[
      '<b>Speed</b>: obey limits — higher speed means longer stopping distance and worse injuries.',
      '<b>3-second rule</b>: keep at least 3 seconds behind the vehicle in front (more in rain or at night).',
      '<b>Never</b> drink and drive (legal limit: 30 mg alcohol per 100 ml blood) and never use a phone while driving.',
      'Indicate early, check mirrors and blind spots, stay in lane, overtake only when clear and legal.',
      'Carry valid licence, registration, insurance and PUC.']},
    {ic:'shield', t:'Accident-prevention tips', s:'Small checks, big difference.', full:[
      'Check tyres, brakes, lights and horn before long trips. Do not overload your vehicle.',
      'Take a break every 2 hours; drowsy driving is as dangerous as drunk driving.',
      'In rain: slow down, increase distance, avoid sudden braking, switch on headlights.',
      'At night: dip headlights for oncoming traffic; watch for unlit vehicles and animals.',
      'Cyclists and two-wheelers: use lights and reflectors; ride single file.']},
    {ic:'siren', t:'What to do after a crash', s:'The first minutes save lives.', full:[
      '1. Stop, switch on hazard lights, move to safety, and place a warning triangle if you have one.',
      '2. Call <b>112</b> (police/ambulance) or <b>108</b> (ambulance). Give your exact location.',
      '3. Do not move seriously injured people unless there is fire or danger. Stop heavy bleeding with firm pressure.',
      '4. <b>Good Samaritan law</b> (S.134A, Motor Vehicles Act): helping an injured person cannot get you into legal trouble, you need not reveal your name, and hospitals must give emergency treatment.',
      '5. Note vehicle numbers, take photos, and report to the police.']}
  ],
  videos: [
    ['zL3hszVBB0o','Use your seat belt — awareness video by Traffic Police India'],
    ['kBEDUS7OlK8','Road safety anthem'],
    ['Zb7r-j9N3S0','Why we need to discuss road safety in India'],
    ['lvSVniWMEcU','Wear your seatbelt']
  ],
  chips: ['Is helmet mandatory for pillion?','Drink and drive limit','What to do after an accident','Good Samaritan law','What does a red circle sign mean?'],
  kb: [
    {k:'helmet pillion two wheeler bike', a:'Yes. Under the Motor Vehicles Act the rider and the pillion must wear a BIS-certified helmet with the strap fastened. Not wearing one attracts a fine and possible licence disqualification, but more importantly it greatly raises the risk of fatal head injury.'},
    {k:'seat belt seatbelt rear back', a:'Seat belts are required for the driver and all passengers, front and rear. Children should never sit on a lap; use a proper child restraint or the rear seat belt. A belt can roughly halve the risk of death for front-seat occupants.'},
    {k:'drink drunk alcohol limit', a:'Driving with more than 30 mg of alcohol per 100 ml of blood is an offence (S.185 Motor Vehicles Act) — fine, imprisonment and licence action. The safest rule: if you drink, do not drive. Arrange a driver or cab.'},
    {k:'accident crash injured what to do', a:'Stay safe, switch on hazard lights, call 112 or 108, give your exact location, control bleeding with firm pressure, and do not move seriously injured people unless there is fire. Under the Good Samaritan law you are protected from legal harassment for helping.'},
    {k:'good samaritan help injured witness', a:'The Good Samaritan law (Section 134A, Motor Vehicles Act) protects anyone who helps a road accident victim. You will not face civil or criminal liability, need not give your name or details, and cannot be forced to be a witness. Hospitals must treat emergencies without waiting for payment or police formalities.'},
    {k:'phone mobile driving texting', a:'Using a handheld phone while driving is an offence and one of the leading causes of distraction crashes. Park safely first, or use hands-free only if allowed and truly necessary.'},
    {k:'speed limit fast overspeed', a:'Speed limits vary by road and vehicle (e.g. 50 km/h in many city areas, higher on highways, lower in school zones). Higher speed lengthens stopping distance sharply. Always follow the posted limit.'},
    {k:'zebra crossing pedestrian cross', a:'At a zebra crossing, vehicles must slow and give way to pedestrians. As a pedestrian: stop at the kerb, look right-left-right, make eye contact with the driver, and cross briskly without using your phone.'},
    {k:'signal red amber green traffic light', a:'Red: stop behind the line. Amber: be ready to stop — stop if you safely can. Green: go, but only if the way ahead is clear. Never jump a red light; it is among the most dangerous violations.'},
    {k:'sign circle triangle rectangle meaning shape', a:'Mandatory/prohibitory signs are circles (red border = do not; blue = must). Cautionary/warning signs are triangles with a red border. Informatory signs are rectangles (blue/green) giving information like hospital or parking. Try the Signs tab and the quiz!'},
    {k:'licence license documents rc insurance puc', a:'Carry your driving licence, vehicle registration certificate (RC), valid insurance and Pollution Under Control (PUC) certificate. Digital copies on DigiLocker/mParivahan are accepted.'},
    {k:'child kid school', a:'Children must use a child restraint or seat belt in cars and a helmet on two-wheelers. Teach them to cross at crossings, hold hands near roads, and never play near traffic.'},
    {k:'night rain fog driving', a:'In rain/fog: reduce speed, switch on dipped headlights (and fog lamps in thick fog), keep a bigger gap and avoid sudden braking. At night: dip lights for oncoming traffic and take breaks to avoid fatigue.'}
  ],
  hello: 'Hi! I’m your Road Safety coach. Ask me about helmets, seat belts, signs, safe driving or what to do after an accident.'
};

/* Traffic signs: [id, name, meaning, category] */
const SIGNS = [
  ['stop','Stop','Come to a complete halt, check, then proceed only when clear.','Mandatory'],
  ['giveway','Give way','Slow down and let traffic on the main road go first.','Mandatory'],
  ['noentry','No entry','Vehicles are not allowed to enter this road.','Prohibitory'],
  ['speed50','Speed limit 50','Do not exceed 50 km/h on this stretch.','Prohibitory'],
  ['noparking','No parking','You may not park here; stopping may also be restricted.','Prohibitory'],
  ['nouturn','No U-turn','Making a U-turn is not allowed at this point.','Prohibitory'],
  ['left','Compulsory turn left','Vehicles must turn left only.','Mandatory'],
  ['school','School ahead','Slow down; children may cross the road.','Cautionary'],
  ['curve','Sharp right curve','A sharp bend to the right ahead — reduce speed.','Cautionary'],
  ['ped','Pedestrian crossing ahead','Be ready to stop for people crossing.','Cautionary'],
  ['hospital','Hospital','A hospital is nearby — keep noise low and drive carefully.','Informatory'],
  ['parking','Parking','Parking is allowed here.','Informatory']
];

function signSVG(id){
  const R = '#e53935', B = '#1565c0', W = '#fff', K = '#111';
  const circ = (inner, border) => '<circle cx="50" cy="50" r="46" fill="'+W+'" stroke="'+(border||R)+'" stroke-width="9"/>'+inner;
  const tri = inner => '<path d="M50 6 95 88H5L50 6Z" fill="'+W+'" stroke="'+R+'" stroke-width="8" stroke-linejoin="round"/>'+inner;
  const p = {
    stop:'<path d="M32 4h36l28 28v36L68 96H32L4 68V32L32 4Z" fill="'+R+'" stroke="#fff" stroke-width="3"/><text x="50" y="58" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="24" fill="#fff">STOP</text>',
    giveway:'<path d="M50 92 6 14h88L50 92Z" fill="'+W+'" stroke="'+R+'" stroke-width="8" stroke-linejoin="round"/>',
    noentry:'<circle cx="50" cy="50" r="46" fill="'+R+'"/><rect x="18" y="41" width="64" height="18" rx="2" fill="#fff"/>',
    speed50:circ('<text x="50" y="62" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="38" fill="'+K+'">50</text>'),
    noparking:'<circle cx="50" cy="50" r="46" fill="'+B+'" stroke="'+R+'" stroke-width="8"/><path d="M24 76 76 24" stroke="'+R+'" stroke-width="9"/><text x="50" y="66" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="46" fill="#fff" opacity=".95">P</text><path d="M24 76 76 24" stroke="'+R+'" stroke-width="9"/>',
    nouturn:circ('<path d="M38 74V42a12 12 0 0 1 24 0v8" fill="none" stroke="'+K+'" stroke-width="8" stroke-linecap="round"/><path d="m52 46 10 12 10-12Z" fill="'+K+'"/><path d="M22 78 78 22" stroke="'+R+'" stroke-width="8"/>'),
    left:'<circle cx="50" cy="50" r="46" fill="'+B+'"/><path d="M72 50H34M34 50l14-14M34 50l14 14" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
    school:tri('<circle cx="40" cy="42" r="5" fill="'+K+'"/><circle cx="58" cy="46" r="4" fill="'+K+'"/><path d="M40 48v14M34 54l6 4 6-4M40 62l-5 12M40 62l5 12M58 50v11M53 56l5 3 5-3M58 61l-4 11M58 61l4 11" fill="none" stroke="'+K+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    curve:tri('<path d="M38 74V54a12 12 0 0 1 12-12h10" fill="none" stroke="'+K+'" stroke-width="7" stroke-linecap="round"/><path d="m58 32 14 10-14 10Z" fill="'+K+'"/>'),
    ped:tri('<circle cx="50" cy="38" r="5" fill="'+K+'"/><path d="M50 44v14M42 50l8 4 8-4M50 58l-7 13M50 58l7 13" fill="none" stroke="'+K+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 80h48" stroke="'+K+'" stroke-width="3" stroke-dasharray="6 4"/>'),
    hospital:'<rect x="6" y="6" width="88" height="88" rx="10" fill="'+B+'"/><text x="50" y="68" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="62" fill="#fff">H</text>',
    parking:'<rect x="6" y="6" width="88" height="88" rx="10" fill="'+B+'"/><text x="50" y="70" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="64" fill="#fff">P</text>'
  };
  return '<svg viewBox="0 0 100 100" role="img" aria-label="'+id+' sign">'+p[id]+'</svg>';
}

/* Quiz: sign questions are generated from SIGNS with wrong options drawn from the others. */
const ROAD_QUIZ_EXTRA = [
  {q:'What is the national emergency number you can call for police, fire or ambulance?', o:['100 only','112','911','1090'], a:1, e:'112 is the single emergency number in India. It works from any phone.'},
  {q:'What does a flashing/amber traffic light mean?', o:['Speed up to cross','Be ready to stop; stop if you safely can','You have right of way','Reverse'], a:1, e:'Amber warns that red is coming. Stop if it is safe to do so.'},
  {q:'Who must wear a helmet on a motorcycle?', o:['Only the rider','Only on highways','Rider and pillion','Only at night'], a:2, e:'Both rider and pillion must wear a BIS-certified helmet with the strap fastened.'},
  {q:'What is a safe following distance in normal conditions?', o:['1 metre','About 3 seconds behind the vehicle ahead','Bumper to bumper','One car length at any speed'], a:1, e:'The 3-second rule gives time to react. Increase it in rain or at night.'},
  {q:'You see someone injured in a road accident. Under the Good Samaritan law you:', o:['Must give your name and address','Can be forced to be a witness','Are protected from legal liability for helping','Should never help'], a:2, e:'Section 134A of the Motor Vehicles Act protects Good Samaritans. Call 112/108 and help safely.'},
  {q:'Where should you walk if there is no footpath?', o:['With traffic, on the left','On the right side, facing traffic','In the middle of the road','On the divider'], a:1, e:'Facing oncoming traffic lets you see vehicles and step aside in time.'}
];

/* ---------------- WOMEN'S SAFETY & SUPPORT ---------------- */
const WOMEN = {
  learn: [
    {ic:'shield', t:'Personal safety on the move', s:'Habits that keep you a step ahead.', full:[
      'Share your <b>live location</b> with a trusted person when travelling alone or taking a cab.',
      'Before boarding a cab/auto, check the number plate and driver details match the app. Sit behind the driver and share the trip link.',
      'Trust your instincts. If a place or person feels wrong, leave and move toward lights and people.',
      'Keep your phone charged, set up emergency contacts and the SOS shortcut on your phone; know your route and nearby help points.',
      'At home: lock doors, check who is at the door before opening, and keep helpline numbers saved.']},
    {ic:'laptop', t:'Digital & online safety', s:'Protect your accounts, photos and privacy.', full:[
      'Use strong, unique passwords and turn on <b>two-step verification</b>. Never share an OTP with anyone.',
      'Make your social profiles private. Think before sharing live location, school/work/home details or intimate photos.',
      'Do not click unknown links or install apps from messages. Be careful with video-call requests from strangers (sextortion scams).',
      'If someone threatens to leak your pictures: do not pay, do not delete the chat, take screenshots and report at cybercrime.gov.in or call 1930. You can also use <b>StopNCII.org</b> to help stop intimate images spreading.',
      'Block, report and restrict harassers on every platform.']},
    {ic:'users', t:'Safety at work and college', s:'Your right to a harassment-free place.', full:[
      'The <b>POSH Act 2013</b> requires every workplace with 10+ staff to have an Internal Committee (IC). Colleges also have committees.',
      'You can file a written complaint with the IC within 3 months of the incident (extendable by another 3 months in some cases).',
      'You can also complain through the government’s <b>SHe-Box</b> portal.',
      'Retaliation for complaining is not allowed. Keep a record of incidents and witnesses.']},
    {ic:'lock', t:'Home & relationships', s:'Abuse is never your fault.', full:[
      'Domestic violence covers physical, emotional, sexual and economic abuse. The <b>Domestic Violence Act 2005</b> gives protection orders, a right to stay in the shared home and monetary relief.',
      'Cruelty by husband/relatives and dowry harassment are crimes (BNS S.85, Dowry Prohibition Act).',
      'Call <b>181</b> or <b>112</b>, or approach the nearest <b>One Stop Centre (Sakhi)</b> for counselling, medical, police and legal support in one place.',
      'Make a quiet safety plan: copies of documents, some cash, a trusted contact, a safe place to go.']},
    {ic:'bulb', t:'Self-defence basics', s:'Awareness first. Fighting is the last option.', full:[
      '<b>Aware → Avoid → Assert → Escape → Report.</b> Most safety is spotting danger early and leaving.',
      'Use a loud, firm voice: “Back off!” or “Call the police!” — attention is a powerful deterrent.',
      'Carry keys or an alarm in hand while walking at night; avoid headphones in isolated areas.',
      'If grabbed, aim to create space and run toward people. Simple strikes to eyes, nose, throat, groin, or shins and stamping on the foot can give you time to escape.',
      'Join a reputable class (see the Workshops tab) to practise safely.']}
  ],
  signs: {
    items: [
      ['Keeps showing up where I am (college, work, home, gym) without a reason','stalking'],
      ['Keeps calling or messaging after I clearly said no or asked to stop','stalking'],
      ['Tracks my location, social media or phone, or uses hidden apps/devices','stalking'],
      ['Makes unwanted sexual comments, jokes, touching or sends explicit content','harassment'],
      ['Threatens to leak my photos/videos or personal information','harassment'],
      ['Insults or humiliates me in front of others, or constantly criticises me','coercive'],
      ['Controls my money, documents, clothes, or whom I can meet','coercive'],
      ['Cuts me off from friends and family, or gets angry when I talk to them','coercive'],
      ['Gets furious if I do not reply immediately or demands passwords','coercive'],
      ['Makes me feel afraid to say no, or blames me for their behaviour','coercive']
    ],
    low:'None of these were selected. Healthy relationships respect your “no”. If something still feels uncomfortable, trust that feeling and talk to someone you trust.',
    mid:'A few of these are warning signs. Unwanted contact and monitoring can be stalking or harassment under the law. Start saving evidence, set clear boundaries once, then stop engaging, and tell a trusted person.',
    high:'This looks like a pattern of stalking, harassment or coercive control. It is not your fault. Please keep evidence, tell someone you trust, and reach out to 181 / 112 or your nearest police station. If you feel unsafe right now, call 112.'
  },
  evidence: [
    ['Do not delete anything','Keep messages, call logs, emails, voice notes, photos, gifts and social-media activity, even if upsetting.'],
    ['Capture it properly','Take screenshots that show the sender’s name/number, date and time, and the full conversation or URL. Record usernames and profile links.'],
    ['Back it up','Email copies to yourself or save to cloud storage and a second device so nothing is lost if the phone is damaged or taken.'],
    ['Keep a diary','Write dates, times, places, what happened and who saw it. Note witnesses and CCTV locations.'],
    ['Get medical help if hurt','See a doctor and ask for a written medical record, and avoid washing/changing if there has been a sexual assault, where possible, until examined.'],
    ['Do not retaliate or meet alone','Avoid confronting the person. Tell a trusted friend or family member and ask them to stay with you.'],
    ['Report and ask for a copy','File an FIR/complaint (a woman officer can record your statement; you can ask for it at home in some cases). Ask for the FIR number and a copy.']
  ],
  helplines: [
    ['112','Emergency (police, fire, ambulance)','tel:112'],
    ['181','Women Helpline — 24×7 support & referral','tel:181'],
    ['1091','Women police helpline (in many states)','tel:1091'],
    ['1930','Cyber fraud helpline','tel:1930'],
    ['1098','Childline (for children in distress)','tel:1098'],
    ['15100','Free legal aid (NALSA)','tel:15100'],
    ['14416','Tele-MANAS — free mental health support','tel:14416']
  ],
  links: [
    ['National Commission for Women','https://ncw.gov.in','shield','File complaints, find support and legal information'],
    ['National Cyber Crime Reporting Portal','https://cybercrime.gov.in','laptop','Report online harassment, morphing, stalking and fraud'],
    ['StopNCII.org','https://stopncii.org','lock','Helps stop intimate images from being shared online'],
    ['SHe-Box — workplace harassment','https://shebox.wcd.gov.in','file','Government portal to complain about sexual harassment at work'],
    ['Ministry of Women & Child Development','https://wcd.gov.in','users','One Stop Centres, schemes and helplines'],
    ['NALSA — free legal aid','https://nalsa.gov.in','scale','Free lawyer and counselling. Helpline 15100']
  ],
  workshops: [
    ['Ask your local police station','Many police stations and Women’s Help Desks run or know of free self-defence and awareness drives. Book an appointment from the Appointments tab to ask.','appt'],
    ['College NCC / NSS / women’s cell','Colleges often host self-defence sessions through NCC, NSS, the women’s cell or the Internal Committee. Ask your student welfare office.',''],
    ['District Women & Child Development office','The district WCD office and One Stop Centre can point you to government-backed training and counselling programmes.',''],
    ['Choose a good trainer','Look for certified trainers, women-friendly batches, a focus on awareness, boundaries and escape (not just striking), and a clear safety/consent policy.','']
  ],
  videos: [
    ['hD1igasuX4c','Cyber safety for women'],
    ['B75ctcvmuh0','Cyber safety for women and girls'],
    ['kg6PHg5nCXM','Stay cyber safe — online safety tips for women']
  ],
  chips: ['What is stalking?','Online harassment, what to do?','How do I save evidence?','Helpline numbers','Someone is threatening to leak my photos','Workplace harassment'],
  kb: [
    {k:'stalk follow following', a:'Stalking means following, contacting or monitoring a woman (online or offline) despite her clear disinterest — an offence under BNS S.78. Save evidence, tell someone you trust, and report to the police or call 181 / 112. If someone is following you right now, move to a crowded, lit place and call 112.'},
    {k:'leak photo video morph blackmail sextortion', a:'Do not pay and do not delete the chat. Take screenshots with dates and usernames, block the person, and report at cybercrime.gov.in or call 1930. You can use StopNCII.org to help stop intimate images spreading. Blackmail and sharing private images are crimes (BNS intimidation/voyeurism, IT Act S.66E/67). You are not at fault.'},
    {k:'harass harassment eve teasing comment touch', a:'Unwelcome comments, touching or sexual messages are punishable (BNS S.74, 75, 79). Note the date, place, and witnesses, report to police (a woman officer can take your statement) or call 181. In a college or workplace you can also complain to the Internal Committee under the POSH Act.'},
    {k:'evidence save proof screenshot record', a:'Keep everything: screenshots (showing number/name, date, time), call logs, voice notes, emails. Back them up to cloud/email. Keep a dated diary of incidents. Don’t confront the person; file a complaint and ask for your FIR copy.'},
    {k:'helpline number call', a:'112 Emergency • 181 Women Helpline • 1091 Women police helpline • 1930 Cyber fraud • 1098 Childline • 15100 Free legal aid • 14416 Tele-MANAS (mental health). Tap them in the Helplines tab.'},
    {k:'workplace office posh boss colleague', a:'Sexual harassment at work is covered by the POSH Act 2013. Complain in writing to your employer’s Internal Committee within 3 months of the incident (can be extended), or use SHe-Box. Retaliation is not allowed.'},
    {k:'domestic violence husband beat abuse dowry', a:'You do not deserve abuse. Call 181 or 112, or go to a One Stop Centre. The Domestic Violence Act 2005 can give protection orders and a right to stay in your home; BNS S.85 covers cruelty by husband or relatives. A legal aid lawyer is free — call 15100.'},
    {k:'cab taxi auto travel night alone', a:'Check the plate and driver in the app, sit behind the driver, share your live trip with someone you trust, keep your phone charged, and trust your instincts — get out in a safe, lit public place if something feels wrong.'},
    {k:'password account hacked instagram facebook fake profile', a:'Change your password, enable two-step verification, and log out other devices. Report the fake profile on the platform and file at cybercrime.gov.in. Keep screenshots of the profile and URL before it gets removed.'},
    {k:'self defence workshop class learn', a:'Check the Workshops tab: ask your police station or women’s help desk, your college NCC/NSS or women’s cell, or the district Women & Child Development office. Look for certified trainers who teach awareness and escape first.'},
    {k:'anxious scared depressed mental stress', a:'I’m sorry you’re going through this. You are not alone. Tele-MANAS (14416) offers free, confidential support 24×7 in many languages. Talking to someone you trust helps too. If you ever feel you might harm yourself, call 112 right away.'}
  ],
  hello: 'Hi, I’m here to help with safety questions, in confidence and without judgement. You can ask about harassment, online safety, evidence, or support services.'
};

/* ---------------- ANTI-RAGGING & CAMPUS SAFETY ---------------- */
const RAG = {
  learn: [
    {ic:'ban', t:'What counts as ragging?', s:'If it hurts, scares or humiliates — it is ragging.', full:[
      'Under the UGC Regulations on Curbing the Menace of Ragging (2009), ragging is <b>any conduct</b> that causes or is likely to cause physical or psychological harm, fear, shame or embarrassment to a student.',
      'It includes teasing, abuse, rowdy behaviour, forcing someone to do an act they would not normally do, or anything that affects their mental or physical wellbeing.',
      '“It’s tradition”, “it’s just fun” or “they agreed” does <b>not</b> make ragging acceptable. A fresher’s apparent consent is not a defence.']},
    {ic:'alert', t:'Common forms', s:'Recognise it early.', full:[
      '<b>Verbal:</b> insults, nicknames, humiliating questions, forced singing/dancing/“introductions”.',
      '<b>Physical:</b> slapping, forced exercise, standing for hours, depriving of food/sleep.',
      '<b>Financial/forced tasks:</b> forcing you to give money, buy things, do assignments or personal chores.',
      '<b>Sexual/gender-based:</b> unwanted touching, strip/dress-code demands, lewd comments.',
      '<b>Cyber:</b> abusive group chats, posting embarrassing photos, online threats.',
      '<b>Social:</b> isolation, threats to ostracise or harm career.']},
    {ic:'shield', t:'Your rights as a student', s:'The law is on your side.', full:[
      'Every student has the right to study and live on campus free from fear, humiliation and violence.',
      'Every institution must have an <b>Anti-Ragging Committee</b>, an <b>Anti-Ragging Squad</b>, and display helpline numbers and contact details prominently.',
      'Students and parents submit an <b>anti-ragging affidavit/undertaking</b> at admission.',
      'You can complain without fear. Institutions must protect complainants from retaliation and keep identities confidential where possible.',
      'You can approach <b>police</b> directly at any time; ragging can also be criminal (hurt, intimidation, wrongful restraint, sexual harassment).']},
    {ic:'scale', t:'Punishments', s:'Serious consequences for ragging.', full:[
      'Possible action by the college/university: suspension from classes, withholding of scholarships/results, debarring from exams, hostel expulsion, rustication, <b>expulsion</b>.',
      'FIR against the accused for offences under the criminal law (BNS) — and some states have their own anti-ragging acts.',
      'Responsibility also lies with the institution and sometimes with those who abet or stay silent.']},
    {ic:'users', t:'Bullying, intimidation, harassment', s:'Not only for freshers.', full:[
      '<b>Bullying:</b> repeated harmful behaviour (physical, verbal, online) by a person or group with more power.',
      '<b>Intimidation:</b> threats or pressure to force you to do or not do something.',
      '<b>Harassment:</b> unwelcome conduct (sexual, caste- or region-based, or personal) that creates a hostile environment.',
      'All can be reported through the same channels as ragging.']},
    {ic:'lock', t:'How to seek help safely', s:'You decide how, we help you stay safe.', full:[
      '1. Move away from the situation if you can, and stay near friends or a warden.',
      '2. Write down what happened (date, place, names/descriptions, witnesses) and keep chats or photos.',
      '3. Tell someone you trust: friend, senior, parent, mentor, warden.',
      '4. Report: use the <b>Report</b> tab here (you can stay anonymous), call the national helpline <b>1800-180-5522</b>, or tell the Anti-Ragging Squad/Dean/Proctor.',
      '5. If you are in danger or hurt: call <b>112</b> immediately.']}
  ],
  channels: [
    ['SurakshaSetu report (this app)','Use the Report tab. You may stay anonymous and get a tracking code. Admin forwards it for action.','shield','Report tab'],
    ['College Anti-Ragging Squad / Committee','Every institution must have one. Contact details must be on notice boards and the website. Ask the front office if you can’t find them.','school',''],
    ['Dean of Students / Proctor / Head of Institution','Written complaints go to the head of institution, who must act promptly and inform the police where an offence is made out.','badge',''],
    ['Hostel warden','For incidents in hostels, inform the warden and chief warden at once.','map',''],
    ['University Anti-Ragging Cell / Registrar','For college-level inaction, escalate to the affiliating university’s anti-ragging cell.','file',''],
    ['National Anti-Ragging Helpline 1800-180-5522','Toll-free, 24×7, in multiple languages. Also helpline@antiragging.in. The helpline records your complaint and alerts the institution and authorities.','phone','tel:18001805522'],
    ['Online complaint — antiragging.in','The UGC Anti-Ragging portal, where you can register a complaint, and the institution is notified.','laptop','https://www.antiragging.in'],
    ['Police — 112 or local station','Ragging can be a criminal offence. You can report directly to the police, and they must register a case for a cognizable offence.','siren','tel:112']
  ],
  quiz: [
    {q:'Seniors tell freshers to stand in a row and sing a humiliating song “for fun”.', a:0, e:'Forcing someone to do something that embarrasses them is ragging, even if framed as fun or tradition.'},
    {q:'A senior politely helps a fresher find the library and explains the course.', a:1, e:'This is friendly help, not ragging. Respectful interaction is welcome.'},
    {q:'A group repeatedly sends mocking memes about a first-year student in a class WhatsApp group.', a:0, e:'This is cyber-bullying and ragging. Screenshot it and report it.'},
    {q:'Seniors demand ₹500 from freshers for a “party fund” and threaten them if they refuse.', a:0, e:'Extorting money and threatening is ragging and also a criminal offence.'},
    {q:'A professor assigns a group project to all students in the class.', a:1, e:'Normal academic work, not ragging.'},
    {q:'A fresher “agrees” to do pushups at midnight because seniors insisted, so it’s okay.', a:0, e:'Consent obtained by pressure or fear is not a defence. It is still ragging.'},
    {q:'Seniors make a first-year student carry their bags and do their assignments.', a:0, e:'Forced chores or work are ragging.'},
    {q:'A student friendly-heartedly introduces himself to the new batch at an official, voluntary orientation.', a:1, e:'Voluntary, respectful orientation organised by the college is fine.'}
  ],
  videos: [
    ['oFYyjmU4hIM','UGC Anti-Ragging Monitoring Agency'],
    ['hxc8vpWjql8','UGC Anti-Ragging Monitoring Agency — awareness'],
    ['Jmt3AGNEP30','UGC Anti-Ragging Monitoring Agency — campaign']
  ],
  chips: ['What counts as ragging?','How do I report anonymously?','Helpline number','Will my identity be safe?','What happens to the seniors?','I am being bullied online'],
  kb: [
    {k:'what is ragging definition meaning count', a:'Ragging is any conduct that causes or is likely to cause physical or psychological harm, fear, shame or embarrassment to a student — including teasing, abuse, forced tasks, humiliation, threats and cyber-bullying. “Tradition” or “fun” is no defence, and neither is consent given under pressure.'},
    {k:'anonymous anonymity identity confidential safe', a:'In the Report tab, switch on “Report anonymously”. We will not link the report to your account or store contact details, and you receive a tracking code to check the status. The national helpline (1800-180-5522) can also take complaints; ask them about confidentiality.'},
    {k:'helpline number call toll free', a:'National Anti-Ragging Helpline: 1800-180-5522 (toll-free, 24×7), email helpline@antiragging.in, or register online at antiragging.in. If you are in danger, call 112.'},
    {k:'report complain complaint how', a:'You can: (1) use the Report tab in this app (anonymous option available), (2) call 1800-180-5522, (3) tell the college Anti-Ragging Squad/Dean/Proctor/warden in writing, or (4) go to the police. Keep screenshots or notes of what happened.'},
    {k:'punish punishment action seniors accused expel', a:'Institutions can suspend, debar from exams, withhold results or scholarships, expel from hostel, rusticate or expel. Police can register an FIR for criminal offences, and the institution may also be held responsible if it ignores complaints.'},
    {k:'cyber online bully whatsapp chat meme', a:'Online ragging/bullying is covered too. Do not reply, take screenshots with dates and usernames, block and report. You can complain to the Anti-Ragging Squad and to cybercrime.gov.in (or 1930 for money-related fraud).'},
    {k:'scared afraid fear retaliation threat', a:'Your fear is valid. Retaliation against a complainant is itself punishable and institutions must protect you. Use the anonymous option, tell a trusted person, and if you are being threatened call 112. Tele-MANAS (14416) offers free confidential support for stress.'},
    {k:'bullying intimidation harassment difference', a:'Bullying = repeated harm by someone with more power; intimidation = threats to force you; harassment = unwelcome conduct (sexual, caste/region, personal). All can be reported via the same channels as ragging.'},
    {k:'parent affidavit undertaking admission rules', a:'At admission both student and parent sign an anti-ragging undertaking. Colleges must display the Anti-Ragging Committee/Squad details and the national helpline on campus and the website, and conduct awareness programmes.'},
    {k:'fresher freshers orientation welcome', a:'Voluntary, college-organised, respectful orientations are fine. If a “welcome” involves compulsion, humiliation or private after-hours gatherings by seniors, that is ragging — you may refuse and report it.'}
  ],
  hello: 'Hello! I’m here to help you understand ragging and how to get help safely. Everything you ask here stays private. What’s on your mind?'
};

/* animated posters */
const POSTERS = {
  road: [
    {k:'ROAD SAFETY', h:'Helmet on. Life on.', p:'A helmet takes a second to wear and can save a lifetime. Riders and pillions, every ride.', t:'#WearTheHelmet', ic:'helmet', c:['#ff7a18','#af002d']},
    {k:'EVERY TRIP', h:'Click it before you kick it.', p:'Buckle up on every seat. A seat belt takes 3 seconds and can halve the risk of death.', t:'#BuckleUp', ic:'car', c:['#1565c0','#00bcd4']},
    {k:'PEDESTRIANS FIRST', h:'Zebra crossing is for people.', p:'Slow down. Give way. Behind every crossing is someone who wants to get home.', t:'#GiveWay', ic:'users', c:['#11998e','#38ef7d']},
    {k:'DON’T DRINK & DRIVE', h:'One drink too many. One life too few.', p:'If you drink, don’t drive. Call a friend, cab or driver.', t:'#SoberDriving', ic:'ban', c:['#c31432','#240b36']},
    {k:'SLOW DOWN', h:'Someone is waiting for you.', p:'Arrive late, not never. Speed limits protect you, and everyone else.', t:'#ArriveAlive', ic:'clock', c:['#f7971e','#ff512f']}
  ],
  rag: [
    {k:'ZERO TOLERANCE', h:'Say NO to ragging.', p:'Welcome freshers with respect, not fear. Ragging hurts, and it’s a crime.', t:'#NoRagging', ic:'ban', c:['#7f00ff','#e100ff']},
    {k:'SPEAK UP', h:'Silence protects the bully.', p:'Report ragging: 1800-180-5522, toll-free, 24×7. You can stay anonymous.', t:'#SpeakUp', ic:'mega', c:['#00c6ff','#0072ff']},
    {k:'BE A FRIEND', h:'Be a senior, not a scary one.', p:'Help freshers settle in. Share notes, show the campus, be the person you wish you had.', t:'#FriendlyCampus', ic:'heart', c:['#ff5f6d','#ffc371']},
    {k:'KNOW THE LAW', h:'Ragging = suspension, expulsion, FIR.', p:'No tradition justifies hurting someone. Think before you act.', t:'#ThinkBeforeYouAct', ic:'scale', c:['#232526','#414345']},
    {k:'SAFE CAMPUS', h:'Everyone belongs here.', p:'A safe campus is built by every student, every day. Be an ally.', t:'#SafeCampus', ic:'shield', c:['#11998e','#38ef7d']}
  ]
};
