import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Language Strings ────────────────────────────────────────────────────────
export const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    records: 'Records',
    settings: 'Settings',
    signOut: 'Sign Out',
    logDistribution: 'Log Distribution',
    // Dashboard
    operationalDashboard: 'Operational Dashboard',
    activeOutCans: 'Active Out Cans',
    cansWithVillagers: 'Cans currently with villagers',
    overdueReturnCans: 'Overdue Return Cans',
    outstandingPast24: 'Outstanding past 24 hours',
    outstandingBalance: 'Outstanding Balance',
    totalPendingDue: 'Total pending due payments',
    activeLedgers: 'Active Ledgers',
    currentActiveHandouts: 'Current active hand-outs',
    activeReturnReminders: 'Active 24hr Return Reminders',
    loadingTimers: 'Loading timers...',
    allReturned: '🎉 All water cans have been successfully returned. No active pending returns!',
    cansDue: 'Cans Due',
    duePay: 'Due Pay',
    sendReminder: 'Send Reminder',
    refresh: 'Refresh',
    // Records
    recordsLedger: 'Records Ledger',
    logNewDistribution: 'Log New Distribution',
    searchPlaceholder: 'Search villager name, village, or phone...',
    statusLabel: 'Status:',
    allLogs: 'All Logs',
    pending: 'Pending',
    partiallyReturned: 'Partially Returned',
    returned: 'Returned',
    overdue: 'Overdue',
    loadingLedger: 'Loading ledger data...',
    noRecords: 'No records match the active filters.',
    auditLogs: 'Audit Logs',
    returnBtn: 'Return',
    refillBtn: 'Refill',
    extraBtn: '+ Extra',
    deleteBtn: 'Delete',
    cansStatus: 'Cans Status',
    financials: 'Financials',
    paid: 'Paid',
    due: 'Due',
    fullyPaid: 'Fully Paid',
    checkout: 'Checkout',
    deadline: 'Deadline',
    noAuditLogs: 'No refills or extras logged.',
    returnModal: 'Log Return',
    currentlyHas: 'Currently has',
    cansOutstanding: 'cans outstanding.',
    numberOfCansReturned: 'Number of Cans Returned',
    confirmReturn: 'Confirm Return',
    refillModal: 'Refill Cans',
    refillDesc: 'Villager returns old cans and takes newly refilled ones.',
    cansRefilled: 'Cans Refilled',
    refillTotal: 'Refill Total Cost',
    refillPay: 'Refill Pay (₹)',
    refillDue: 'Refill Due (₹)',
    confirmRefill: 'Confirm Refill',
    extraModal: 'Issue Extra Cans',
    extraDesc: 'Adds more outstanding cans and extends return deadline.',
    extraCansCheckedOut: 'Extra Cans Checked Out',
    extraTotal: 'Extra Total Cost',
    extraPay: 'Extra Pay (₹)',
    extraDue: 'Extra Due (₹)',
    confirmExtras: 'Confirm Issue Extras',
    fullPaid: 'Full Paid',
    fullDue: 'Full Due',
    standardTotal: 'Standard Total Cost',
    villagerName: 'Villager Name',
    enterName: "Enter villager's full name",
    phoneNumber: 'Phone Number',
    enterPhone: 'Enter 10-digit mobile number',
    selectVillage: 'Select Village',
    cansIssued: 'Cans Issued',
    amountPaid: 'Amount Paid (₹)',
    amountDue: 'Amount Due (₹)',
    confirmSave: 'Confirm & Save Checkout',
    deleteConfirmTitle: 'Delete Record',
    deleteConfirmMsg: 'Are you sure you want to permanently delete this record?',
    deleteWarning: 'This action cannot be undone.',
    confirmDelete: 'Yes, Delete',
    cancel: 'Cancel',
    partial: 'partial',
    // Settings
    systemSettings: 'System Settings',
    canPriceConfig: 'Global Can Price Configuration',
    canPriceDesc: 'Standard rate charged per water can.',
    standardCanPrice: 'Standard Can Price (₹)',
    saveCanPrice: 'Save Can Price',
    saving: 'Saving...',
    addNewVillage: 'Add New Village',
    villageName: 'Village Name',
    villagePlaceholder: 'e.g. Greenwood',
    addVillage: 'Add Village',
    adding: 'Adding...',
    servicedVillages: 'Serviced Villages',
    noVillages: 'No villages configured yet.',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark',
    lightMode: 'Light',
    loggedInAs: 'Logged in as',
  },
  te: {
    // Nav
    dashboard: 'డాష్‌బోర్డ్',
    records: 'రికార్డులు',
    settings: 'సెట్టింగ్స్',
    signOut: 'సైన్ అవుట్',
    logDistribution: 'పంపిణీ లాగ్',
    // Dashboard
    operationalDashboard: 'కార్యాచరణ డాష్‌బోర్డ్',
    activeOutCans: 'యాక్టివ్ క్యాన్లు',
    cansWithVillagers: 'గ్రామస్థుల వద్ద ఉన్న క్యాన్లు',
    overdueReturnCans: 'గడువు మించిన క్యాన్లు',
    outstandingPast24: '24 గంటలు దాటిన రిటర్న్లు',
    outstandingBalance: 'పెండింగ్ బ్యాలెన్స్',
    totalPendingDue: 'మొత్తం పెండింగ్ చెల్లింపులు',
    activeLedgers: 'యాక్టివ్ లెడ్జర్లు',
    currentActiveHandouts: 'ప్రస్తుత యాక్టివ్ పంపిణీలు',
    activeReturnReminders: 'యాక్టివ్ 24గం రిమైండర్లు',
    loadingTimers: 'లోడ్ అవుతోంది...',
    allReturned: '🎉 అన్ని క్యాన్లు తిరిగి ఇచ్చారు!',
    cansDue: 'క్యాన్లు డ్యూ',
    duePay: 'చెల్లించాల్సిన మొత్తం',
    sendReminder: 'రిమైండర్ పంపు',
    refresh: 'రిఫ్రెష్',
    // Records
    recordsLedger: 'రికార్డుల లెడ్జర్',
    logNewDistribution: 'పంపిణీ నమోదు',
    searchPlaceholder: 'పేరు, గ్రామం, లేదా ఫోన్ వెతకండి...',
    statusLabel: 'స్థితి:',
    allLogs: 'అన్నీ',
    pending: 'పెండింగ్',
    partiallyReturned: 'పాక్షిక రిటర్న్',
    returned: 'తిరిగి ఇచ్చారు',
    overdue: 'గడువు మించింది',
    loadingLedger: 'లెడ్జర్ లోడ్ అవుతోంది...',
    noRecords: 'వడపోత ప్రమాణాలకు సరిపోలే రికార్డులు లేవు.',
    auditLogs: 'ఆడిట్ లాగ్లు',
    returnBtn: 'తిరిగివ్వు',
    refillBtn: 'రీఫిల్',
    extraBtn: '+ అదనపు',
    deleteBtn: 'తొలగించు',
    cansStatus: 'క్యాన్ స్థితి',
    financials: 'ఆర్థిక వివరాలు',
    paid: 'చెల్లించారు',
    due: 'బాకీ',
    fullyPaid: 'పూర్తిగా చెల్లించారు',
    checkout: 'చెక్అవుట్',
    deadline: 'గడువు',
    noAuditLogs: 'రీఫిల్ లేదా అదనపు క్యాన్లు నమోదు లేవు.',
    returnModal: 'రిటర్న్ నమోదు',
    currentlyHas: 'ప్రస్తుతం వద్ద ఉన్నవి',
    cansOutstanding: 'క్యాన్లు.',
    numberOfCansReturned: 'తిరిగి ఇచ్చిన క్యాన్ల సంఖ్య',
    confirmReturn: 'రిటర్న్ నిర్ధారించు',
    refillModal: 'రీఫిల్ క్యాన్లు',
    refillDesc: 'గ్రామస్థుడు పాత క్యాన్లు తిరిగి ఇచ్చి కొత్తవి తీసుకుంటారు.',
    cansRefilled: 'రీఫిల్ చేసిన క్యాన్లు',
    refillTotal: 'రీఫిల్ మొత్తం ఖర్చు',
    refillPay: 'రీఫిల్ చెల్లింపు (₹)',
    refillDue: 'రీఫిల్ బాకీ (₹)',
    confirmRefill: 'రీఫిల్ నిర్ధారించు',
    extraModal: 'అదనపు క్యాన్లు',
    extraDesc: 'అదనపు క్యాన్లు జోడించి గడువు పొడిగిస్తుంది.',
    extraCansCheckedOut: 'అదనపు క్యాన్ల సంఖ్య',
    extraTotal: 'అదనపు మొత్తం ఖర్చు',
    extraPay: 'అదనపు చెల్లింపు (₹)',
    extraDue: 'అదనపు బాకీ (₹)',
    confirmExtras: 'అదనపు నిర్ధారించు',
    fullPaid: 'పూర్తిగా చెల్లించు',
    fullDue: 'పూర్తిగా బాకీ',
    standardTotal: 'మొత్తం ఖర్చు',
    villagerName: 'గ్రామస్థుని పేరు',
    enterName: 'పూర్తి పేరు నమోదు చేయండి',
    phoneNumber: 'ఫోన్ నంబర్',
    enterPhone: '10 అంకెల మొబైల్ నంబర్',
    selectVillage: 'గ్రామం ఎంచుకోండి',
    cansIssued: 'జారీ చేసిన క్యాన్లు',
    amountPaid: 'చెల్లించిన మొత్తం (₹)',
    amountDue: 'బాకీ మొత్తం (₹)',
    confirmSave: 'నిర్ధారించు & సేవ్ చేయి',
    deleteConfirmTitle: 'రికార్డు తొలగించు',
    deleteConfirmMsg: 'ఈ రికార్డును శాశ్వతంగా తొలగించాలా?',
    deleteWarning: 'ఈ చర్యను రద్దు చేయలేరు.',
    confirmDelete: 'అవును, తొలగించు',
    cancel: 'రద్దు చేయి',
    partial: 'పాక్షిక',
    // Settings
    systemSettings: 'సిస్టమ్ సెట్టింగ్స్',
    canPriceConfig: 'క్యాన్ ధర కాన్ఫిగురేషన్',
    canPriceDesc: 'ప్రతి క్యాన్‌కు వసూలు చేసే ప్రమాణ రేటు.',
    standardCanPrice: 'ప్రమాణ క్యాన్ ధర (₹)',
    saveCanPrice: 'ధర సేవ్ చేయి',
    saving: 'సేవ్ అవుతోంది...',
    addNewVillage: 'కొత్త గ్రామం జోడించు',
    villageName: 'గ్రామం పేరు',
    villagePlaceholder: 'ఉదా: యెల్లంపెట',
    addVillage: 'గ్రామం జోడించు',
    adding: 'జోడిస్తోంది...',
    servicedVillages: 'సేవా గ్రామాలు',
    noVillages: 'ఇంకా గ్రామాలు కాన్ఫిగర్ చేయలేదు.',
    appearance: 'రూపురేఖలు',
    language: 'భాష',
    theme: 'థీమ్',
    darkMode: 'డార్క్',
    lightMode: 'లైట్',
    loggedInAs: 'లాగిన్ చేసారు',
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // ── Language ───────────────────────────────────────────────────────────────
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('lang');
    if (stored) return stored;
    // Auto-detect device language
    const deviceLang = navigator.language || navigator.userLanguage || 'en';
    // Telugu language codes: te, te-IN
    if (deviceLang.startsWith('te')) return 'te';
    return 'en';
  });

  // Apply theme to <html> data attribute so CSS variables can switch
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = translations[lang] || translations.en;

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang  = () => setLang(prev => prev === 'en' ? 'te' : 'en');

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
