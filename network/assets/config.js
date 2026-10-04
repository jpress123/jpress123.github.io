/* SUES Design Network: site configuration.
   Edit this file to connect backends and to replace placeholder labels.
   Every page loads it before site.js. */
window.SUES_CONFIG = {
  siteName: 'SUES Design Network',
  siteNameZh: 'SUES 设计网络',
  canonicalBase: 'https://www.sues.design/network/',

  /* Backends. Leave empty until connected; the site then explains that the
     form is saved on this device only. */
  subscribeEndpoint: '',   // email platform form action (POST, field: email)
  formEndpoint: '',        // member portal backend (POST JSON)
  contactEmail: '',        // editor inbox used as a fallback route

  dataLicence: 'Data licence to be confirmed (proposed: Creative Commons Attribution 4.0)',
  dataLicenceZh: '数据许可待定（建议：知识共享署名 4.0）',

  sectors: ['Renewable energy', 'Conscious consumption', 'Circular manufacturing', 'Community choices'],
  sectorsZh: ['可再生能源', '有意识消费', '循环制造', '社区选择'],
  solutions: ['Materials', 'Production', 'Agriculture', 'Construction'],
  solutionsZh: ['材料', '生产', '农业', '建造'],

  /* DSF zones. PLACEHOLDER labels built from the two axes. Replace with the
     labels used in Designing Sustainable Futures. */
  dsfZones: {
    'local-collective':   { en: 'Community commons',  zh: '社区共享', x: 'local',  y: 'collective' },
    'global-collective':  { en: 'Shared systems',     zh: '共享系统', x: 'global', y: 'collective' },
    'local-individual':   { en: 'Self-provision',     zh: '自给自足', x: 'local',  y: 'individual' },
    'global-individual':  { en: 'Conscious markets',  zh: '责任市场', x: 'global', y: 'individual' }
  },
  dsfZonesArePlaceholders: true,

  strengths: {
    weak:     { en: 'Early',        zh: '早期' },
    emerging: { en: 'Emerging',     zh: '兴起' },
    strong:   { en: 'Accelerating', zh: '加速' }
  },

  storyStatuses: ['Idea', 'Pilot', 'Operating', 'Scaling', 'Paused', 'Closed'],
  opportunityStatuses: ['Open', 'Matched', 'In conversation', 'Piloting', 'Closed'],
  eventTypes: ['conference', 'workshop', 'webinar', 'field visit', 'exhibition', 'call', 'deadline', 'competition', 'network event'],

  /* Twelve-month success measures (proposed). */
  targets: { signals: 500, stories: 40, experts: 60, matched: 15, subscribers: 1000 }
};
