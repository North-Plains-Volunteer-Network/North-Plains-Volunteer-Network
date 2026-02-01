import React, { useState, useEffect } from 'react';
import { User, UserRole, OnboardingStep } from '../types';
import { Card, Button, Input, ProgressBar, WaiverForm } from '../components/UI';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';

interface UnifiedOnboardingProps {
    user: User;
    onUpdate: (u: Partial<User>) => void;
    onNavigate: (p: string) => void;
}

/**
 * UNIFIED ONBOARDING FORM
 * This single form is used for ALL user types (CLIENT, VOLUNTEER, CLIENT_VOLUNTEER)
 * It collects EVERY piece of information needed for complete profiles
 */
export const UnifiedOnboarding: React.FC<UnifiedOnboardingProps> = ({ user, onUpdate, onNavigate }) => {
    const { t } = useTheme();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        ...user,
        incomeSources: user.incomeSources || [],
        nonCashBenefits: user.nonCashBenefits || [],
        languages: user.languages || [],
        hobbies: user.hobbies || []
    });

    // Language selection logic
    const STANDARD_LANGUAGES = ['English', 'Spanish'];
    const [langSelect, setLangSelect] = useState<string>('');

    useEffect(() => {
        if (formData.preferredLanguage && STANDARD_LANGUAGES.includes(formData.preferredLanguage)) {
            setLangSelect(formData.preferredLanguage);
        } else if (formData.preferredLanguage) {
            setLangSelect('Other');
        } else {
            setLangSelect('');
        }
    }, []);

    const handleLanguageChange = (val: string) => {
        setLangSelect(val);
        if (val !== 'Other') {
            setFormData(prev => ({ ...prev, preferredLanguage: val }));
        } else {
            setFormData(prev => ({ ...prev, preferredLanguage: '' }));
        }
    };

    const toggleArrayItem = (field: 'incomeSources' | 'nonCashBenefits' | 'languages' | 'hobbies', item: string) => {
        const current = formData[field] || [];
        if (current.includes(item)) {
            setFormData({ ...formData, [field]: current.filter(i => i !== item) });
        } else {
            setFormData({ ...formData, [field]: [...current, item] });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateStep = (currentStep: number): boolean => {
        setError(null);
        switch (currentStep) {
            case 1: // Personal Profile
                if (!formData.name || !formData.dob || !formData.gender) {
                    setError('Please fill in all required fields');
                    return false;
                }
                break;
            case 2: // Demographics
                if (!formData.ethnicity || !formData.race || !formData.preferredLanguage || !formData.maritalStatus) {
                    setError('Please fill in all required fields');
                    return false;
                }
                if (langSelect === 'Other' && !formData.preferredLanguage) {
                    setError('Please specify your preferred language');
                    return false;
                }
                break;
            case 3: // Household & Income
                if (!formData.householdType || !formData.householdSize || !formData.incomeRange) {
                    setError('Please fill in all required fields');
                    return false;
                }
                break;
            case 4: // Disability & Accessibility
                if (formData.disabilityStatus === undefined) {
                    setError('Please answer the disability question');
                    return false;
                }
                if (formData.disabilityStatus === true && (!formData.disabilityType || formData.affectsIndependence === undefined)) {
                    setError('Please provide disability details');
                    return false;
                }
                break;
            case 5: // Contact & Personal
                if (!formData.phone && !formData.email) {
                    setError('Please provide either a phone number or email address');
                    return false;
                }
                if (!formData.preferredContactMethod) {
                    setError('Please select your preferred contact method');
                    return false;
                }
                if (!formData.emergencyContact?.name || !formData.emergencyContact?.phone || !formData.emergencyContact?.relation) {
                    setError('Emergency contact details are required');
                    return false;
                }
                break;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleFinish = async () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        let adminNotes = user.adminNotes || '';
        if (formData.dob && new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18) {
            adminNotes += '\n[SYSTEM]: User identified as minor (Under 18). Guardian permission required.';
        }

        // Send email verification now that intake is complete
        // Note: This requires "Confirm email" to be ON in Supabase settings
        try {
            const { supabase } = await import('../services/supabase');

            // Method 1: Try to send verification email via resend
            const { data, error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email
            });

            if (error) {
                console.error('❌ Failed to send verification email via resend:', error.message);
                console.log('💡 Make sure "Confirm email" is enabled in Supabase → Authentication → Providers → Email');
            } else {
                console.log('✅ Verification email sent successfully to:', user.email);
                console.log('Response:', data);
            }
        } catch (error) {
            console.error('❌ Exception sending verification email:', error);
        }

        onUpdate({
            ...formData,
            adminNotes,
            onboardingStep: OnboardingStep.COMPLETE,
            intakeDate: new Date().toISOString().split('T')[0],
            justFinishedOnboarding: true,
            // Set background check status for volunteers
            ...(user.role === UserRole.VOLUNTEER || user.role === UserRole.CLIENT_VOLUNTEER ? { backgroundCheckStatus: 'NOT_STARTED' } : {})
        });
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                {t('onboarding.welcome_title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-center mb-8">
                {t('onboarding.welcome_desc')}
            </p>

            <ProgressBar
                current={step}
                total={6}
                labels={[
                    t('onboarding.step_1_title').split(': ')[1] || 'Profile',
                    t('onboarding.step_2_title').split(': ')[1] || 'Demographics',
                    t('onboarding.step_3_title').split(': ')[1] || 'Household',
                    t('onboarding.step_4_title').split(': ')[1] || 'Accessibility',
                    t('onboarding.step_5_title').split(': ')[1] || 'Contact',
                    t('onboarding.waiver') || 'Waiver'
                ]}
            />

            {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertTriangle size={18} />
                    <span className="font-bold">{error}</span>
                </div>
            )}

            <Card>
                {/* STEP 1: Personal Profile & Contact Basics */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">{t('onboarding.step_1_title')}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('onboarding.first_name')}
                                value={formData.name?.split(' ')[0] || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Input
                                label={t('onboarding.last_name')}
                                placeholder="Smith"
                            />
                        </div>

                        <Input
                            label={t('onboarding.preferred_name')}
                            value={formData.preferredName || ''}
                            onChange={e => setFormData({ ...formData, preferredName: e.target.value })}
                        />

                        <Input
                            label={t('onboarding.address')}
                            value="North Plains, OR 97133"
                            disabled
                            className="bg-slate-50 dark:bg-slate-800"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    label={t('onboarding.dob')}
                                    type="date"
                                    value={formData.dob || ''}
                                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                />
                                {formData.dob && new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18 && (
                                    <p className="text-xs text-amber-600 font-bold mt-1 animate-in fade-in bg-amber-50 p-2 rounded border border-amber-200">
                                        {t('onboarding.minor_warning')}
                                    </p>
                                )}
                            </div>
                            <Input
                                label={t('onboarding.gender')}
                                as="select"
                                value={formData.gender || ''}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="Female">{t('onboarding.female')}</option>
                                <option value="Male">{t('onboarding.male')}</option>
                                <option value="Non-binary">{t('onboarding.non_binary')}</option>
                                <option value="Prefer not to say">{t('onboarding.prefer_not_say')}</option>
                            </Input>
                        </div>

                        <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded border border-blue-200 dark:border-slate-600">
                            <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                                <ShieldCheck size={18} className="mr-2" />
                                {t('onboarding.profile_photo')}
                            </label>
                            <Input
                                label=""
                                type="file"
                                className="bg-white dark:bg-black"
                                onChange={(e) => handleFileUpload(e as React.ChangeEvent<HTMLInputElement>, 'avatar')}
                            />
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mt-2">
                                "{t('onboarding.photo_desc')}"
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleNext}>{t('common.next')}</Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Demographics (HUD) */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">{t('onboarding.step_2_title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('onboarding.hud_desc')}</p>

                        <Input
                            label={t('onboarding.ethnicity')}
                            as="select"
                            value={formData.ethnicity || ''}
                            onChange={e => setFormData({ ...formData, ethnicity: e.target.value as any })}
                        >
                            <option value="">{t('common.select')}</option>
                            <option value="Hispanic/Latino">{t('onboarding.hispanic')}</option>
                            <option value="Not Hispanic/Latino">{t('onboarding.not_hispanic')}</option>
                        </Input>

                        <Input
                            label={t('onboarding.race')}
                            as="select"
                            value={formData.race || ''}
                            onChange={e => setFormData({ ...formData, race: e.target.value })}
                        >
                            <option value="">{t('common.select')}</option>
                            <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                            <option value="Asian">Asian</option>
                            <option value="Black or African American">Black or African American</option>
                            <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                            <option value="White">White</option>
                            <option value="Multi-Racial">Multi-Racial</option>
                        </Input>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('onboarding.veteran_status')}
                                as="select"
                                value={formData.veteranStatus !== undefined ? (formData.veteranStatus ? 'Yes' : 'No') : ''}
                                onChange={e => setFormData({ ...formData, veteranStatus: e.target.value === 'Yes' })}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="Yes">{t('onboarding.is_veteran')}</option>
                                <option value="No">{t('common.no')}</option>
                            </Input>

                            <Input
                                label={t('onboarding.marital_status')}
                                as="select"
                                value={formData.maritalStatus || ''}
                                onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="Single">{t('onboarding.single')}</option>
                                <option value="Married">{t('onboarding.married')}</option>
                                <option value="Widowed">{t('onboarding.widowed')}</option>
                                <option value="Divorced">{t('onboarding.divorced')}</option>
                            </Input>
                        </div>

                        <div>
                            <Input
                                label={t('onboarding.preferred_language')}
                                as="select"
                                value={langSelect}
                                onChange={e => handleLanguageChange(e.target.value)}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="Other">{t('common.other')}</option>
                            </Input>
                            {langSelect === 'Other' && (
                                <Input
                                    label={t('onboarding.specify_language')}
                                    value={formData.preferredLanguage || ''}
                                    onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                />
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                            <Button onClick={handleNext}>{t('common.next')}</Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Household & Income (HUD) */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">{t('onboarding.step_3_title')}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('onboarding.household_type')}
                                as="select"
                                value={formData.householdType || ''}
                                onChange={e => setFormData({ ...formData, householdType: e.target.value })}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="Single Adult">{t('onboarding.single_adult')}</option>
                                <option value="Couple">{t('onboarding.couple')}</option>
                                <option value="Family with Children">{t('onboarding.family_children')}</option>
                                <option value="Multi-generational">{t('onboarding.multi_gen')}</option>
                            </Input>
                            <Input
                                label={t('onboarding.household_size')}
                                type="number"
                                value={formData.householdSize || ''}
                                onChange={e => setFormData({ ...formData, householdSize: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 text-sm dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={formData.hasMinors || false}
                                    onChange={e => setFormData({ ...formData, hasMinors: e.target.checked })}
                                />
                                {t('onboarding.includes_minors')}
                            </label>
                            <label className="flex items-center gap-2 text-sm dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={formData.hasSeniors || false}
                                    onChange={e => setFormData({ ...formData, hasSeniors: e.target.checked })}
                                />
                                {t('onboarding.includes_seniors')}
                            </label>
                        </div>

                        <div className="border-t pt-4">
                            <Input
                                label={t('onboarding.income_range')}
                                as="select"
                                value={formData.incomeRange || ''}
                                onChange={e => setFormData({ ...formData, incomeRange: e.target.value })}
                            >
                                <option value="">{t('common.select')}</option>
                                <option value="0-30k">{t('onboarding.income_under_30k')}</option>
                                <option value="30k-50k">{t('onboarding.income_30k_50k')}</option>
                                <option value="50k-80k">{t('onboarding.income_50k_80k')}</option>
                                <option value="80k+">{t('onboarding.income_80k_plus')}</option>
                            </Input>

                            <div className="mt-2">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('onboarding.income_sources')}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {['Wages', 'Social Security', 'SSI', 'SSDI', 'Pension', 'Unemployment', 'None'].map(src => (
                                        <label key={src} className="flex items-center gap-2 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.incomeSources?.includes(src)}
                                                onChange={() => toggleArrayItem('incomeSources', src)}
                                            />
                                            {src}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('onboarding.non_cash')}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {['SNAP', 'WIC', 'TANF', 'VA Benefits', 'Housing Voucher'].map(ben => (
                                        <label key={ben} className="flex items-center gap-2 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.nonCashBenefits?.includes(ben)}
                                                onChange={() => toggleArrayItem('nonCashBenefits', ben)}
                                            />
                                            {ben}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                            <Button onClick={handleNext}>{t('common.next')}</Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Disability & Accessibility */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">{t('onboarding.step_4_title')}</h2>

                        <Input
                            label={t('onboarding.has_disability')}
                            as="select"
                            value={formData.disabilityStatus !== undefined ? (formData.disabilityStatus ? 'Yes' : 'No') : ''}
                            onChange={e => setFormData({ ...formData, disabilityStatus: e.target.value === 'Yes' })}
                        >
                            <option value="">{t('common.select')}</option>
                            <option value="Yes">{t('common.yes')}</option>
                            <option value="No">{t('common.no')}</option>
                        </Input>

                        {formData.disabilityStatus && (
                            <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                <Input
                                    label={t('onboarding.disability_type')}
                                    placeholder={t('onboarding.disability_placeholder')}
                                    value={formData.disabilityType || ''}
                                    onChange={e => setFormData({ ...formData, disabilityType: e.target.value })}
                                />
                                <Input
                                    label={t('onboarding.affects_independence')}
                                    as="select"
                                    value={formData.affectsIndependence !== undefined ? (formData.affectsIndependence ? 'Yes' : 'No') : ''}
                                    onChange={e => setFormData({ ...formData, affectsIndependence: e.target.value === 'Yes' })}
                                >
                                    <option value="">{t('common.select')}</option>
                                    <option value="Yes">{t('common.yes')}</option>
                                    <option value="No">{t('common.no')}</option>
                                </Input>
                            </div>
                        )}

                        <div className="space-y-3 border-t pt-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">{t('onboarding.functional_needs')}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <Input
                                    label={t('onboarding.hearing_impaired')}
                                    as="select"
                                    onChange={e => setFormData({
                                        ...formData,
                                        accessibility: { ...(formData.accessibility || { vision: 'Unknown', mobility: "" }), hearing: e.target.value }
                                    })}
                                >
                                    <option value="Unknown">{t('common.unknown')}</option>
                                    <option value="Yes">{t('common.yes')}</option>
                                    <option value="No">{t('common.no')}</option>
                                </Input>
                                <Input
                                    label={t('onboarding.vision_impaired')}
                                    as="select"
                                    onChange={e => setFormData({
                                        ...formData,
                                        accessibility: { ...(formData.accessibility || { hearing: 'Unknown', mobility: "" }), vision: e.target.value }
                                    })}
                                >
                                    <option value="Unknown">{t('common.unknown')}</option>
                                    <option value="Yes">{t('common.yes')}</option>
                                    <option value="No">{t('common.no')}</option>
                                </Input>
                            </div>
                            <Input
                                label={t('onboarding.mobility_needs')}
                                as="select"
                                value={formData.accessibility?.mobility || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    accessibility: { ...(formData.accessibility || { hearing: 'Unknown', vision: 'Unknown' }), mobility: e.target.value }
                                })}
                            >
                                <option value="">{t('common.none')} / {t('common.unknown')}</option>
                                <option value="Walker">{t('onboarding.walker')}</option>
                                <option value="Wheelchair">{t('onboarding.wheelchair')}</option>
                                <option value="Stairs difficult">{t('onboarding.stairs_difficult')}</option>
                            </Input>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                            <Button onClick={handleNext}>{t('common.next')}</Button>
                        </div>
                    </div>
                )}

                {/* STEP 5: Contact & Personal Info */}
                {step === 5 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">{t('onboarding.step_5_title')}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('common.phone')}
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label={t('common.email')}
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <Input
                            label={t('onboarding.preferred_contact')}
                            as="select"
                            value={formData.preferredContactMethod || ''}
                            onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value as any })}
                        >
                            <option value="">{t('common.select')}</option>
                            <option value="Call">{t('onboarding.contact_call')}</option>
                            <option value="Text">{t('onboarding.contact_text')}</option>
                            <option value="Email">{t('onboarding.contact_email')}</option>
                        </Input>

                        <h3 className="font-bold text-slate-700 dark:text-slate-300 pt-2">{t('onboarding.emergency_contact')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('common.name')}
                                value={formData.emergencyContact?.name || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    emergencyContact: { ...(formData.emergencyContact || { phone: '', relation: '' }), name: e.target.value }
                                })}
                            />
                            <Input
                                label={t('common.phone')}
                                value={formData.emergencyContact?.phone || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    emergencyContact: { ...(formData.emergencyContact || { name: '', relation: '' }), phone: e.target.value }
                                })}
                            />
                        </div>
                        <Input
                            label={t('onboarding.relationship')}
                            value={formData.emergencyContact?.relation || ''}
                            onChange={e => setFormData({
                                ...formData,
                                emergencyContact: { ...(formData.emergencyContact || { name: '', phone: '' }), relation: e.target.value }
                            })}
                        />

                        <div className="space-y-2 border-t pt-4">
                            <label className="font-medium text-slate-700 dark:text-slate-300">{t('onboarding.pets')}</label>
                            <Input
                                label={t('onboarding.pet_details')}
                                placeholder={t('onboarding.pet_placeholder')}
                                value={formData.pets || ''}
                                onChange={e => setFormData({ ...formData, pets: e.target.value })}
                            />
                        </div>

                        <Input
                            label={t('onboarding.hobbies')}
                            as="textarea"
                            value={formData.hobbies?.join(', ') || ''}
                            onChange={e => setFormData({ ...formData, hobbies: e.target.value.split(', ').filter(h => h.trim()) })}
                        />

                        <div className="space-y-2 border-t pt-4">
                            <label className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('onboarding.languages')}</label>
                            <div className="flex gap-2 flex-wrap">
                                {['English', 'Spanish', 'French', 'Sign Language', 'Other'].map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${(formData.languages || []).includes(lang)
                                            ? 'bg-brand-600 text-white border-brand-600'
                                            : 'bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                                            }`}
                                        onClick={() => toggleArrayItem('languages', lang)}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <input
                                type="checkbox"
                                id="driver-unified"
                                className="w-5 h-5 rounded text-brand-600"
                                checked={formData.isDriver || false}
                                onChange={e => setFormData({ ...formData, isDriver: e.target.checked })}
                            />
                            <label htmlFor="driver-unified" className="font-medium text-slate-700 dark:text-slate-300">
                                {t('onboarding.is_driver')}
                            </label>
                        </div>

                        <div className="flex justify-between pt-6">
                            <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                            <Button onClick={handleNext}>{t('common.next')}</Button>
                        </div>
                    </div>
                )}

                {/* STEP 6: Waiver */}
                {step === 6 && (
                    <WaiverForm
                        onAcknowledge={(sig) => {
                            setFormData(prev => ({
                                ...prev,
                                signature: sig,
                                waiverAcceptedDate: new Date().toISOString().split('T')[0]
                            }));
                            handleFinish();
                        }}
                        onBack={() => setStep(5)}
                    />
                )}
            </Card>
        </div>
    );
};
