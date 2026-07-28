export type TeamCategory =
  | 'Medical & Family Care'
  | 'Child Development & Learning'
  | 'Movement & Physical Wellness'
  | 'Nutrition & Feeding Support'
  | 'Emotional & Social Support'
  | 'Support Team'

export interface TeamMember {
  slug: string
  name: string
  role: string
  category: TeamCategory
  photo: string | null
  tagline: string
  bio: string
  owner?: boolean
  /** context phrase used in the WhatsApp booking message; omit for non-bookable support staff */
  bookable?: string
}

export const teamCategories: TeamCategory[] = [
  'Medical & Family Care',
  'Child Development & Learning',
  'Movement & Physical Wellness',
  'Nutrition & Feeding Support',
  'Emotional & Social Support',
  'Support Team'
]

const img = (slug: string) => `/team/${slug}.webp`

export const team: TeamMember[] = [
  // ───────────────────────── Medical & Family Care ─────────────────────────
  {
    slug: 'andrea-swart',
    name: 'Andrea Swart',
    role: 'Registered Nurse & Co-Owner',
    category: 'Medical & Family Care',
    photo: img('andrea-swart'),
    owner: true,
    bookable: 'nursing care with Andrea Swart',
    tagline: 'Award-winning nurse and midwife supporting moms through every stage of motherhood.',
    bio: 'Andrea is an award-winning registered nurse and midwife, and co-owner of Our Village. Through her work with Seek First Clinic she is passionate about walking alongside mothers and babies — from pregnancy and birth to those precious early years — with warmth, expertise and genuine care.'
  },
  {
    slug: 'suzanne-de-beer',
    name: 'Suzanne de Beer',
    role: 'Baby Hydrotherapist & Co-Owner',
    category: 'Medical & Family Care',
    photo: img('suzanne-de-beer'),
    owner: true,
    bookable: 'baby hydrotherapy with Suzanne de Beer',
    tagline: 'Founder of LumiFloat, offering nurturing hydrotherapy for infant wellness.',
    bio: 'Suzanne is the founder of LumiFloat and co-owner of Our Village. She offers gentle, nurturing baby hydrotherapy and infant massage that supports development, relaxation and bonding — helping little ones (and their parents) thrive.'
  },
  {
    slug: 'dr-natasha-bartie',
    name: 'Dr. Natasha Bartie',
    role: 'General Practitioner',
    category: 'Medical & Family Care',
    photo: img('dr-natasha-bartie'),
    bookable: 'a GP consultation with Dr. Natasha Bartie',
    tagline: 'Compassionate, comprehensive family medical care across every stage of life.',
    bio: 'Dr. Natasha Bartie provides comprehensive, compassionate family medical care for patients of all ages — combining clinical excellence with a warm, personal approach that puts families at ease.'
  },
  {
    slug: 'megan-duvenhage',
    name: 'Megan Duvenhage',
    role: 'Genetic Counsellor',
    category: 'Medical & Family Care',
    photo: img('megan-duvenhage'),
    bookable: 'a genetic counselling session with Megan Duvenhage',
    tagline: 'Making complex genetic information accessible, understandable and empowering.',
    bio: 'Megan is a Genetic Counsellor dedicated to helping individuals and families understand the role genetics plays in their health and well-being. With advanced training in Human Genetics and Genetic Counselling, she provides support across prenatal care, paediatrics, oncology, neurology, haematology and ophthalmology. Megan is passionate about making complex genetic information accessible and relevant, empowering patients to make informed decisions with confidence through a compassionate, personalised approach.'
  },
  {
    slug: 'danielle-skinner',
    name: 'Danielle Skinner',
    role: 'Registered Nurse | Wound Care Specialist',
    category: 'Medical & Family Care',
    photo: img('danielle-skinner'),
    bookable: 'wound care with Danielle Skinner',
    tagline: 'Evidence-based wound care that heals the whole person, not just the condition.',
    bio: 'Danielle is a Registered Professional Nurse with a special interest in wound care, skin integrity, and maternal and child health. With over six years of experience and advanced training in wound management through both local and international institutions, she provides evidence-based, patient-centred care that focuses on healing the whole person. Danielle is passionate about supporting babies, children and mothers through every stage of care, helping patients navigate complex wound management with confidence and dignity.'
  },
  {
    slug: 'brumilda-bylsma',
    name: 'Sr Brümilda Bylsma',
    role: 'Registered Nurse & Midwife',
    category: 'Medical & Family Care',
    photo: img('brumilda-bylsma'),
    bookable: 'a baby clinic visit with Sr Brümilda Bylsma',
    tagline: 'Holistic care for mothers and babies through every precious milestone.',
    bio: 'Sr Brümilda is a Registered Nurse and Midwife with a passion for supporting mothers, babies and families through every stage of their journey. With nine years of experience and additional qualifications in maternal care, dispensing, and occupational health and safety, she provides compassionate, holistic care. Her areas of expertise include antenatal care, birth support, immunisations, infant growth and development, and ongoing baby care. Brümilda considers it a privilege to walk alongside families during some of life’s most precious moments.'
  },
  {
    slug: 'dr-nicole-louw',
    name: 'Dr Nicole Louw',
    role: 'Paediatric Chiropractor',
    category: 'Medical & Family Care',
    photo: img('dr-nicole-louw'),
    bookable: 'a chiropractic session with Dr Nicole Louw',
    tagline: 'Gentle, holistic chiropractic care for babies and children.',
    bio: 'With over 14 years of experience, Dr Nicole Louw provides gentle, holistic paediatric chiropractic care — supporting little ones with colic, reflux, sleeplessness and overall wellbeing through safe, nurturing treatment.'
  },

  // ──────────────────── Child Development & Learning ────────────────────
  {
    slug: 'dr-celiane-van-der-westhuizen',
    name: 'Dr. Celiané van der Westhuizen',
    role: 'Occupational Therapist',
    category: 'Child Development & Learning',
    photo: img('dr-celiane-van-der-westhuizen'),
    bookable: 'occupational therapy with Dr. Celiané van der Westhuizen',
    tagline: 'Paediatric OT with a doctorate and advanced training in autism and sensory integration.',
    bio: 'Dr. Celiané van der Westhuizen is a paediatric Occupational Therapist with a doctorate in occupational therapy and advanced training in autism and sensory integration. She supports early childhood development, functional independence and school readiness through play-based, evidence-led care.'
  },
  {
    slug: 'monique-van-der-merwe',
    name: 'Monique van der Merwe',
    role: 'Speech Therapist',
    category: 'Child Development & Learning',
    photo: img('monique-van-der-merwe'),
    bookable: 'speech therapy with Monique van der Merwe',
    tagline: 'Supporting early communication, cleft-related and feeding challenges.',
    bio: 'Monique supports early communication, cleft-related and feeding challenges with evidence-based care. Through Spique Speech Therapy she helps children find their voice and families feel supported every step of the way.'
  },
  {
    slug: 'cassandra-ruysch',
    name: 'Cassandra Ruysch',
    role: 'Educational Psychologist',
    category: 'Child Development & Learning',
    photo: img('cassandra-ruysch'),
    bookable: 'an educational psychology session with Cassandra Ruysch',
    tagline: 'Helping children, teens and families reach their full potential.',
    bio: 'Cassandra is an Educational Psychologist dedicated to helping children, adolescents and families navigate learning, behavioural and emotional challenges. With a Master’s Degree in Psychology (Cum Laude) and a passion for supporting neurodivergent individuals, she creates a safe and collaborative space where clients can better understand themselves, develop resilience and reach their full potential. Her approach is grounded in empathy, connection, and the belief that meaningful growth happens through relationships.'
  },
  {
    slug: 'corneli-oosthuizen',
    name: 'Corneli Oosthuizen',
    role: 'Educational Psychologist',
    category: 'Child Development & Learning',
    photo: img('corneli-oosthuizen'),
    bookable: 'an educational psychology session with Corneli Oosthuizen',
    tagline: 'Body-based, neuroscience-informed support for lasting healing and growth.',
    bio: 'Corneli is an Educational Psychologist with over eight years of experience supporting children, adolescents and families through emotional, behavioural and learning challenges. With a special interest in trauma, she conducts comprehensive psycho-educational assessments and tailors therapy to each client, combining evidence-based interventions with a deep understanding of how the mind and body work together. Her body-based, neuroscience-informed approach helps clients process experiences in a way that supports lasting healing and growth.'
  },
  {
    slug: 'jessica-van-wyk',
    name: 'Jessica van Wyk',
    role: 'Baby & Toddler Stimulation Facilitator',
    category: 'Child Development & Learning',
    photo: img('jessica-van-wyk'),
    bookable: 'a baby stimulation class with Jessica van Wyk',
    tagline: 'Play-based stimulation classes where babies develop and moms find their village.',
    bio: 'Jessica is the Pienkvoet-Pret facilitator for Faerie Glen, offering play-based stimulation and development classes for babies and toddlers. She holds a B.Ed degree and spent twelve years as a Foundation Phase teacher before becoming a mom to her son Daniël — the year she first fell in love with Pienkvoet-Pret as a parent herself. Her weekly 90-minute classes are grouped by age from three months to three years, weaving together sensory play, fine and gross motor activities, music and movement, rhymes and language development, baby massage and a love of reading. Just as importantly, Jessica creates a safe, unhurried space where moms can simply be themselves and find their own village of support.'
  },

  // ─────────────────── Movement & Physical Wellness ───────────────────
  {
    slug: 'lindi-cilliers',
    name: 'Lindi Cilliers',
    role: 'Physiotherapist',
    category: 'Movement & Physical Wellness',
    photo: img('lindi-cilliers'),
    bookable: 'physiotherapy with Lindi Cilliers',
    tagline: 'OMT-qualified physio skilled in pain management, rehab and women’s health.',
    bio: 'Lindi is an OMT-qualified physiotherapist skilled in pain management, rehabilitation and women’s health — providing hands-on, personalised care to help you move with comfort and rebuild strength at every stage of life.'
  },
  {
    slug: 'michelene-du-randt',
    name: 'Michelene du Randt',
    role: 'Physiotherapist',
    category: 'Movement & Physical Wellness',
    photo: img('michelene-du-randt'),
    bookable: 'physiotherapy with Michelene du Randt',
    tagline: 'Paediatric and women’s health physiotherapy, respiratory rehab and pelvic care.',
    bio: 'Michelene is a physiotherapist focused on paediatric and women’s health physiotherapy, respiratory rehabilitation and pelvic dysfunction — supporting patients from tiny babies to adults with compassionate, hands-on care.'
  },

  // ─────────────────────── Nutrition & Feeding Support ───────────────────────
  {
    slug: 'amorie-liebenberg',
    name: 'Amorie Liebenberg',
    role: 'Registered Dietitian & Certified Lactation Consultant',
    category: 'Nutrition & Feeding Support',
    photo: img('amorie-liebenberg'),
    bookable: 'nutrition or lactation support with Amorie Liebenberg',
    tagline: 'Compassionate, evidence-based nutrition and lactation care for the whole family.',
    bio: 'Amorie is a Registered Dietitian and Certified Lactation Consultant, and the founder of Rooted Willow Dietitians. She is passionate about providing compassionate, evidence-based nutrition care, empowering individuals and families with practical guidance to build healthy, sustainable lifestyles.'
  },

  // ─────────────────────── Emotional & Social Support ───────────────────────
  {
    slug: 'alicia-coertze',
    name: 'Alicia Coertze',
    role: 'Counselling Psychologist',
    category: 'Emotional & Social Support',
    photo: img('alicia-coertze'),
    bookable: 'a counselling session with Alicia Coertze',
    tagline: 'A warm, person-centred space for adolescents and adults.',
    bio: 'Alicia is a Counselling Psychologist who provides a warm, compassionate and collaborative space for adolescents and adults navigating life’s challenges — including anxiety, depression, trauma, grief, burnout, relationship difficulties, life transitions and self-esteem. Her approach is deeply person-centred, grounded in the belief that healing begins when people feel genuinely seen, heard and understood. She combines empathy with evidence-based techniques, tailoring each session to her clients’ unique needs, strengths and goals.'
  },
  {
    slug: 'rachael-anne-johnston',
    name: 'Rachael Anne Johnston',
    role: 'Social Worker | Play-Based Intervention',
    category: 'Emotional & Social Support',
    photo: img('rachael-anne-johnston'),
    bookable: 'a session with Rachael Anne Johnston',
    tagline: 'Play-based intervention for children, teens and families.',
    bio: 'Rachael is a Social Worker with over nine years of experience supporting children, teenagers and families through life’s challenges. Specialising in play-based intervention, she creates a safe and engaging environment where young people can express themselves, process difficult experiences and develop healthy emotional skills. Her holistic, family-centred approach — collaborating with parents, caregivers and teachers — helps children build resilience, strengthen relationships and navigate challenges with confidence.'
  },
  {
    slug: 'heidi-malan',
    name: 'Heidi Malan',
    role: 'Parental Guidance Facilitator',
    category: 'Emotional & Social Support',
    photo: img('heidi-malan'),
    bookable: 'a parental guidance session with Heidi Malan',
    tagline: 'Teaching communication skills to parents, teachers and leaders.',
    bio: 'Heidi is a Parental Guidance Facilitator who teaches practical communication skills to parents, teachers and leaders — helping the adults around a child create calmer, more connected relationships.'
  },
  {
    slug: 'nicole-van-niekerk',
    name: 'Nicole van Niekerk',
    role: 'Registered Counsellor',
    category: 'Emotional & Social Support',
    photo: img('nicole-van-niekerk'),
    bookable: 'a counselling session with Nicole van Niekerk',
    tagline: 'Art, play and mindfulness to support trauma healing and wellbeing.',
    bio: 'Nicole integrates art, play and mindfulness to support trauma healing and emotional wellbeing — creating a gentle, creative space where children and adults can process and grow.'
  },

  // ────────────────────────────── Support Team ──────────────────────────────
  {
    slug: 'dudu-receptionist',
    name: 'Dudu',
    role: 'Receptionist',
    category: 'Support Team',
    photo: img('dudu-receptionist'),
    tagline: 'One of the friendly faces that makes Our Village feel like home.',
    bio: 'Dudu is one of the friendly faces that makes Our Village feel like home. Known for her warm personality, helpful nature and genuine kindness, she has a special way of making every visitor feel welcomed and cared for — whether she’s assisting with appointments, answering questions or helping patients find their way.'
  },
  {
    slug: 'beauty-office-assistant',
    name: 'Beauty',
    role: 'Cleaner & Office Assistant',
    category: 'Support Team',
    photo: img('beauty-office-assistant'),
    tagline: 'Keeping Our Village warm, welcoming and beautifully cared for.',
    bio: 'Beauty is an essential part of the Our Village team, helping to create the warm, welcoming and professional environment our patients and practitioners enjoy every day. With a cheerful attitude, strong work ethic and a heart for service, she ensures our spaces remain clean, organised and comfortable for everyone who visits.'
  }
]

export const teamBySlug = (slug: string) => team.find((m) => m.slug === slug)
