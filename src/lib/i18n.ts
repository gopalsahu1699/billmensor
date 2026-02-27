'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Common translations (can be moved to separate JSON files and loaded later)
const resources = {
    en: {
        translation: {
            "Dashboard": "Dashboard",
            "Customers": "Customers",
            "Inventory": "Inventory",
            "Items / Products": "Items / Products",
            "Sales": "Sales",
            "Purchase": "Purchase",
            "Finance": "Finance",
            "Expenses": "Expenses",
            "Smart Tools": "Smart Tools",
            "Reports": "Reports",
            "Settings": "Settings",
            "New Invoice": "New Invoice",
            "Logout": "Logout",
            "Collapse Sidebar": "Collapse Sidebar",
            "English": "English",
            "Hindi": "Hindi"
        }
    },
    hi: {
        translation: {
            "Dashboard": "डैशबोर्ड",
            "Customers": "ग्राहक",
            "Inventory": "इन्वेंट्री",
            "Items / Products": "आइटम / उत्पाद",
            "Sales": "बिक्री",
            "Purchase": "खरीद",
            "Finance": "वित्त",
            "Expenses": "खर्च",
            "Smart Tools": "स्मार्ट उपकरण",
            "Reports": "रिपोर्ट्स",
            "Settings": "सेटिंग्स",
            "New Invoice": "नया चालान",
            "Logout": "लॉग आउट",
            "Collapse Sidebar": "साइडबार समेटें",
            "English": "अंग्रेज़ी",
            "Hindi": "हिंदी"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already does escaping
        }
    });

export default i18n;
