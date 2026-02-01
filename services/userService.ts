
import { supabase } from './supabase';
import { User, UserRole, OnboardingStep } from '../types';

export const createUserProfile = async (userId: string, email: string, fullName: string, role: UserRole): Promise<User | null> => {
    // Only insert the absolute minimum required fields
    const newProfile = {
        id: userId,
        email: email,
        full_name: fullName,
        role: role
    };

    const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

    if (error) {
        console.error('Error creating user profile:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });

        // Check if it's a duplicate key error
        if (error.code === '23505') {
            console.log('Profile already exists, attempting to fetch existing profile...');
            // Try to fetch the existing profile instead
            return await getUserProfile(userId);
        }

        return null;
    }

    return {
        id: data.id,
        email: data.email,
        name: data.full_name || 'User',
        role: data.role as UserRole,
        onboardingStep: data.onboarding_step,
        emailVerified: data.email_verified,
        phone: data.phone,
        address: data.address,
        avatar: data.avatar_url,
        ...data.metadata,
        ...data.preferences
    } as User;
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    if (!data) return null;

    // Map DB fields to User type
    // Note: We need to handle the stored JSONB fields correctly
    return {
        id: data.id,
        email: data.email,
        name: data.full_name || 'User',
        role: data.role as UserRole,
        onboardingStep: data.onboarding_step,
        emailVerified: data.email_verified,
        phone: data.phone,
        address: data.address,
        avatar: data.avatar_url,
        // Merge other fields from metadata if needed, for now returning basic
        ...data.metadata,
        ...data.preferences
    } as User;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {
        updated_at: new Date().toISOString(),
    };

    // Map User interface fields to database columns
    if (updates.name) dbUpdates.full_name = updates.name;
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.onboardingStep !== undefined) dbUpdates.onboarding_step = updates.onboardingStep;
    if (updates.emailVerified !== undefined) dbUpdates.email_verified = updates.emailVerified;
    if (updates.intakeDate) dbUpdates.intake_date = updates.intakeDate;
    if (updates.justFinishedOnboarding !== undefined) dbUpdates.just_finished_onboarding = updates.justFinishedOnboarding;

    // Contact Info
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.address) dbUpdates.address = updates.address;
    if (updates.preferredName) dbUpdates.preferred_name = updates.preferredName;
    if (updates.dob) dbUpdates.dob = updates.dob;
    if (updates.gender) dbUpdates.gender = updates.gender;
    if (updates.preferredLanguage) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.preferredContactMethod) dbUpdates.preferred_contact_method = updates.preferredContactMethod;
    if (updates.avatar) dbUpdates.avatar_url = updates.avatar;

    // HUD Demographics
    if (updates.race) dbUpdates.race = updates.race;
    if (updates.ethnicity) dbUpdates.ethnicity = updates.ethnicity;
    if (updates.veteranStatus !== undefined) dbUpdates.veteran_status = updates.veteranStatus;
    if (updates.maritalStatus) dbUpdates.marital_status = updates.maritalStatus;

    // HUD Household
    if (updates.householdType) dbUpdates.household_type = updates.householdType;
    if (updates.householdSize !== undefined) dbUpdates.household_size = updates.householdSize;
    if (updates.hasMinors !== undefined) dbUpdates.has_minors = updates.hasMinors;
    if (updates.hasSeniors !== undefined) dbUpdates.has_seniors = updates.hasSeniors;

    // HUD Income & Benefits
    if (updates.incomeRange) dbUpdates.income_range = updates.incomeRange;
    if (updates.incomeSources) dbUpdates.income_sources = updates.incomeSources;
    if (updates.nonCashBenefits) dbUpdates.non_cash_benefits = updates.nonCashBenefits;

    // HUD Disability
    if (updates.disabilityStatus !== undefined) dbUpdates.disability_status = updates.disabilityStatus;
    if (updates.disabilityType) dbUpdates.disability_type = updates.disabilityType;
    if (updates.affectsIndependence !== undefined) dbUpdates.affects_independence = updates.affectsIndependence;

    // Accessibility (nested object -> separate columns)
    if (updates.accessibility) {
        if (updates.accessibility.hearing) dbUpdates.accessibility_hearing = updates.accessibility.hearing;
        if (updates.accessibility.vision) dbUpdates.accessibility_vision = updates.accessibility.vision;
        if (updates.accessibility.mobility) dbUpdates.accessibility_mobility = updates.accessibility.mobility;
        if (updates.accessibility.notes) dbUpdates.accessibility_notes = updates.accessibility.notes;
    }

    // Emergency Contact (nested object -> separate columns)
    if (updates.emergencyContact) {
        if (updates.emergencyContact.name) dbUpdates.emergency_contact_name = updates.emergencyContact.name;
        if (updates.emergencyContact.phone) dbUpdates.emergency_contact_phone = updates.emergencyContact.phone;
        if (updates.emergencyContact.relation) dbUpdates.emergency_contact_relation = updates.emergencyContact.relation;
    }

    // Personal Info
    if (updates.pets) dbUpdates.pets = updates.pets;
    if (updates.interestingFacts) dbUpdates.interesting_facts = updates.interestingFacts;
    if (updates.hobbies) dbUpdates.hobbies = updates.hobbies;

    // Volunteer Fields
    if (updates.totalHours !== undefined) dbUpdates.total_hours = updates.totalHours;
    if (updates.badges) dbUpdates.badges = updates.badges;
    if (updates.newBadges) dbUpdates.new_badges = updates.newBadges;
    if (updates.backgroundCheckStatus) dbUpdates.background_check_status = updates.backgroundCheckStatus;
    if (updates.trainingComplete !== undefined) dbUpdates.training_complete = updates.trainingComplete;
    if (updates.languages) dbUpdates.languages = updates.languages;
    if (updates.isDriver !== undefined) dbUpdates.is_driver = updates.isDriver;

    // Compliance
    if (updates.signature) dbUpdates.signature = updates.signature;
    if (updates.waiverAcceptedDate) dbUpdates.waiver_accepted_date = updates.waiverAcceptedDate;

    // Admin
    if (updates.lastActiveDate) dbUpdates.last_active_date = updates.lastActiveDate;

    // Notification Preferences (nested object -> separate columns)
    if (updates.notificationPreferences) {
        if (updates.notificationPreferences.email !== undefined) dbUpdates.notification_email = updates.notificationPreferences.email;
        if (updates.notificationPreferences.sms !== undefined) dbUpdates.notification_sms = updates.notificationPreferences.sms;
        if (updates.notificationPreferences.calendar !== undefined) dbUpdates.notification_calendar = updates.notificationPreferences.calendar;
    }

    // Store notifications in metadata (complex array)
    if (updates.notifications) {
        dbUpdates.metadata = { ...dbUpdates.metadata, notifications: updates.notifications };
    }

    const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

    if (error) {
        throw error;
    }
};
