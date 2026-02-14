// Цветовая палитра Prism
// Темная и Светлая темы по спецификации пользователя

export const Colors = {
    dark: {
        background: '#14120B',                // самый темный
        surface: '#1B1913',                   // плашки, карточки
        text: '#EDECEC',                      // основной текст
        subtext: '#999895',                   // второстепенный текст
        accent: '#F54E01',                    // контрастный/особенный
        border: 'rgba(237, 236, 236, 0.08)',  // тонкие границы
        inputBg: 'rgba(0, 0, 0, 0.3)',        // фон инпутов
        overlay: 'rgba(20, 18, 11, 0.85)',    // фон модалок
    },
    light: {
        background: '#F7F7F4',                // самый белый
        surface: '#F2F1ED',                   // плашки, карточки
        text: '#26251E',                      // основной текст
        subtext: '#797771',                   // второстепенный текст
        accent: '#F54E01',                    // контрастный/особенный
        border: 'rgba(38, 37, 30, 0.1)',      // тонкие границы
        inputBg: 'rgba(0, 0, 0, 0.04)',       // фон инпутов
        overlay: 'rgba(247, 247, 244, 0.9)',  // фон модалок
    },
};

export type ThemeColors = typeof Colors.dark;
export type ThemeMode = 'dark' | 'light';
