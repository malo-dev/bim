export const slides = [
  {
    id: 1,
    title: "Bienvenue sur BIM NEXT",
    description: "Découvrez le réseau où vous achetez, exposez vos produits et profitez de réductions exclusives, partout et dans tous les domaines.",
    type: "image",
    // source: require("../onb.mp4"),

    source: require("../images/logo.jpeg"),
  },
  {
  id: 2,
  title: "BIM NEXT : UN RÉSEAU TRANSACTIONNEL",
  description: "Rejoignez un réseau unique pour acheter, exposer vos produits et bénéficier d’avantages exclusifs dans de nombreux secteurs.",
  type: "image",
  source: require("../images/rafiki.png"), // illustration achat direct
}
,
  {
    id: 3,
    title: "Achetez directement chez nos partenaires",
    description: "Accédez facilement aux produits de nos partenaires et payez en toute sécurité, sans intermédiaire.",
    type: "image",
    source: require("../images/onboarding3.png"), // illustration achat direct
  },
  {
    id: 4,
    title: "Exposez vos produits et services",
    description: "Mettez vos offres en avant pour toucher davantage de clients et booster votre visibilité.",
    type: "image",
    source: require("../images/onboarding4.png"), // illustration exposition
  },
  {
    id: 5,
    title: "Profitez de réductions dans tous les secteurs",
    description: "Supermarchés, transport, carburant, santé, assurances et bien plus encore, directement depuis l’application.",
    type: "image",
    source: require("../images/onboarding2.png"), // illustration réductions
  },
];




