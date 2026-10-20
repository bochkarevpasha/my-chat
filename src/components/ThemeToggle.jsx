import { Icon } from '@mdi/react';
import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js';

const ThemeToggle = ({ theme, toggleTheme, className = '' }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
      type="button"
    >
      <Icon
        path={theme === 'light' ? mdiWeatherNight : mdiWeatherSunny}
        size={1.2}
        color="currentColor"
      />
    </button>
  );
};

export default ThemeToggle;