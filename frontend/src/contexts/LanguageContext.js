// frontend/src/contexts/LanguageContext.js

import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ сhildren }) => {
    const [language, setLanguage] = useState('en');

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {сhildren}
        </LanguageContext.Provider>
    );
};