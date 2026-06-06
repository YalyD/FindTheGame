// Central UI text. Every user-facing string lives here so copy changes happen
// in one place (and to ease a future move to i18n). Strings that interpolate a
// runtime value are exposed as small helper functions.

export const BRAND_NAME = 'Find The Game'

export const ISRAELI_TEAMS = [
  'מכבי תל אביב',
  'הפועל תל אביב',
  'מכבי חיפה',
  'הפועל חיפה',
  'בית"ר ירושלים',
  'הפועל ירושלים',
  'הפועל באר שבע',
  'הפועל פתח תקווה',
  'בני סכנין',
  'עירוני קריית שמונה',
  'מ.ס. אשדוד',
  'מכבי בני ריינה',
  'מכבי נתניה',
  'עירוני טבריה',
]

export const COMMON = {
  cancel: 'ביטול',
  versus: 'נגד',
  editProfile: 'עריכת פרופיל',
  seats: (n: number) => `${n} מושבים`,
} as const

export const LOGIN = {
  tagline: 'טרמפים למשחק. ביחד זה יותר כיף.',
  featureFindRides: 'מצא טרמפים',
  featureOfferRides: 'הצע נסיעות',
  secureLogin: 'התחברות מאובטחת דרך חשבון Google',
  errorNoClientId: 'VITE_GOOGLE_CLIENT_ID is not set',
  errorLoginFailed: 'Login failed — check server logs',
} as const

export const PROFILE = {
  headingCreate: 'השלמת פרופיל',
  headingEdit: COMMON.editProfile,
  subtitleCreate: 'נדרש למלא פעם אחת לפני שניתן להשתמש באפליקציה',
  subtitleEdit: 'עדכן את פרטי הפרופיל שלך',
  favoriteTeam: 'קבוצה אהובה',
  carDetails: 'פרטי רכב',
  make: 'יצרן',
  makePlaceholder: 'טויוטה',
  model: 'דגם',
  modelPlaceholder: 'קורולה',
  year: 'שנת ייצור',
  seats: 'מספר מושבים',
  saveContinue: 'שמור והמשך',
  saveChanges: 'שמור שינויים',
  saving: 'שומר…',
  error: 'שגיאה בשמירת הפרופיל, נסה שוב',
} as const

export const ADDRESS_FIELDS = {
  cityLabel: 'עיר / ישוב',
  cityLoading: 'מחפש ישובים...',
  cityMinChars: 'הקלד לפחות 2 תווים',
  cityNoResults: 'לא נמצאו ישובים',
  streetLabel: 'רחוב',
  streetLoading: 'מחפש רחובות...',
  streetSelectCityFirst: 'בחר עיר תחילה',
  streetMinChars: 'הקלד לפחות 2 תווים',
  streetNoResults: 'לא נמצאו רחובות',
  houseNumber: 'מס" בית',
  houseNumberPlaceholder: '5',
  useMyLocation: 'השתמש במיקום הנוכחי שלי',
  geoUnsupported: 'הדפדפן לא תומך באיתור מיקום',
  geoNoAddress: 'לא הצלחנו לזהות את הכתובת מהמיקום',
  geoDenied: 'יש לאפשר גישה למיקום בדפדפן',
  geoTimeout: 'פעולת המיקום פגה',
  geoError: 'שגיאה באיתור המיקום',
} as const

export const ADDRESS_AUTOCOMPLETE = {
  loading: 'מחפש כתובות...',
  minChars: 'הקלד לפחות 3 תווים',
  noResults: 'לא נמצאו תוצאות',
} as const

export const MAIN = {
  requestRide: 'צור בקשת נסיעה',
  offerRide: 'הצע נסיעה',
  navUpcoming: 'משחקים קרובים',
  navActivity: 'הפעילות שלי',
  account: 'חשבון',
  editProfile: COMMON.editProfile,
  logout: 'יציאה',
  upcomingGames: 'משחקים קרובים',
  refreshList: 'רענן רשימה',
  pickGame: 'בחר משחק כדי למצוא או להציע נסיעה',
  noGames: 'אין משחקים קרובים',
  errorLoadGames: 'שגיאה בטעינת המשחקים',
  errorLoadProfile: 'שגיאה בטעינת הפרופיל',
  toastRequestSaved: 'הבקשה שלך נשמרה!',
  toastOfferPublished: 'ההצעה פורסמה בהצלחה!',
  toastProfileUpdated: 'הפרופיל עודכן בהצלחה',
} as const

export const CREATE_REQUEST = {
  heading: 'בקשת נסיעה',
  seatsNeeded: 'כמה מושבים דרושים?',
  submit: 'שלח בקשה',
  submitting: 'שולח…',
  error: 'שגיאה ביצירת הבקשה, נסה שוב',
} as const

export const CREATE_OFFER = {
  heading: 'הצעת נסיעה',
  origin: 'נקודת מוצא',
  seatsAvailable: 'כמה מושבים פנויים?',
  seatsHelper: 'לא כולל את המושב שלך',
  submit: 'פרסם הצעה',
  submitting: 'שולח…',
  error: 'שגיאה ביצירת ההצעה, נסה שוב',
} as const

export const MATCH = {
  heading: 'הצעות נסיעה',
  subtitle: 'הבקשה שלך נשמרה ✓ — בחר הצעת נסיעה מתאימה למטה',
  joined: 'הצטרפת להצעה זו!',
  joining: 'מצטרף…',
  join: 'הצטרף להצעה',
  notEnoughSeats: 'אין מספיק מושבים',
  recommended: 'ההצעה המומלצת עבורך',
  allOffers: 'כל ההצעות הזמינות',
  activeTitle: 'הבקשה שלך פעילה',
  activeBody:
    'עדיין אין הצעות נסיעה למשחק הזה. נשלח לך התראה ברגע שנהג יפרסם הצעה — אפשר לסגור את המסך בשקט.',
  backToMain: 'חזור למסך הראשי',
  errorLoadOffers: 'שגיאה בטעינת ההצעות',
  errorJoin: 'שגיאה בהצטרפות להצעה',
} as const

export const ACTIVITY = {
  requestStatus: {
    open: 'ממתין להתאמה',
    matched: 'נמצאה נסיעה!',
    cancelled: 'בוטל',
  },
  offerStatus: {
    open: 'פתוח',
    full: 'מלא',
    cancelled: 'בוטל',
  },
  gameDeleted: 'המשחק נמחק',
  cancelling: 'מבטל...',
  cancelRequest: 'בטל בקשה',
  cancelOffer: 'בטל הצעה',
  passengersJoined: 'נוסעים שהצטרפו:',
  noPassengers: 'עדיין לא הצטרפו נוסעים',
  noRequests: 'לא יצרת בקשות נסיעה עדיין',
  noOffers: 'לא יצרת הצעות נסיעה עדיין',
  errorLoadRequests: 'שגיאה בטעינת הבקשות',
  errorLoadOffers: 'שגיאה בטעינת ההצעות',
  seatsAvailable: (n: number) => `${n} מושבים פנויים`,
  myRequestsTab: (n: number) => `הבקשות שלי (${n})`,
  myOffersTab: (n: number) => `ההצעות שלי (${n})`,
} as const

export const NOTIFICATIONS = {
  title: 'התראות',
  markAllRead: 'סמן הכל כנקרא',
  empty: 'אין התראות',
  timeNow: 'עכשיו',
  timeMinutes: (n: number) => `לפני ${n} דקות`,
  timeHours: (n: number) => `לפני ${n} שעות`,
  timeDays: (n: number) => `לפני ${n} ימים`,
} as const
