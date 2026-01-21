export interface ClerkAuthSession {
    sub: string;
    sid?: string;
    public_metadata?: Record<string, unknown>;
    role?: string;
    [key: string]: any;
}
export declare const validateClerkSession: (token: string) => Promise<ClerkAuthSession | null>;
