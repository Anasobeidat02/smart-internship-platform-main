export type Locale = "en" | "ar";

export const locales: Locale[] = ["en", "ar"];

interface NavDict {
  home: string; companies: string; universities: string; partners: string; map: string; dashboard: string; internships: string; applications: string; saved: string; settings: string; login: string; register: string; logout: string;
}
interface HeroDict {
  eyebrow: string; title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string;
}
interface StatsDict { universities: string; companies: string; partners: string; students: string; }
interface PartnerDict { kicker: string; twg_title: string; twg_subtitle: string; twg_body: string; address: string; visit: string; }
interface AdminInternshipsDict {
  addBtn: string; modalTitle: string; modalSubtitle: string;
  fieldCompany: string; fieldCompanyHint: string; fieldCompanyPlaceholder: string;
  fieldTitleAr: string; fieldTitleArPlaceholder: string;
  fieldTitleEn: string; fieldTitleEnPlaceholder: string;
  fieldDescAr: string; fieldDescArPlaceholder: string;
  fieldDescEn: string; fieldDescEnPlaceholder: string;
  fieldSkills: string; fieldSkillsHint: string; fieldSkillsPlaceholder: string;
  fieldDuration: string; fieldDurationRequired: string;
  fieldExperience: string;
  toggleRemote: string; toggleOpen: string;
  btnCancel: string; btnSubmit: string; btnSubmitting: string;
  errCompany: string; errTitleEn: string; errTitleAr: string; errDuration: string;
  toastCreated: string;
}
interface AuthDict {
  signin_title: string; signin_subtitle: string; signup_title: string; signup_subtitle: string;
  email: string; password: string; full_name: string; role: string; role_student: string; role_company: string;
  submit_signin: string; submit_signup: string; have_account: string; no_account: string; sign_in_link: string; sign_up_link: string;
}
interface DashboardDict {
  welcome: string; complete_profile: string; your_matches: string; best_match: string; view_all: string;
  profile: string; recommendations: string; match_score: string; distance: string; reasons: string;
}
interface ProfileDict {
  title: string; subtitle: string; step_basics: string; step_academics: string; step_skills: string; step_location: string;
  major: string; university: string; graduation_year: string; experience: string; skills: string; knowledge: string; bio: string;
  city: string; governorate: string; pick_home: string; save: string; saved: string;
}
interface MapDict {
  title: string; subtitle: string; filter_field: string; filter_gov: string; filter_strategic: string;
  legend_company: string; legend_strategic: string; legend_home: string; legend_university: string;
  filters_title: string; search_placeholder: string; all_governorates: string;
  open_satellite: string; directions: string; reset_view: string; near_me: string;
  layer_satellite: string; layer_streets: string; no_results: string;
  popup_home: string; popup_university: string; click_hint: string;
  showing: string; of: string;
}
interface CommonDict {
  loading: string; error: string; retry: string; save: string; cancel: string; close: string; learn_more: string; language: string;
}
export interface Dictionary {
  brand: string; tagline: string;
  nav: NavDict; hero: HeroDict; stats: StatsDict; partner: PartnerDict; auth: AuthDict;
  dashboard: DashboardDict; profile: ProfileDict; map: MapDict; common: CommonDict;
  adminInternships: AdminInternshipsDict;
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    brand: "SmartIntern Jordan",
    tagline: "AI-powered internship matching across the Kingdom",
    nav: {
      home: "Home",
      companies: "Companies",
      universities: "Universities",
      partners: "Partners",
      map: "Map",
      dashboard: "Dashboard",
      internships: "Internships",
      applications: "My applications",
      saved: "Saved",
      settings: "Settings",
      login: "Sign in",
      register: "Get started",
      logout: "Sign out",
    },
    hero: {
      eyebrow: "Built for the next generation of Jordanian talent",
      title: "Find your perfect internship across Jordan",
      subtitle:
        "We match students with companies using AI - skills, field of study, geography.",
      ctaPrimary: "Get matched now",
      ctaSecondary: "Explore the map",
    },
    stats: {
      universities: "Universities",
      companies: "Partner companies",
      partners: "Strategic partners",
      students: "Students onboarded",
    },
    partner: {
      kicker: "University Partner",
      twg_title: "Al-Balqa Applied University (Al-Hosn College)",
      twg_subtitle: "Official academic partner of SmartIntern Jordan",
      twg_body:
        "Al-Hosn College / Al-Balqa Applied University is one of Jordan's leading applied science institutions, providing students with industry-relevant education and fostering direct pathways to professional internships across the Kingdom.",
      address: "Al-Hosn, Irbid, Jordan",
      visit: "Visit Al-Balqa University",
    },
    adminInternships: {
      addBtn: "Add Internship",
      modalTitle: "Add New Internship",
      modalSubtitle: "إضافة تدريب جديد",
      fieldCompany: "Corporate / Company",
      fieldCompanyHint: "Select the host company for this internship",
      fieldCompanyPlaceholder: "— Select a company —",
      fieldTitleAr: "Title (Arabic)",
      fieldTitleArPlaceholder: "e.g. Marketing Summer Internship",
      fieldTitleEn: "Title (English)",
      fieldTitleEnPlaceholder: "e.g. Marketing Summer Internship",
      fieldDescAr: "Description (Arabic)",
      fieldDescArPlaceholder: "Brief internship description…",
      fieldDescEn: "Description (English)",
      fieldDescEnPlaceholder: "Brief internship description…",
      fieldSkills: "Requirements & Skills",
      fieldSkillsHint: "Separate skills with a comma — e.g. Python, Excel, Communication",
      fieldSkillsPlaceholder: "Python, Excel, Communication, Time Management…",
      fieldDuration: "Duration (weeks)",
      fieldDurationRequired: "Enter a duration between 1 and 104 weeks",
      fieldExperience: "Min. Experience (years)",
      toggleRemote: "Remote",
      toggleOpen: "Open",
      btnCancel: "Cancel",
      btnSubmit: "Add Internship",
      btnSubmitting: "Saving…",
      errCompany: "Please select a company",
      errTitleEn: "English title is required",
      errTitleAr: "Arabic title is required",
      errDuration: "Enter a duration between 1 and 104 weeks",
      toastCreated: "Internship created successfully ✓",
    },
    auth: {
      signin_title: "Welcome back",
      signin_subtitle: "Sign in to access your personalised matches",
      signup_title: "Create your account",
      signup_subtitle: "Build your profile and discover your best-fit internship",
      email: "Email",
      password: "Password",
      full_name: "Full name",
      role: "I am a",
      role_student: "Student",
      role_company: "Company",
      submit_signin: "Sign in",
      submit_signup: "Create account",
      have_account: "Already have an account?",
      no_account: "Don't have an account?",
      sign_in_link: "Sign in",
      sign_up_link: "Create one",
    },
    dashboard: {
      welcome: "Welcome back",
      complete_profile: "Complete your profile to unlock smart matches",
      your_matches: "Your top matches",
      best_match: "Best match",
      view_all: "View all",
      profile: "Profile",
      recommendations: "Recommendations",
      match_score: "Match score",
      distance: "Distance",
      reasons: "Why this match",
    },
    profile: {
      title: "Your student profile",
      subtitle: "The more we know, the better we match",
      step_basics: "Basics",
      step_academics: "Academics",
      step_skills: "Skills & interests",
      step_location: "Home location",
      major: "Major / Field of study",
      university: "University",
      graduation_year: "Graduation year",
      experience: "Years of experience",
      skills: "Skills (comma separated)",
      knowledge: "Knowledge areas (comma separated)",
      bio: "Short bio",
      city: "City",
      governorate: "Governorate",
      pick_home: "Pick your home on the map",
      save: "Save profile",
      saved: "Profile saved",
    },
    map: {
      title: "Jordan internship map",
      subtitle: "Every partner company pinned on satellite imagery across the Kingdom.",
      filter_field: "Field",
      filter_gov: "Governorate",
      filter_strategic: "Strategic partners only",
      legend_company: "Partner company",
      legend_strategic: "University partner (Al-Hosn)",
      legend_home: "Your home",
      legend_university: "Your university",
      filters_title: "Filters",
      search_placeholder: "Search companies…",
      all_governorates: "All governorates",
      open_satellite: "Open in Map",
      directions: "Directions",
      reset_view: "Reset view",
      near_me: "Near me",
      layer_satellite: "Satellite",
      layer_streets: "Streets",
      no_results: "No companies match your filters",
      popup_home: "Your home",
      popup_university: "Your university",
      click_hint: "Click any pin to view the company and open its exact location.",
      showing: "Showing",
      of: "of",
    },
    common: {
      loading: "Loading…",
      error: "Something went wrong",
      retry: "Retry",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      learn_more: "Learn more",
      language: "Language",
    },
  },
  ar: {
    brand: "سمارت إنترن الأردن",
    tagline: "مطابقة التدريب الذكية المدعومة بالذكاء الاصطناعي في المملكة",
    nav: {
      home: "الرئيسية",
      companies: "الشركات",
      universities: "الجامعات",
      partners: "الشركاء",
      map: "الخريطة",
      dashboard: "لوحة التحكم",
      internships: "التدريبات",
      applications: "طلباتي",
      saved: "المحفوظات",
      settings: "الإعدادات",
      login: "تسجيل الدخول",
      register: "ابدأ الآن",
      logout: "تسجيل الخروج",
    },
    hero: {
      eyebrow: "مصمّم للجيل القادم من المواهب الأردنية",
      title: "اعثر على التدريب المثالي لك في الأردن",
      subtitle:
        "نطابق الطلاب مع الشركات بالذكاء الاصطناعي وفق المهارات والتخصص والموقع .",
      ctaPrimary: "اكتشف توصياتك",
      ctaSecondary: "استكشف الخريطة",
    },
    stats: {
      universities: "جامعة",
      companies: "شركة شريكة",
      partners: "شريك استراتيجي",
      students: "طالب مسجل",
    },
    partner: {
      kicker: "شريك أكاديمي",
      twg_title: "جامعة البلقاء التطبيقية (كلية الحصن)",
      twg_subtitle: "الشريك الأكاديمي الرسمي لسمارت إنترن الأردن",
      twg_body:
        "كلية الحصن / جامعة البلقاء التطبيقية إحدى المؤسسات الأكاديمية الرائدة في الأردن، تزوّد الطلاب بتعليم تطبيقي متخصص وتفتح لهم آفاقاً مباشرة للتدريب المهني في أنحاء المملكة.",
      address: "الحصن، إربد، الأردن",
      visit: "زيارة جامعة البلقاء التطبيقية",
    },
    adminInternships: {
      addBtn: "إضافة تدريب",
      modalTitle: "إضافة تدريب جديد",
      modalSubtitle: "Add New Internship",
      fieldCompany: "الشركة",
      fieldCompanyHint: "اختر الشركة المضيفة للتدريب",
      fieldCompanyPlaceholder: "— اختر شركة —",
      fieldTitleAr: "اسم التدريب (عربي)",
      fieldTitleArPlaceholder: "مثال: تدريب صيفي في التسويق",
      fieldTitleEn: "اسم التدريب (إنجليزي)",
      fieldTitleEnPlaceholder: "مثال: Marketing Summer Internship",
      fieldDescAr: "الوصف (عربي)",
      fieldDescArPlaceholder: "وصف مختصر عن التدريب...",
      fieldDescEn: "الوصف (إنجليزي)",
      fieldDescEnPlaceholder: "Brief internship description…",
      fieldSkills: "الشروط والمهارات المطلوبة",
      fieldSkillsHint: "افصل بين المهارات بفاصلة — مثال: Python، Excel، التواصل",
      fieldSkillsPlaceholder: "Python, Excel, التواصل, إدارة الوقت...",
      fieldDuration: "المدة (أسابيع)",
      fieldDurationRequired: "أدخل مدة بين 1 و 104 أسبوع",
      fieldExperience: "الخبرة المطلوبة (سنوات)",
      toggleRemote: "عن بُعد",
      toggleOpen: "مفتوح",
      btnCancel: "إلغاء",
      btnSubmit: "إضافة التدريب",
      btnSubmitting: "جاري الحفظ…",
      errCompany: "الرجاء اختيار شركة",
      errTitleEn: "العنوان الإنجليزي مطلوب",
      errTitleAr: "العنوان العربي مطلوب",
      errDuration: "أدخل مدة بين 1 و 104 أسبوع",
      toastCreated: "تم إنشاء التدريب بنجاح ✓",
    },
    auth: {
      signin_title: "مرحباً بعودتك",
      signin_subtitle: "سجّل دخولك لعرض توصياتك المخصّصة",
      signup_title: "إنشاء حساب جديد",
      signup_subtitle: "أنشئ ملفك واكتشف أفضل تدريب يناسبك",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      full_name: "الاسم الكامل",
      role: "أنا",
      role_student: "طالب",
      role_company: "شركة",
      submit_signin: "تسجيل الدخول",
      submit_signup: "إنشاء حساب",
      have_account: "لديك حساب؟",
      no_account: "ليس لديك حساب؟",
      sign_in_link: "سجّل دخولك",
      sign_up_link: "أنشئ حساباً",
    },
    dashboard: {
      welcome: "مرحباً بك",
      complete_profile: "أكمل ملفك لفتح التوصيات الذكية",
      your_matches: "أفضل التوصيات لك",
      best_match: "الأفضل",
      view_all: "عرض الكل",
      profile: "الملف الشخصي",
      recommendations: "التوصيات",
      match_score: "نسبة المطابقة",
      distance: "المسافة",
      reasons: "لماذا هذا التوصية",
    },
    profile: {
      title: "ملفك الطلابي",
      subtitle: "كلما عرفنا أكثر، كانت المطابقة أدق",
      step_basics: "الأساسيات",
      step_academics: "الدراسة",
      step_skills: "المهارات والاهتمامات",
      step_location: "موقع السكن",
      major: "التخصص",
      university: "الجامعة",
      graduation_year: "سنة التخرج",
      experience: "سنوات الخبرة",
      skills: "المهارات (مفصولة بفاصلة)",
      knowledge: "مجالات المعرفة (مفصولة بفاصلة)",
      bio: "نبذة قصيرة",
      city: "المدينة",
      governorate: "المحافظة",
      pick_home: "حدد موقع سكنك على الخريطة",
      save: "حفظ الملف",
      saved: "تم حفظ الملف",
    },
    map: {
      title: "خريطة التدريب في الأردن",
      subtitle: "جميع الشركات الشريكة على الصور الفضائية في أنحاء المملكة.",
      filter_field: "المجال",
      filter_gov: "المحافظة",
      filter_strategic: "الشركاء الاستراتيجيون فقط",
      legend_company: "شركة شريكة",
      legend_strategic: "شريك أكاديمي (الحصن)",
      legend_home: "موقعك",
      legend_university: "جامعتك",
      filters_title: "تصفية",
      search_placeholder: "ابحث عن شركة…",
      all_governorates: "كل المحافظات",
      open_satellite: "افتح في الخريطة",
      directions: "الاتجاهات",
      reset_view: "إعادة العرض",
      near_me: "بالقرب مني",
      layer_satellite: "صور فضائية",
      layer_streets: "شوارع",
      no_results: "لا توجد شركات تطابق التصفية",
      popup_home: "موقعك",
      popup_university: "جامعتك",
      click_hint: "اضغط على أي علامة لعرض بيانات الشركة وفتح موقعها.",
      showing: "عرض",
      of: "من",
    },
    common: {
      loading: "جارٍ التحميل…",
      error: "حدث خطأ ما",
      retry: "إعادة المحاولة",
      save: "حفظ",
      cancel: "إلغاء",
      close: "إغلاق",
      learn_more: "اقرأ المزيد",
      language: "اللغة",
    },
  },
};
