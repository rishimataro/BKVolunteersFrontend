const PASSWORD_RECOVERY_STORAGE_KEY = 'bk-password-recovery';

type PasswordRecoveryState = {
    email: string;
    verified: boolean;
    resetToken: string | null;
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

        if (!parsed.email || !parsed.expiresAt) {
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
        verified: false,
        resetToken: null,
        expiresAt: Date.now() + 10 * 60 * 1000,
    };

    storage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(state));
    return state;
};

export const markPasswordRecoveryVerified = (resetToken: string) => {
    const storage = readStorage();
    const currentState = getPasswordRecoveryState();

    if (!storage || !currentState) {
        return null;
    }

    const nextState: PasswordRecoveryState = {
        ...currentState,
        verified: true,
        resetToken,
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