export const sectors = [
   // ================= SANTÉ =================
  {
    id: "1",
    name: "BIM Santé",
    description: "Services médicaux, cliniques et pharmacies.",
    logo: "https://cdn-icons-png.flaticon.com/512/2966/2966486.png",
    companies: [
      { id: "1", name: "Clinique Espoir", description: "Consultations et soins généraux.", logo: "https://cdn-icons-png.flaticon.com/512/2966/2966486.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "Pharmacie Centrale", description: "Médicaments certifiés.", logo: "https://cdn-icons-png.flaticon.com/512/4320/4320372.png", location: "Kinshasa, Kintambo" },
      { id: "3", name: "Hôpital Lumière", description: "Urgences et chirurgie.", logo: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png", location: "Kinshasa, Ngaliema" },
      { id: "4", name: "Centre Vita", description: "Analyses médicales.", logo: "https://cdn-icons-png.flaticon.com/512/1687/1687035.png", location: "Kinshasa, Bandalungwa" },
      { id: "5", name: "MediCare Plus", description: "Soins spécialisés.", logo: "https://cdn-icons-png.flaticon.com/512/2966/2966486.png", location: "Kinshasa, Limete" },
    ],
  },

  // ================= TRANSPORT =================
  {
    id: "2",
    name: "BIM Transport",
    description: "Bus, taxis et livraison.",
    logo: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
    companies: [
      { id: "1", name: "City Bus", description: "Transport urbain.", logo: "https://cdn-icons-png.flaticon.com/512/854/854878.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "Taxi Express", description: "Taxi rapide.", logo: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png", location: "Kinshasa, Limete" },
      { id: "3", name: "MoveGo", description: "Transport privé.", logo: "https://cdn-icons-png.flaticon.com/512/744/744465.png", location: "Kinshasa, Bandalungwa" },
      { id: "4", name: "Quick Delivery", description: "Livraison colis.", logo: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png", location: "Kinshasa, Kintambo" },
      { id: "5", name: "Cargo RDC", description: "Transport marchandises.", logo: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png", location: "Kinshasa, Ngaliema" },
    ],
  },

  // ================= ÉNERGIES =================
  {
    id: "3",
    name: "BIM Énergies",
    description: "Électricité, solaire et solutions énergétiques.",
    logo: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png",
    companies: [
      { id: "1", name: "Solar RDC", description: "Installation panneaux solaires.", logo: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "PowerTech", description: "Maintenance réseaux électriques.", logo: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png", location: "Kinshasa, Kintambo" },
      { id: "3", name: "Green Energy", description: "Solutions énergie renouvelable.", logo: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png", location: "Kinshasa, Ngaliema" },
      { id: "4", name: "Electro Plus", description: "Matériel électrique.", logo: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png", location: "Kinshasa, Bandalungwa" },
      { id: "5", name: "SunLight Africa", description: "Éclairage solaire.", logo: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png", location: "Kinshasa, Limete" },
    ],
  },

  // ================= CARBURANT =================
  {
    id: "4",
    name: "BIM Carburant",
    description: "Stations-service et distribution de carburant.",
    logo: "https://cdn-icons-png.flaticon.com/512/908/908286.png",
    companies: [
      { id: "1", name: "Petro RDC", description: "Station-service moderne.", logo: "https://cdn-icons-png.flaticon.com/512/908/908286.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "Total Energy Plus", description: "Carburant et lubrifiants.", logo: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png", location: "Kinshasa, Limete" },
      { id: "3", name: "Fuel Express", description: "Vente carburant rapide.", logo: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png", location: "Kinshasa, Bandalungwa" },
      { id: "4", name: "Oil Center", description: "Distribution carburant.", logo: "https://cdn-icons-png.flaticon.com/512/908/908286.png", location: "Kinshasa, Kintambo" },
      { id: "5", name: "Gas Africa", description: "Solutions carburant.", logo: "https://cdn-icons-png.flaticon.com/512/908/908286.png", location: "Kinshasa, Ngaliema" },
    ],
  },

  // ================= HÔTELLERIE =================
  {
    id: "5",
    name: "BIM Hôtellerie",
    description: "Hôtels, lodges et maisons d’hôtes.",
    logo: "https://cdn-icons-png.flaticon.com/512/139/139899.png",
    companies: [
      { id: "1", name: "Hotel Royal", description: "Hôtel 4 étoiles.", logo: "https://cdn-icons-png.flaticon.com/512/139/139899.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "Grand Palace", description: "Hébergement de luxe.", logo: "https://cdn-icons-png.flaticon.com/512/139/139899.png", location: "Kinshasa, Limete" },
      { id: "3", name: "Comfort Inn", description: "Chambres confortables.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Bandalungwa" },
      { id: "4", name: "Blue Sky Lodge", description: "Lodge touristique.", logo: "https://cdn-icons-png.flaticon.com/512/139/139899.png", location: "Kinshasa, Kintambo" },
      { id: "5", name: "Safari Hotel", description: "Hébergement voyageurs.", logo: "https://cdn-icons-png.flaticon.com/512/139/139899.png", location: "Kinshasa, Ngaliema" },
    ],
  },

  // ================= GAZ =================
  {
    id: "6",
    name: "BIM Gaz",
    description: "Distribution et vente de gaz domestique et industriel.",
    logo: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png",
    companies: [
      { id: "1", name: "Gaz RDC", description: "Gaz domestique et industriel.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png", location: "Kinshasa, Gombe" },
      { id: "2", name: "Blue Flame", description: "Bouteilles de gaz certifiées.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png", location: "Kinshasa, Limete" },
      { id: "3", name: "Total Gaz Services", description: "Distribution de gaz.", logo: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png", location: "Kinshasa, Bandalungwa" },
      { id: "4", name: "EcoGaz", description: "Solutions énergétiques propres.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png", location: "Kinshasa, Kintambo" },
      { id: "5", name: "Smart Gaz", description: "Vente et livraison gaz.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png", location: "Kinshasa, Ngaliema" },
    ],
  },

  // ================= BIM ÉDUCATION =================
{
  id: "6",
  name: "BIM Éducation",
  description: "Écoles et formations.",
  logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  companies: [
    { id: "1", name: "École Lumière", description: "Éducation primaire et secondaire.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "Académie RDC", description: "Formation professionnelle.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Institut Supérieur", description: "Enseignement supérieur.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "Centre de Formation Tech", description: "Cours en informatique et technologie.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "Université Vision", description: "Université privée.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM COMMERCE =================
{
  id: "7",
  name: "BIM Commerce",
  description: "Boutiques et supermarchés.",
  logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
  companies: [
    { id: "1", name: "Supermarché Central", description: "Produits alimentaires et divers.", logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "Boutique Luxe", description: "Vêtements et accessoires.", logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Marché Populaire", description: "Épicerie et produits locaux.", logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "Centre Commercial RDC", description: "Magasins divers.", logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "Boutique Tech", description: "Vente de gadgets et équipements électroniques.", logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM AGRICULTURE =================
{
  id: "8",
  name: "BIM Agriculture",
  description: "Production agricole.",
  logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png",
  companies: [
    { id: "1", name: "Ferme Bio RDC", description: "Production de légumes bio.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "AgriTech", description: "Solutions agricoles innovantes.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Plantations Vertes", description: "Culture de fruits et légumes.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "RDC Agro", description: "Production et distribution.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "Fermiers Associés", description: "Coopérative agricole.", logo: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM TÉLÉCOMS =================
{
  id: "9",
  name: "BIM Télécoms",
  description: "Internet et téléphonie.",
  logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png",
  companies: [
    { id: "1", name: "RDC Telecom", description: "Fournisseur internet.", logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "Mobile Connect", description: "Téléphonie mobile.", logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Net RDC", description: "Internet haut débit.", logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "TeleLink", description: "Solutions télécom.", logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "Fiber RDC", description: "Fibre optique.", logo: "https://cdn-icons-png.flaticon.com/512/483/483947.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM FINANCE =================
{
  id: "10",
  name: "BIM Finance",
  description: "Paiements et crédits.",
  logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png",
  companies: [
    { id: "1", name: "Banque RDC", description: "Services bancaires.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "EcoPay", description: "Paiements numériques.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Microfinance Plus", description: "Crédit et microfinance.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "FinTech RDC", description: "Solutions financières innovantes.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "Credit Express", description: "Prêts rapides.", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM IMMOBILIER =================
{
  id: "11",
  name: "BIM Immobilier",
  description: "Location et vente.",
  logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png",
  companies: [
    { id: "1", name: "Immo RDC", description: "Vente d’appartements.", logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "Location Express", description: "Location rapide.", logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Maison Luxe", description: "Ventes immobilières de luxe.", logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "Appartements Plus", description: "Locations pour particuliers.", logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "ImmoInvest", description: "Investissement immobilier.", logo: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", location: "Kinshasa, Kintambo" },
  ],
},

// ================= BIM MARKETING =================
{
  id: "12",
  name: "BIM Marketing",
  description: "Publicité digitale.",
  logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png",
  companies: [
    { id: "1", name: "PubTech RDC", description: "Marketing digital et SEO.", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png", location: "Kinshasa, Gombe" },
    { id: "2", name: "Ad Solutions", description: "Publicité et campagnes.", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png", location: "Kinshasa, Limete" },
    { id: "3", name: "Digital RDC", description: "Marketing sur réseaux sociaux.", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png", location: "Kinshasa, Ngaliema" },
    { id: "4", name: "Creative Ads", description: "Création de contenus publicitaires.", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png", location: "Kinshasa, Bandalungwa" },
    { id: "5", name: "MarketPro", description: "Stratégies marketing et consulting.", logo: "https://cdn-icons-png.flaticon.com/512/1998/1998592.png", location: "Kinshasa, Kintambo" },
  ],
},

];


export const notifications = [
  {
    id: 1,
    title: "Nouvelle offre disponible",
    message: "Découvrez la nouvelle offre exclusive de BIM aujourd'hui !",
    date: "2026-01-27 09:30",
    isRead: false,
  },
  {
    id: 2,
    title: "Mise à jour de produit",
    message: "Le partenaire XYZ a mis à jour ses produits dans le catalogue.",
    date: "2026-01-26 15:45",
    isRead: true,
  },
  {
    id: 3,
    title: "Événement à venir",
    message: "Participez à l'événement BIM ce week-end pour rencontrer des partenaires.",
    date: "2026-01-25 12:00",
    isRead: false,
  },
  {
    id: 4,
    title: "Rappel de paiement",
    message: "Votre facture BIM du mois est maintenant disponible.",
    date: "2026-01-24 18:20",
    isRead: true,
  },
  {
    id: 5,
    title: "Nouvelle notification",
    message: "Une nouvelle notification a été ajoutée pour vous tenir informé.",
    date: "2026-01-23 10:00",
    isRead: false,
  },
];


export const companiesEnergies = [
  {
    id: "1",
    name: "Solar RDC",
    description: "Installation panneaux solaires.",
    logo: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png",
    location: "Kinshasa, Gombe",
    products: [
      { id: "p1", name: "Panneau Solaire 300W", price: 250, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p2", name: "Batterie Solaire 200Ah", price: 180, image: "https://cdn-icons-png.flaticon.com/512/3103/3103446.png" },
      { id: "p11", name: "Contrôleur de charge", price: 70, image: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png" },
      { id: "p12", name: "Kit Solaire Portable 50W", price: 120, image: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png" },
      { id: "p13", name: "Lampe Solaire d'intérieur", price: 35, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" }
    ]
  },

  {
    id: "2",
    name: "PowerTech",
    description: "Maintenance réseaux électriques.",
    logo: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
    location: "Kinshasa, Kintambo",
    products: [
      { id: "p3", name: "Onduleur 5KVA", price: 450, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
      { id: "p4", name: "Régulateur de tension", price: 60, image: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png" },
      { id: "p14", name: "Transformateur 10KVA", price: 800, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
      { id: "p15", name: "Câble électrique 50m", price: 120, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p16", name: "Disjoncteur industriel", price: 200, image: "https://cdn-icons-png.flaticon.com/512/3063/3063827.png" }
    ]
  },

  {
    id: "3",
    name: "Green Energy",
    description: "Solutions énergie renouvelable.",
    logo: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png",
    location: "Kinshasa, Ngaliema",
    products: [
      { id: "p5", name: "Kit Solaire Maison", price: 600, image: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png" },
      { id: "p6", name: "Lampe Solaire LED", price: 25, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
      { id: "p17", name: "Panneau Solaire 150W", price: 130, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p18", name: "Batterie Lithium 100Ah", price: 350, image: "https://cdn-icons-png.flaticon.com/512/3103/3103446.png" },
      { id: "p19", name: "Lampe Solaire Extérieure", price: 40, image: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png" }
    ]
  },

  {
    id: "4",
    name: "Electro Plus",
    description: "Matériel électrique.",
    logo: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
    location: "Kinshasa, Bandalungwa",
    products: [
      { id: "p7", name: "Disjoncteur", price: 15, image: "https://cdn-icons-png.flaticon.com/512/3063/3063827.png" },
      { id: "p8", name: "Prise murale", price: 5, image: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png" },
      { id: "p20", name: "Interrupteur 1 voie", price: 3, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
      { id: "p21", name: "Câble électrique 10m", price: 12, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p22", name: "Prise double", price: 8, image: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png" }
    ]
  },

  {
    id: "5",
    name: "SunLight Africa",
    description: "Éclairage solaire.",
    logo: "https://cdn-icons-png.flaticon.com/512/1693/1693746.png",
    location: "Kinshasa, Limete",
    products: [
      { id: "p9", name: "Projecteur Solaire", price: 80, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p10", name: "Lampe Jardin Solaire", price: 20, image: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png" },
      { id: "p23", name: "Lampe Torche Solaire", price: 15, image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
      { id: "p24", name: "Éclairage Mur Solaire", price: 50, image: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png" },
      { id: "p25", name: "Lampe de Table Solaire", price: 30, image: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png" }
    ]
  }
];


