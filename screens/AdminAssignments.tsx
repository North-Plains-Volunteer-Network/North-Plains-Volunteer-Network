import React, { useState, useEffect } from 'react';
import { Request, RequestStatus, User } from '../types';
import { Card, Button, Modal, Input, StatWidget } from '../components/UI';
import { Clock, MapPin, Calendar, CheckCircle, AlertTriangle, Heart, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatTimeWithAMPM } from '../services/timeUtils';

interface AdminAssignmentsProps {
    user: User;
    requests: Request[];
    onCompleteRequest: (reqId: string, data: any) => void;
    onWithdraw: (reqId: string, reason: string) => void;
}

// Survey Form Component (reused from Volunteer.tsx logic)
const SurveyForm: React.FC<{ onSubmit: (data: any) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
    const [step, setStep] = useState<'INITIAL' | 'SUCCESS_DETAILS' | 'NO_SHOW' | 'UNABLE'>('INITIAL');
    const [data, setData] = useState<any>({ rating: 5, safety: 'Yes' });

    if (step === 'INITIAL') {
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Was the request completed?</h3>
                <div className="space-y-2">
                    <button
                        className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                        onClick={() => setStep('SUCCESS_DETAILS')}
                    >
                        <span>Yes, it was completed</span>
                        <ArrowRight className="text-slate-300 group-hover:text-brand-500" />
                    </button>
                    <button
                        className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                        onClick={() => setStep('NO_SHOW')}
                    >
                        <span>No, the client did not show up</span>
                        <ArrowRight className="text-slate-300 group-hover:text-amber-500" />
                    </button>
                    <button
                        className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                        onClick={() => setStep('UNABLE')}
                    >
                        <span>No, unable to complete it</span>
                        <ArrowRight className="text-slate-300 group-hover:text-red-500" />
                    </button>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={onCancel}>Cancel</Button>
            </div>
        );
    }

    if (step === 'SUCCESS_DETAILS') {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-lg">Service Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-bold text-sm">Rate your experience (1-5)</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`p-2 rounded-full transition-colors ${data.rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                                    onClick={() => setData({ ...data, rating: star })}
                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                    <Heart size={24} fill={data.rating >= star ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-sm">Did you feel safe?</label>
                        <div className="flex gap-2">
                            {['Yes', 'Maybe', 'No'].map(opt => (
                                <button
                                    key={opt}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors ${data.safety === opt ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-black text-slate-600 border-slate-300'}`}
                                    onClick={() => setData({ ...data, safety: opt })}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <Input label="Hours Spent" type="number" step="0.5" value={data.hours || ''} onChange={e => setData({ ...data, hours: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                        <Input label="Comments (Optional)" placeholder="Any additional notes..." value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep('INITIAL')}>Back</Button>
                    <Button onClick={() => onSubmit({ ...data, status: 'COMPLETED' })}>Submit Report</Button>
                </div>
            </div>
        );
    }

    if (step === 'NO_SHOW') {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-lg text-amber-600">Client No-Show</h3>
                <p className="text-sm text-slate-600">Please provide details about the no-show.</p>

                <Input label="Wait Time" placeholder="e.g. 15 minutes" value={data.waitTime || ''} onChange={e => setData({ ...data, waitTime: e.target.value })} />
                <Input label="Did you attempt to contact the client?" as="select" value={data.contactAttempt || ''} onChange={e => setData({ ...data, contactAttempt: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Yes, called and knocked</option>
                    <option>Yes, called only</option>
                    <option>No</option>
                </Input>
                <Input label="Comments" as="textarea" value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep('INITIAL')}>Back</Button>
                    <Button variant="danger" onClick={() => onSubmit({ ...data, status: 'NO_SHOW' })}>Submit Report</Button>
                </div>
            </div>
        );
    }

    if (step === 'UNABLE') {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-lg">Incomplete Request</h3>
                <Input label="Reason for Incompletion" as="select" value={data.reason || ''} onChange={e => setData({ ...data, reason: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Client Cancelled (on-site)</option>
                    <option>Unsafe Environment</option>
                    <option>Personal Emergency</option>
                    <option>Other</option>
                </Input>
                <Input label="Comments" as="textarea" value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep('INITIAL')}>Back</Button>
                    <Button onClick={() => onSubmit({ ...data, status: 'INCOMPLETE' })}>Submit Report</Button>
                </div>
            </div>
        );
    }

    return null;
};

export const AdminAssignments: React.FC<AdminAssignmentsProps> = ({ user, requests, onCompleteRequest, onWithdraw }) => {
    const { t } = useTheme();
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
    const [withdrawReason, setWithdrawReason] = useState('');

    // Auto-open survey for completed requests (1 hour after service time)
    useEffect(() => {
        const now = new Date();

        const overdue = requests.find(r => {
            const isMyAssignment = (r.volunteerId === user.id && r.status === RequestStatus.MATCHED) ||
                (r.isGroupEvent && r.enrolledVolunteers?.includes(user.id));

            if (!isMyAssignment) return false;

            // Parse Request Date
            const [y, m, d] = r.date.split('-').map(Number);
            let reqDateTime = new Date(y, m - 1, d);

            if (r.timeWindow || r.appointmentTime || r.pickupTime) {
                const timeStr = r.appointmentTime || r.pickupTime || r.timeWindow;
                const match = timeStr?.match(/(\d+):(\d+)/);
                if (match) {
                    let hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    if (timeStr.toLowerCase().includes('pm') && hours < 12) hours += 12;
                    if (timeStr.toLowerCase().includes('am') && hours === 12) hours = 0;
                    reqDateTime.setHours(hours, minutes);
                } else {
                    reqDateTime.setHours(23, 59, 59);
                }
            } else {
                reqDateTime.setHours(23, 59, 59);
            }

            // Add 1 hour delay
            const oneHourAfter = new Date(reqDateTime.getTime() + 60 * 60 * 1000);

            return now >= oneHourAfter;
        });

        if (overdue) {
            setCompletingId(overdue.id);
        }
    }, [requests, user.id]);

    const myAssignments = requests.filter(r => {
        const isSoloMatch = r.volunteerId === user.id && r.status === RequestStatus.MATCHED;
        const isGroupEnrollment = r.isGroupEvent && r.enrolledVolunteers?.includes(user.id);
        return isSoloMatch || isGroupEnrollment;
    });

    const handleWithdraw = () => {
        if (withdrawingId && withdrawReason) {
            onWithdraw(withdrawingId, withdrawReason);
            setWithdrawingId(null);
            setWithdrawReason('');
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatWidget label="Total Hours" value={user.totalHours || 0} icon={<Clock size={20} />} color="bg-brand-500" />
                <StatWidget label="Active Assignments" value={myAssignments.length} icon={<CheckCircle size={20} />} color="bg-emerald-500" />
                <StatWidget label="Completed" value={requests.filter(r => r.volunteerId === user.id && r.status === RequestStatus.COMPLETED).length} icon={<Heart size={20} />} color="bg-purple-500" />
            </div>

            {/* Assignments */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-yellow-400 mb-6">My Volunteer Assignments</h2>

                {myAssignments.length === 0 ? (
                    <Card className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No active assignments. Browse opportunities to get started!
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {myAssignments.map(req => (
                            <Card key={req.id} className="hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t(`category.${req.category}`) || req.category} - {t(`subcategory.${req.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || req.subcategory}</h3>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Active</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{req.description}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center text-slate-600 dark:text-slate-400">
                                                <Calendar size={16} className="mr-2 text-brand-500" />
                                                <span>{req.date} @ {formatTimeWithAMPM(req.timeWindow || req.pickupTime || '')}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 dark:text-slate-400">
                                                <MapPin size={16} className="mr-2 text-brand-500" />
                                                <span>{req.location}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm">
                                            <span className="font-bold">Client:</span> {req.clientName}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 md:w-48">
                                        <Button onClick={() => setCompletingId(req.id)} variant="success" className="w-full">
                                            Complete Service
                                        </Button>
                                        <Button onClick={() => setWithdrawingId(req.id)} variant="outline" className="w-full">
                                            Withdraw
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Survey Modal */}
            {completingId && (
                <Modal isOpen={true} onClose={() => setCompletingId(null)} title="Post-Service Evaluation">
                    <SurveyForm
                        onSubmit={(data) => {
                            onCompleteRequest(completingId, data);
                            setCompletingId(null);
                        }}
                        onCancel={() => setCompletingId(null)}
                    />
                </Modal>
            )}

            {/* Withdraw Modal */}
            {withdrawingId && (
                <Modal isOpen={true} onClose={() => setWithdrawingId(null)} title="Withdraw from Assignment">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Please provide a reason for withdrawing from this assignment.
                        </p>
                        <Input
                            label="Reason"
                            as="textarea"
                            rows={3}
                            value={withdrawReason}
                            onChange={e => setWithdrawReason(e.target.value)}
                            placeholder="e.g., Schedule conflict, personal emergency..."
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setWithdrawingId(null)}>Cancel</Button>
                            <Button variant="danger" onClick={handleWithdraw} disabled={!withdrawReason}>
                                Confirm Withdrawal
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
