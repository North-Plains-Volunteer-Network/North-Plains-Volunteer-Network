
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getUserProfile } from '../services/userService';
import { User, UserRole, OnboardingStep } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    debugLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (currentSession: Session | null) => {
        if (!currentSession?.user) {
            setUser(null);
            return;
        }

        try {
            const profile = await getUserProfile(currentSession.user.id);
            if (profile) {
                setUser(profile);
            } else {
                // Profile doesn't exist - create one from auth metadata
                console.log('No profile found, attempting to create from metadata...');
                const { createUserProfile } = await import('../services/userService');
                const userMetadata = currentSession.user.user_metadata;

                // Ensure we have the necessary data
                if (!userMetadata.role) {
                    console.error('No role in user metadata, cannot create profile');
                    // Use fallback with CLIENT role as default
                    setUser({
                        id: currentSession.user.id,
                        email: currentSession.user.email!,
                        role: UserRole.CLIENT,
                        onboardingStep: 1,
                        name: userMetadata.full_name || 'User',
                        emailVerified: currentSession.user.email_confirmed_at != null
                    } as User);
                    return;
                }

                const newProfile = await createUserProfile(
                    currentSession.user.id,
                    currentSession.user.email!,
                    userMetadata.full_name || 'User',
                    userMetadata.role
                );

                if (newProfile) {
                    console.log('Profile created successfully');
                    setUser(newProfile);
                } else {
                    console.error('Failed to create profile, using fallback');
                    // Fallback if profile creation fails
                    setUser({
                        id: currentSession.user.id,
                        email: currentSession.user.email!,
                        role: userMetadata.role || UserRole.CLIENT,
                        onboardingStep: 1,
                        name: userMetadata.full_name || 'User',
                        emailVerified: currentSession.user.email_confirmed_at != null
                    } as User);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            fetchProfile(session).finally(() => setLoading(false));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            fetchProfile(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        await fetchProfile(session);
    }

    const debugLogin = (role: UserRole) => {
        const mockUser: User = {
            id: `demo_${role.toLowerCase()}_${Date.now()}`,
            email: `demo_${role.toLowerCase()}@npvn.org`,
            role: role,
            name: `Demo ${role === UserRole.CLIENT ? 'Client' : role === UserRole.VOLUNTEER ? 'Volunteer' : role === UserRole.CLIENT_VOLUNTEER ? 'Dual User' : 'Admin'}`,
            onboardingStep: OnboardingStep.COMPLETE, // Set to COMPLETE (5) to bypass intake form
            emailVerified: true,
            // Complete profile fields
            phone: '(503) 555-1234',
            preferredName: `Demo ${role === UserRole.CLIENT ? 'Client' : role === UserRole.VOLUNTEER ? 'Volunteer' : role === UserRole.CLIENT_VOLUNTEER ? 'Dual User' : 'Admin'}`,
            dob: '1990-01-01',
            gender: 'Prefer not to say',
            preferredContactMethod: 'Email',
            // Training and background check complete for volunteers and dual users
            trainingComplete: role === UserRole.VOLUNTEER || role === UserRole.CLIENT_VOLUNTEER || role === UserRole.ADMIN,
            backgroundCheckStatus: (role === UserRole.VOLUNTEER || role === UserRole.CLIENT_VOLUNTEER) ? 'APPROVED' : undefined,
            backgroundCheckQuestionsComplete: (role === UserRole.VOLUNTEER || role === UserRole.CLIENT_VOLUNTEER) ? true : undefined,
            // Notification preferences
            notificationPreferences: {
                email: true,
                sms: false,
                calendar: false
            },
            // Emergency contact
            emergencyContact: {
                name: 'Jane Doe',
                phone: '(503) 555-5678',
                relation: 'Spouse'
            }
        };
        console.log('🎭 Demo login activated for:', role);
        setUser(mockUser);
    };

    const value = {
        user,
        session,
        loading,
        signOut,
        refreshProfile,
        debugLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
