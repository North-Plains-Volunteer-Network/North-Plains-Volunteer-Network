import React, { useState, useEffect } from 'react';
import { Request, RequestStatus, RequestCategory, User, OnboardingStep } from '../types';
import { Card, Button, StatusBadge } from '../components/UI';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatTimeWithAMPM } from '../services/timeUtils';

export const OpportunitiesPage: React.FC<{
    user: User;
    requests: Request[];
    onAccept: (id: string) => void;
    onNavigate: (p: string) => void;
}> = ({ user, requests, onAccept, onNavigate }) => {
    const { t } = useTheme();
    const [filter, setFilter] = useState<'ALL' | 'GROUP_EVENTS' | RequestCategory>('ALL');

    // Show only PENDING requests that aren't the user's own
    const availableRequests = requests.filter(r =>
        r.status === RequestStatus.PENDING && r.clientId !== user.id
    );

    const filteredRequests = filter === 'ALL'
        ? availableRequests
        : filter === 'GROUP_EVENTS'
            ? availableRequests.filter(r => r.isGroupEvent)
            : availableRequests.filter(r => r.category === filter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Browse Opportunities
                </h2>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                    <option value="ALL">All Categories</option>
                    <option value="GROUP_EVENTS">🎉 Group Events</option>
                    <option value={RequestCategory.RIDE}>Rides</option>
                    <option value={RequestCategory.SHOPPING}>Shopping</option>
                    <option value={RequestCategory.HOME_HELP}>Home Help</option>
                    <option value={RequestCategory.SOCIAL}>Social/Emotional Support</option>
                    <option value={RequestCategory.TECHNOLOGY}>Technology</option>
                </select>
            </div>

            {filteredRequests.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">
                        No opportunities available at this time.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map(req => (
                        <Card key={req.id} className="hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusBadge status={req.category} />
                                        {req.isGroupEvent && (
                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                                                Group Event
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                        {t(`subcategory.${req.subcategory.toLowerCase().replace(/[\\/\\s-]/g, '_')}`) || req.subcategory || req.category}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        {req.description}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={16} />
                                            {req.date}
                                        </div>
                                        {req.timeWindow && (
                                            <div className="flex items-center gap-1">
                                                <Clock size={16} />
                                                {formatTimeWithAMPM(req.timeWindow || '')}
                                            </div>
                                        )}
                                        {req.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin size={16} />
                                                {req.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="success"
                                    onClick={() => onAccept(req.id)}
                                    className="ml-4"
                                >
                                    Accept
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
