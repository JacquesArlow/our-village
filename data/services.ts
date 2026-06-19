import type { TeamCategory } from './team'

export interface Service {
  name: string
  description: string
}

export interface ServiceCategory {
  key: string
  /** matches a TeamCategory so we can show the right practitioners */
  category: TeamCategory
  title: string
  intro: string
  image: string
  services: Service[]
}

export const serviceCategories: ServiceCategory[] = [
  {
    key: 'medical',
    category: 'Medical & Family Care',
    title: 'Medical & Family Care',
    intro:
      'Our Village brings together trusted professionals to care for moms, babies and families. From newborn check-ups and baby wellness to chiropractic care, our clinic services provide the reassurance and support you need — all in one welcoming space.',
    image: '/services/baby-family-clinic.jpg',
    services: [
      { name: 'Baby & Family Clinic', description: 'Well-baby checks, vaccinations, antenatal and postnatal support, and sick visits.' },
      { name: 'Nursing Care', description: 'Hands-on, compassionate care for babies, young children and moms.' },
      { name: 'Hydrotherapy', description: 'Gentle water-based sessions to support baby development and wellness.' },
      { name: 'Chiropractic', description: 'Gentle, holistic care for colic, reflux, sleeplessness and overall wellbeing in little ones.' },
      { name: 'Genetic Counselling', description: 'Guidance on prenatal, paediatric and family genetic health to support informed decisions.' }
    ]
  },
  {
    key: 'development',
    category: 'Child Development & Learning',
    title: 'Child Development & Learning',
    intro:
      'Every child develops in their own way. Our therapists provide play-based, evidence-led support to help children communicate, learn and build the skills they need to thrive at home and at school.',
    image: '/services/occupational-therapy.jpg',
    services: [
      { name: 'Occupational Therapy', description: 'Early childhood development, sensory integration and play-based support for independence and school readiness.' },
      { name: 'Speech Therapy', description: 'Communication therapy plus feeding support — breastfeeding, bottle feeding and early feeding transitions.' },
      { name: 'Educational Psychology', description: 'Psycho-educational assessments, parental guidance, play therapy / CBT, and school readiness & accommodations.' }
    ]
  },
  {
    key: 'movement',
    category: 'Movement & Physical Wellness',
    title: 'Movement & Physical Wellness',
    intro:
      'From tiny babies to adults, movement is key to health and wellbeing. Our therapists provide hands-on care and personalised support to help you move with comfort, recover from injury or illness, and build strength at every stage of life.',
    image: '/services/chiropractic.jpg',
    services: [
      { name: 'Physiotherapy', description: 'Paediatric, women’s health, respiratory and cardiorespiratory rehab, pain management and pelvic dysfunction.' },
      { name: 'Biokinetics', description: 'Safe, guided exercise for pre/postnatal fitness, orthopaedic rehabilitation and overall strength.' }
    ]
  },
  {
    key: 'nutrition',
    category: 'Nutrition & Feeding Support',
    title: 'Nutrition & Feeding Support',
    intro:
      'Good nutrition shapes health for life. We support families through every feeding and nutrition journey — from pregnancy and infant feeding to family nutrition and chronic conditions.',
    image: '/services/dietetics.jpg',
    services: [
      { name: 'Dietetics & Nutrition', description: 'Guidance for fertility, pregnancy, postpartum, family nutrition, gut health, weight management and chronic conditions.' },
      { name: 'Lactation & Feeding Support', description: 'Breastfeeding, bottle feeding and early feeding transitions, with caring expert guidance.' }
    ]
  },
  {
    key: 'emotional',
    category: 'Emotional & Social Support',
    title: 'Emotional & Social Support',
    intro:
      'Emotional wellbeing is just as important as physical health. We offer a safe, supportive space where children, parents and families can work through challenges, build resilience and strengthen relationships using evidence-based approaches.',
    image: '/services/counselling.jpg',
    services: [
      { name: 'Counselling & Psychology', description: 'Support for individuals, couples, teens and families; therapy for trauma, relationships and resilience-building.' },
      { name: 'Social Work', description: 'Play therapy, divorce and grief counselling, socio-emotional assessments, trauma counselling and family interventions.' }
    ]
  }
]
