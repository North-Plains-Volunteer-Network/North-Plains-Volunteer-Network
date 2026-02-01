import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Card, Button, ProgressBar } from '../components/UI';
import { CheckCircle, Circle, PlayCircle, FileText, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TrainingCenterProps {
    user: User;
    onUpdateUser: (updates: Partial<User>) => void;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ user, onUpdateUser }) => {
    const { t } = useTheme();
    const [platformVideoWatched, setPlatformVideoWatched] = useState(false);
    const [safetyVideoWatched, setSafetyVideoWatched] = useState(false);

    // Load existing progress from Supabase on mount
    useEffect(() => {
        const loadProgress = async () => {
            const { getTrainingProgress } = await import('../services/trainingProgressService');
            const { supabase } = await import('../services/supabase');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const progress = await getTrainingProgress(session.user.id);
            if (progress) {
                setPlatformVideoWatched(progress.platform_video_watched || false);
                setSafetyVideoWatched(progress.safety_video_watched || false);
                console.log('✅ Loaded training progress:', progress);
            }
        };

        loadProgress();
    }, []);

    // Save progress to Supabase whenever video status changes
    const saveProgress = async (platform: boolean, safety: boolean) => {
        const { saveTrainingProgress } = await import('../services/trainingProgressService');
        const { supabase } = await import('../services/supabase');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await saveTrainingProgress(session.user.id, {
            platform_video_watched: platform,
            safety_video_watched: safety,
            training_complete: false // Not complete yet
        });

        console.log('✅ Training progress saved:', { platform, safety });
    };

    const handlePlatformVideoWatched = () => {
        setPlatformVideoWatched(true);
        saveProgress(true, safetyVideoWatched);
    };

    const handleSafetyVideoWatched = () => {
        setSafetyVideoWatched(true);
        saveProgress(platformVideoWatched, true);
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

            {/* Platform Tutorial */}
            <Card>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${platformVideoWatched ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                        <PlayCircle className={platformVideoWatched ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Platform Tutorial</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Learn how to use the NPVN platform, accept requests, and communicate with clients.
                        </p>

                        {/* Video Placeholder */}
                        <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center mb-4">
                            <div className="text-center text-white">
                                <PlayCircle size={64} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm opacity-75">Platform Tutorial Video</p>
                                <p className="text-xs opacity-50">(Video placeholder - add your video URL)</p>
                            </div>
                        </div>

                        {!platformVideoWatched && (
                            <Button onClick={handlePlatformVideoWatched} variant="secondary">
                                Mark as Watched
                            </Button>
                        )}
                        {platformVideoWatched && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle size={18} />
                                <span className="font-medium">Completed ✓</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Safety Training */}
            <Card>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${safetyVideoWatched ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        <ShieldCheck className={safetyVideoWatched ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Safety Training</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Required safety protocols, emergency procedures, and best practices for volunteer work.
                        </p>

                        {/* Video Placeholder */}
                        <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center mb-4">
                            <div className="text-center text-white">
                                <ShieldCheck size={64} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm opacity-75">Safety Training Video</p>
                                <p className="text-xs opacity-50">(Video placeholder - add your video URL)</p>
                            </div>
                        </div>

                        {!safetyVideoWatched && (
                            <Button onClick={handleSafetyVideoWatched} variant="secondary">
                                Mark as Watched
                            </Button>
                        )}
                        {safetyVideoWatched && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle size={18} />
                                <span className="font-medium">Completed ✓</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>


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

                            {user.backgroundCheckStatus === 'NOT_STARTED' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        A background check is required before you can start volunteering. This helps ensure the safety of our community members.
                                    </p>
                                    <Button onClick={() => onUpdateUser({ backgroundCheckStatus: 'PENDING' })}>
                                        Submit Background Check Request
                                    </Button>
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
