const PASSWORD_RECOVERY_STORAGE_KEY = 'bk-password-recovery';
export const RECOVERY_DEMO_CODE = '123456';

type PasswordRecoveryState = {
    email: string;
    code: string;
    verified: boolean;
    expiresAt: number;
};

const readStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.sessionStorage;
};

export const clearPasswordRecoveryState = () => {
    const storage = readStorage();

    if (!storage) {
        return;
    }

    storage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
};

export const getPasswordRecoveryState = (): PasswordRecoveryState | null => {
    const storage = readStorage();

    if (!storage) {
        return null;
    }

    const rawValue = storage.getItem(PASSWORD_RECOVERY_STORAGE_KEY);

    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as PasswordRecoveryState;

        if (!parsed.email || !parsed.code || !parsed.expiresAt) {
            clearPasswordRecoveryState();
            return null;
        }

        if (parsed.expiresAt <= Date.now()) {
            clearPasswordRecoveryState();
            return null;
        }

        return parsed;
    } catch {
        clearPasswordRecoveryState();
        return null;
    }
};

export const startPasswordRecovery = (email: string) => {
    const storage = readStorage();

    if (!storage) {
        return null;
    }

    const state: PasswordRecoveryState = {
        email,
        code: RECOVERY_DEMO_CODE,
        verified: false,
        expiresAt: Date.now() + 10 * 60 * 1000,
    };

    storage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(state));
    return state;
};

export const resendPasswordRecoveryCode = () => {
    const currentState = getPasswordRecoveryState();

    if (!currentState) {
        return null;
    }

    return startPasswordRecovery(currentState.email);
};

export const markPasswordRecoveryVerified = () => {
    const storage = readStorage();
    const currentState = getPasswordRecoveryState();

    if (!storage || !currentState) {
        return null;
    }

    const nextState: PasswordRecoveryState = {
        ...currentState,
        verified: true,
    };

    storage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
};

export const canAccessPasswordReset = () => {
    return Boolean(getPasswordRecoveryState()?.verified);
};

export const hasPasswordRecoveryRequest = () => {
    return Boolean(getPasswordRecoveryState());
};
