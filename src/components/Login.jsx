import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Icon } from '@mdi/react';
import { mdiLoading, mdiEye, mdiEyeOff } from '@mdi/js';

const Login = ({ onLogin, theme, toggleTheme }) => {
    const [idInstance, setIdInstance] = useState(localStorage.getItem('idInstance') || '');
    const [apiTokenInstance, setApiTokenInstance] = useState(localStorage.getItem('apiTokenInstance') || '');
    const [touched, setTouched] = useState({ id: false, token: false });

    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showToken, setShowToken] = useState(false);

    const isValidId = /^\d{10,15}$/.test(idInstance);
    const isValidToken = /^[a-zA-Z0-9]{50}$/.test(apiTokenInstance);
    const isFormValid = isValidId && isValidToken;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isFormValid && !isLoading) {
            setIsLoading(true);
            setServerError('');

            const isSuccess = await onLogin(idInstance, apiTokenInstance);

            if (!isSuccess) {
                setServerError('Неверный ID инстанса или токен. Проверьте данные.');
            }
            setIsLoading(false);
        } else if (!isFormValid) {
            setTouched({ id: true, token: true });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-theme-toggle">
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Вход в Green-API</h2>

                {serverError && <div className="server-error">{serverError}</div>}

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="idInstance"
                        value={idInstance}
                        onChange={(e) => setIdInstance(e.target.value.trim())}
                        onBlur={() => setTouched((prev) => ({ ...prev, id: true }))}
                        className={touched.id && !isValidId ? 'input-error' : ''}
                        disabled={isLoading}
                    />
                    {touched.id && !isValidId && (
                        <span className="error-text">ID должен содержать 10-15 цифр</span>
                    )}
                </div>

                <div className="input-group">
                    <div className="password-wrapper">
                        <input
                            type={showToken ? 'text' : 'password'}
                            placeholder="apiTokenInstance"
                            value={apiTokenInstance}
                            onChange={(e) => setApiTokenInstance(e.target.value.trim())}
                            onBlur={() => setTouched((prev) => ({ ...prev, token: true }))}
                            className={touched.token && !isValidToken ? 'input-error' : ''}
                            disabled={isLoading}
                        />
                        <Icon
                            className="toggle-password-btn"
                            onClick={() => setShowToken(!showToken)}
                            path={showToken ? mdiEyeOff : mdiEye}
                            size={1.2}
                            color="var(--text-secondary)"
                        />
                    </div>
                    {touched.token && !isValidToken && (
                        <span className="error-text">Токен должен состоять из 50 буквенно-цифровых символов</span>
                    )}
                </div>

                <button type="submit" disabled={!isFormValid || isLoading}>
                    {isLoading ?
                        <Icon path={mdiLoading} size={1} className="loading" /> :
                        'Войти'
                    }
                </button>
            </form>
        </div>
    );
};

export default Login;