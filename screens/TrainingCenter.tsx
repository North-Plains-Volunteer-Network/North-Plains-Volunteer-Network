import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Card, Button, ProgressBar } from '../components/UI';
import { CheckCircle, Circle, PlayCircle, FileText, ShieldCheck, Mail, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TrainingCenterProps {
    user: User;
    onUpdateUser: (updates: Partial<User>) => void;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ user, onUpdateUser }) => {
    const { t } = useTheme();

    // Single-role state (legacy)
    const [platformVideoWatched, setPlatformVideoWatched] = useState(false);
    const [safetyVideoWatched, setSafetyVideoWatched] = useState(false);

    // Dual-role specific state
    const [volunteerPlatformWatched, setVolunteerPlatformWatched] = useState(false);
    const [volunteerSafetyWatched, setVolunteerSafetyWatched] = useState(false);
    const [clientPlatformWatched, setClientPlatformWatched] = useState(false);
    const [clientSafetyWatched, setClientSafetyWatched] = useState(false);


    // Accordion state for expandable sections
    const [expandedSections, setExpandedSections] = useState({
        volunteerPlatform: true,
        volunteerSafety: true,
        clientPlatform: true,
        clientSafety: true,
        singlePlatform: true,
        singleSafety: true,
        volunteerSection: true,  // Entire volunteer training section
        clientSection: true      // Entire client training section
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const isDualRole = user.role === UserRole.CLIENT_VOLUNTEER;

    // Load existing progress from Supabase on mount
    useEffect(() => {
        const loadProgress = async () => {
            const { getTrainingProgress } = await import('../services/trainingProgressService');
            const { supabase } = await import('../services/supabase');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const progress = await getTrainingProgress(session.user.id);
            if (progress) {
                if (isDualRole) {
                    // Load role-specific progress
                    setVolunteerPlatformWatched(progress.volunteer_platform_watched || false);
                    setVolunteerSafetyWatched(progress.volunteer_safety_watched || false);
                    setClientPlatformWatched(progress.client_platform_watched || false);
                    setClientSafetyWatched(progress.client_safety_watched || false);
                } else {
                    // Load legacy single-role progress
                    setPlatformVideoWatched(progress.platform_video_watched || false);
                    setSafetyVideoWatched(progress.safety_video_watched || false);
                }
                console.log('✅ Loaded training progress:', progress);
            }
        };

        loadProgress();
    }, [isDualRole]);

    // Save progress to Supabase whenever video status changes
    const saveProgress = async (role: 'volunteer' | 'client' | 'single', platform: boolean, safety: boolean) => {
        const { saveTrainingProgress } = await import('../services/trainingProgressService');
        const { supabase } = await import('../services/supabase');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (isDualRole) {
            await saveTrainingProgress(session.user.id, {
                volunteer_platform_watched: role === 'volunteer' ? platform : volunteerPlatformWatched,
                volunteer_safety_watched: role === 'volunteer' ? safety : volunteerSafetyWatched,
                client_platform_watched: role === 'client' ? platform : clientPlatformWatched,
                client_safety_watched: role === 'client' ? safety : clientSafetyWatched,
                training_complete: false
            });
        } else {
            await saveTrainingProgress(session.user.id, {
                platform_video_watched: platform,
                safety_video_watched: safety,
                training_complete: false
            });
        }

        console.log('✅ Training progress saved:', { role, platform, safety });
    };

    const handlePlatformVideoWatched = () => {
        setPlatformVideoWatched(true);
        saveProgress('single', true, safetyVideoWatched);
    };

    const handleSafetyVideoWatched = () => {
        setSafetyVideoWatched(true);
        saveProgress('single', platformVideoWatched, true);
    };

    // Volunteer training handlers
    const handleVolunteerPlatformWatched = () => {
        setVolunteerPlatformWatched(true);
        saveProgress('volunteer', true, volunteerSafetyWatched);
    };

    const handleVolunteerSafetyWatched = () => {
        setVolunteerSafetyWatched(true);
        saveProgress('volunteer', volunteerPlatformWatched, true);
    };

    // Client training handlers
    const handleClientPlatformWatched = () => {
        setClientPlatformWatched(true);
        saveProgress('client', true, clientSafetyWatched);
    };

    const handleClientSafetyWatched = () => {
        setClientSafetyWatched(true);
        saveProgress('client', clientPlatformWatched, true);
    };

    // Calculate completion status
    const emailVerified = user.emailVerified || false;
    const backgroundCheckSubmitted = user.backgroundCheckStatus !== 'NOT_STARTED';
    const trainingComplete = user.trainingComplete || false;

    // Background check only required for volunteers and dual users
    const needsBackgroundCheck = user.role === UserRole.VOLUNTEER || user.role === UserRole.CLIENT_VOLUNTEER;

    const requirements = [
        { id: 'email', label: 'Email Verification', completed: emailVerified },
        { id: 'platform', label: 'Platform Tutorial', completed: platformVideoWatched },
        { id: 'safety', label: 'Safety Training', completed: safetyVideoWatched },
        ...(needsBackgroundCheck ? [{ id: 'background', label: 'Background Check', completed: backgroundCheckSubmitted }] : [])
    ];

    const completedCount = requirements.filter(r => r.completed).length;
    const totalCount = requirements.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);

    const handleMarkTrainingComplete = async () => {
        if (completedCount === totalCount) {
            // Import training progress service
            const { saveTrainingProgress } = await import('../services/trainingProgressService');
            const { supabase } = await import('../services/supabase');

            // Get the authenticated user's UUID
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Save training progress to Supabase
            await saveTrainingProgress(session.user.id, {
                platform_video_watched: platformVideoWatched,
                safety_video_watched: safetyVideoWatched,
                training_complete: true
            });

            // Update user's trainingComplete flag
            onUpdateUser({ trainingComplete: true });
        }
    };

    // Helper render function for Platform Tutorial (reusable for both roles)
    const renderPlatformTutorial = (role: 'volunteer' | 'client' | 'single', watched: boolean, handler: () => void) => {
        const roleLabel = role === 'volunteer' ? ' (Volunteer)' : role === 'client' ? ' (Client)' : '';
        const sectionKey = role === 'volunteer' ? 'volunteerPlatform' : role === 'client' ? 'clientPlatform' : 'singlePlatform';
        const isExpanded = expandedSections[sectionKey];

        return (
            <Card>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900">
                        <PlayCircle className="text-brand-600 dark:text-brand-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(sectionKey)}
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Platform Tutorial{roleLabel}
                            </h3>
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        {isExpanded && (
                            <>
                                {!watched ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Watch this 3-minute video to learn how to use the NPVN platform.
                                        </p>
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                            <iframe
                                                className="w-full h-full"
                                                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                title={`Platform Tutorial${roleLabel}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <Button onClick={handler}>
                                            Mark as Watched
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle size={18} />
                                        <span className="font-medium">Video completed ✓</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    // Helper render function for Safety Training (reusable for both roles)
    const renderSafetyTraining = (role: 'volunteer' | 'client' | 'single', watched: boolean, handler: () => void) => {
        const roleLabel = role === 'volunteer' ? ' (Volunteer)' : role === 'client' ? ' (Client)' : '';
        const sectionKey = role === 'volunteer' ? 'volunteerSafety' : role === 'client' ? 'clientSafety' : 'singleSafety';
        const isExpanded = expandedSections[sectionKey];

        return (
            <Card>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                        <ShieldCheck className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(sectionKey)}
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Safety Training{roleLabel}
                            </h3>
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        {isExpanded && (
                            <>
                                {!watched ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Learn about safety protocols and best practices.
                                        </p>
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                            <iframe
                                                className="w-full h-full"
                                                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                title={`Safety Training${roleLabel}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <Button onClick={handler}>
                                            Mark as Watched
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle size={18} />
                                        <span className="font-medium">Video completed ✓</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {user.role === UserRole.CLIENT ? 'Client Training Center' :
                        user.role === UserRole.VOLUNTEER ? 'Volunteer Training Center' :
                            'Dual User Training Center'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    {user.role === UserRole.CLIENT
                        ? 'Complete all requirements to start requesting services'
                        : 'Complete all requirements to start volunteering'}
                </p>
            </div>

            {/* Progress Overview */}
            <Card className="bg-gradient-to-r from-brand-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-brand-200">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Progress</h2>
                        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                            {completedCount}/{totalCount}
                        </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4">
                        <div
                            className="bg-gradient-to-r from-brand-500 to-brand-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        {requirements.map(req => (
                            <div key={req.id} className="flex items-center gap-2 text-sm">
                                {req.completed ? (
                                    <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                                ) : (
                                    <Circle className="text-slate-400" size={18} />
                                )}
                                <span className={req.completed ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}>
                                    {req.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {completedCount === totalCount && !trainingComplete && (
                        <div className="pt-4 border-t border-brand-200 dark:border-slate-600">
                            <Button onClick={handleMarkTrainingComplete} className="w-full">
                                ✅ Mark Training Complete & Start Volunteering
                            </Button>
                        </div>
                    )}

                    {trainingComplete && (
                        <div className="pt-4 border-t border-brand-200 dark:border-slate-600 text-center">
                            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-bold">
                                <CheckCircle size={24} />
                                <span>Training Complete! You can now accept requests.</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Email Verification */}
            <Card>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${emailVerified ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                        <Mail className={emailVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Verification</h3>
                        {emailVerified ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle size={18} />
                                <span className="font-medium">Email verified ✓</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <AlertCircle size={18} />
                                    <span className="font-medium">Verification email sent to {user.email}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Please check your inbox and click the verification link to continue.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const { supabase } = await import('../services/supabase');
                                        const { error } = await supabase.auth.resend({
                                            type: 'signup',
                                            email: user.email!
                                        });
                                        if (error) {
                                            alert('Failed to resend email. Please try again.');
                                        } else {
                                            alert('Verification email sent! Please check your inbox.');
                                        }
                                    }}
                                >
                                    <Mail size={16} className="mr-2" />
                                    Resend Verification Email
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Conditional: Dual Role vs Single Role Training */}
            {isDualRole ? (
                <>
                    {/* Volunteer Training Section */}
                    <div className="space-y-4">
                        <div
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 cursor-pointer"
                            onClick={() => toggleSection('volunteerSection')}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                        🙋‍♂️ Volunteer Training
                                    </h2>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Complete this section for your volunteer role
                                    </p>
                                </div>
                                <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded">
                                    {expandedSections.volunteerSection ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </button>
                            </div>
                        </div>

                        {expandedSections.volunteerSection && (
                            <>
                                {renderPlatformTutorial('volunteer', volunteerPlatformWatched, handleVolunteerPlatformWatched)}
                                {renderSafetyTraining('volunteer', volunteerSafetyWatched, handleVolunteerSafetyWatched)}
                            </>
                        )}
                    </div>


                    {/* Client Training Section */}
                    <div className="space-y-4">
                        <div
                            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 cursor-pointer"
                            onClick={() => toggleSection('clientSection')}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                                        🤝 Client Training
                                    </h2>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Complete this section for your client role
                                    </p>
                                </div>
                                <button className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded">
                                    {expandedSections.clientSection ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </button>
                            </div>
                        </div>

                        {expandedSections.clientSection && (
                            <>
                                {renderPlatformTutorial('client', clientPlatformWatched, handleClientPlatformWatched)}
                                {renderSafetyTraining('client', clientSafetyWatched, handleClientSafetyWatched)}
                            </>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Single Role Training */}
                    {renderPlatformTutorial('single', platformVideoWatched, handlePlatformVideoWatched)}
                    {renderSafetyTraining('single', safetyVideoWatched, handleSafetyVideoWatched)}
                </>
            )}

            {/* Background Check - Only for Volunteers and Dual Users */}
            {needsBackgroundCheck && (
                <Card>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${user.backgroundCheckStatus === 'APPROVED' ? 'bg-green-100 dark:bg-green-900' :
                            user.backgroundCheckStatus === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900' :
                                user.backgroundCheckStatus === 'REJECTED' ? 'bg-red-100 dark:bg-red-900' :
                                    'bg-slate-100 dark:bg-slate-800'
                            }`}>
                            <ShieldCheck className={
                                user.backgroundCheckStatus === 'APPROVED' ? 'text-green-600 dark:text-green-400' :
                                    user.backgroundCheckStatus === 'PENDING' ? 'text-amber-600 dark:text-amber-400' :
                                        user.backgroundCheckStatus === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                            'text-slate-600 dark:text-slate-400'
                            } size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Background Check</h3>

                            {/* Background Check Questions Status */}
                            <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Background Check Questions
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Complete the required questions before submitting your background check
                                        </p>
                                    </div>
                                    {user.backgroundCheckQuestionsComplete ? (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-medium">Complete ✓</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <AlertCircle size={18} />
                                            <span className="text-sm font-medium">Incomplete</span>
                                        </div>
                                    )}
                                </div>

                                {!user.backgroundCheckQuestionsComplete && (
                                    <Button
                                        onClick={() => {
                                            // Navigate to intake form or open modal
                                            window.location.href = '/volunteer-intake#background-check';
                                        }}
                                        variant="secondary"
                                        className="mt-3"
                                    >
                                        Complete Background Check Questions
                                    </Button>
                                )}
                            </div>

                            {/* Background Check Submission Status */}
                            {user.backgroundCheckStatus === 'NOT_STARTED' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        A background check is required before you can start volunteering. This helps ensure the safety of our community members.
                                    </p>
                                    <Button
                                        onClick={() => onUpdateUser({ backgroundCheckStatus: 'PENDING' })}
                                        disabled={!user.backgroundCheckQuestionsComplete}
                                    >
                                        Submit Background Check Request
                                    </Button>
                                    {!user.backgroundCheckQuestionsComplete && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            Please complete the background check questions first
                                        </p>
                                    )}
                                </div>
                            )}

                            {user.backgroundCheckStatus === 'PENDING' && (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <AlertCircle size={18} />
                                    <span className="font-medium">Background check in progress...</span>
                                </div>
                            )}

                            {user.backgroundCheckStatus === 'APPROVED' && (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle size={18} />
                                    <span className="font-medium">Background check approved ✓</span>
                                </div>
                            )}

                            {user.backgroundCheckStatus === 'REJECTED' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <AlertCircle size={18} />
                                        <span className="font-medium">Background check not approved</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Please contact the coordinator for more information.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
