/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Request, RequestStatus, BadgeDef, User, OnboardingStep, RequestCategory, UserRole } from '../types';
import { BADGES, MOCK_USERS } from '../services/mockData';
import { Card, Button, StatusBadge, StatWidget, Modal, Input, ProgressBar, CalendarWidget, Accordion, NeedHelpCard, WaiverForm } from '../components/UI';
import { Calendar, MapPin, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, User as UserIcon, Car, ShoppingBasket, Heart, Home, HelpCircle, Phone, Mail, ShieldCheck, ExternalLink, FileText, CreditCard, X, BookOpen, Globe, Bus, ShieldAlert, PlayCircle, Lightbulb, Lock, Utensils, Map, Info, CalendarPlus, ArrowRight, Settings, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { formatTimeWithAMPM } from '../services/timeUtils';
import { OnboardingNextStepsModal } from './Client';
import { downloadICS } from '../utils/export';
import { UnifiedOnboarding } from './UnifiedOnboarding';

interface VolunteerProps {
   user: User;
   requests: Request[];
   onAccept: (id: string) => void;
   onNavigate: (p: string) => void;
   onUpdateUser: (u: Partial<User>) => void;
   onCompleteRequest: (reqId: string, data: any) => void;
   onWithdraw: (reqId: string, reason: string) => void;
}

// --- Post Service Survey Component ---
const SurveyForm: React.FC<{ onSubmit: (data: any) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
   const { t } = useTheme();
   const [step, setStep] = useState<'INITIAL' | 'SUCCESS_DETAILS' | 'NO_SHOW' | 'UNABLE'>('INITIAL');
   const [data, setData] = useState<any>({ rating: 5, safety: 'Yes' }); // Default values

   if (step === 'INITIAL') {
      return (
         <div className="space-y-4" title={t('survey.was_completed')} aria-label={t('survey.was_completed')}>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('survey.was_completed')}</h3>
            <div className="space-y-2">
               <button
                  className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                  onClick={() => setStep('SUCCESS_DETAILS')}
               >
                  <span>{t('survey.status_completed')}</span>
                  <ArrowRight className="text-slate-300 group-hover:text-brand-500" />
               </button>
               <button
                  className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                  onClick={() => setStep('NO_SHOW')}
               >
                  <span>{t('survey.status_no_show')}</span>
                  <ArrowRight className="text-slate-300 group-hover:text-amber-500" />
               </button>
               <button
                  className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-all font-bold text-left flex items-center justify-between group"
                  onClick={() => setStep('UNABLE')}
               >
                  <span>{t('survey.status_unable')}</span>
                  <ArrowRight className="text-slate-300 group-hover:text-red-500" />
               </button>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={onCancel}>{t('common.cancel')}</Button>
         </div>
      );
   }

   if (step === 'SUCCESS_DETAILS') {
      return (
         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-lg">{t('survey.request_details')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="font-bold text-sm">{t('survey.rating_label')}</label>
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
                  <label className="font-bold text-sm">{t('survey.safe_label')}</label>
                  <div className="flex gap-2">
                     {['Yes', 'Maybe', 'No'].map(opt => (
                        <button
                           key={opt}
                           className={`flex - 1 py - 2 rounded - lg border text - sm font - bold transition - colors ${data.safety === opt ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-black text-slate-600 border-slate-300'} `}
                           onClick={() => setData({ ...data, safety: opt })}
                        >
                           {opt === 'Yes' ? t('common.yes') : opt === 'No' ? t('common.no') : t('common.maybe')}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-1">
                  <Input label={t('survey.hours_spent')} type="number" step="0.5" value={data.hours || ''} onChange={e => setData({ ...data, hours: e.target.value })} />
               </div>
               <div className="md:col-span-3">
                  <Input label={t('survey.comments_label')} placeholder={t('survey.comments_placeholder')} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />
               </div>
            </div>

            <div className="flex justify-between pt-4">
               <Button variant="outline" onClick={() => setStep('INITIAL')}>{t('common.back')}</Button>
               <Button onClick={() => onSubmit({ ...data, status: 'COMPLETED' })}>{t('survey.submit_report')}</Button>
            </div>
         </div>
      );
   }

   if (step === 'NO_SHOW') {
      return (
         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-lg text-amber-600">{t('survey.no_show_title')}</h3>
            <p className="text-sm text-slate-600">{t('survey.no_show_desc')}</p>

            <Input label={t('survey.wait_time')} placeholder="e.g. 15 minutes" value={data.waitTime || ''} onChange={e => setData({ ...data, waitTime: e.target.value })} />
            <Input label={t('survey.contact_attempt')} aria-label={t('survey.contact_attempt')} title={t('survey.contact_attempt')} id="contactAttempt" as="select" value={data.contactAttempt || ''} onChange={e => setData({ ...data, contactAttempt: e.target.value })}>
               <option value="">{t('common.select')}</option>
               <option>{t('survey.contact_both')}</option>
               <option>{t('survey.contact_call_only')}</option>
               <option>{t('common.no')}</option>
            </Input>
            <Input label={t('survey.comments_label')} as="textarea" value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />

            <div className="flex justify-between pt-4">
               <Button variant="outline" onClick={() => setStep('INITIAL')}>{t('common.back')}</Button>
               <Button variant="danger" onClick={() => onSubmit({ ...data, status: 'NO_SHOW' })}>{t('survey.submit_report')}</Button>
            </div>
         </div>
      );
   }

   if (step === 'UNABLE') {
      return (
         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-lg">{t('survey.unable_title')}</h3>
            <Input label={t('survey.reason_label')} aria-label={t('survey.reason_label')} title={t('survey.reason_label')} id="unableReason" as="select" value={data.reason || ''} onChange={e => setData({ ...data, reason: e.target.value })}>
               <option value="">{t('common.select')}</option>
               <option>{t('survey.reason_cancelled')}</option>
               <option>{t('survey.reason_unsafe')}</option>
               <option>{t('survey.reason_emergency')}</option>
               <option>{t('common.other')}</option>
            </Input>
            <Input label={t('survey.comments_label')} as="textarea" value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />

            <div className="flex justify-between pt-4">
               <Button variant="outline" onClick={() => setStep('INITIAL')}>{t('common.back')}</Button>
               <Button onClick={() => onSubmit({ ...data, status: 'INCOMPLETE' })}>{t('survey.submit_report')}</Button>
            </div>
         </div>
      );
   }

   return null;
};

const ContactStaffModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
   const { t } = useTheme();
   const [sent, setSent] = useState(false);

   if (sent) {
      return (
         <Modal isOpen={true} onClose={onClose} title={t('contact.title')}>
            <div className="text-center py-8">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400 mb-4">
                  <CheckCircle size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('contact.success')}</h3>
               <Button onClick={onClose} className="mt-4">{t('common.close')}</Button>
            </div>
         </Modal>
      );
   }

   return (
      <Modal isOpen={true} onClose={onClose} title={t('contact.title')}>
         <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 mb-2">{t('contact.intro')}</p>
            <Input label={t('contact.subject')} placeholder="e.g. Suggestion, Question, Praise" />
            <div className="space-y-1">
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('contact.message')}</label>
               <textarea className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none h-32 text-slate-900 dark:text-white" placeholder="..." />
            </div>
            <div className="flex justify-end pt-2">
               <Button onClick={() => setSent(true)}>{t('contact.send')}</Button>
            </div>
         </div>
      </Modal>
   );
};

// --- Background Check Modal ---
const BackgroundCheckModal: React.FC<{ onClose: () => void; onSubmit: () => void }> = ({ onClose, onSubmit }) => {
   const { t } = useTheme();
   // Form State
   const [formData, setFormData] = useState({
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      otherNames: '',
      dlNumber: '',
      dlState: '',
      prevResidency: '',
      ssn: ''
   });
   const [consent, setConsent] = useState(false);

   const update = (field: string, val: string) => setFormData(prev => ({ ...prev, [field]: val }));

   // Simple validation
   const isValid = formData.firstName && formData.lastName && formData.dob && formData.dlNumber && formData.dlState && formData.ssn && consent;

   return (
      <Modal isOpen={true} onClose={onClose} title={t('onboarding.background_check')}>
         <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('onboarding.background_check_desc')}</p>

            <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-slate-700 mb-4">
               <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} /> {t('common.secure_data')}
               </h4>
               <p className="text-xs text-blue-800 dark:text-blue-200">{t('onboarding.bg_privacy_note') || "Your data is encrypted and used solely for safety verification."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input label={t('onboarding.first_name')} value={formData.firstName} onChange={e => update('firstName', e.target.value)} />
               <Input label={t('onboarding.middle_name')} value={formData.middleName} onChange={e => update('middleName', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input label={t('onboarding.last_name')} value={formData.lastName} onChange={e => update('lastName', e.target.value)} />
               <Input label={t('onboarding.dob')} type="date" value={formData.dob} onChange={e => update('dob', e.target.value)} />
            </div>

            <Input label={t('onboarding.other_last_name')} placeholder="If applicable" value={formData.otherNames} onChange={e => update('otherNames', e.target.value)} />

            <div className="grid grid-cols-2 gap-4">
               <Input label={t('onboarding.drivers_license')} placeholder="License #" value={formData.dlNumber} onChange={e => update('dlNumber', e.target.value)} />
               <Input label={t('onboarding.drivers_state')} placeholder="State (e.g. OR)" value={formData.dlState} onChange={e => update('dlState', e.target.value)} />
            </div>

            <Input label={t('onboarding.ssn')} placeholder="XXX-XX-XXXX" value={formData.ssn} onChange={e => update('ssn', e.target.value)} />

            <Input
               label={t('onboarding.prev_residence')}
               placeholder="e.g. Clark County, WA"
               as="textarea"
               rows={2}
               value={formData.prevResidency}
               onChange={e => update('prevResidency', e.target.value)}
            />

            <div className="flex items-start gap-3 py-2">
               <input type="checkbox" id="bg-consent" className="mt-1 w-5 h-5 rounded text-brand-600" checked={consent} onChange={e => setConsent(e.target.checked)} />
               <label htmlFor="bg-consent" className="text-sm text-slate-700 dark:text-slate-300">
                  {t('onboarding.bg_consent') || "I consent to a criminal background check and driving record verification."}
               </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
               <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
               <Button variant="success" disabled={!isValid} onClick={onSubmit}>{t('common.submit')}</Button>
            </div>
         </div>
      </Modal>
   );
};

export const VolunteerDashboard: React.FC<VolunteerProps> = ({ user, requests, onNavigate, onUpdateUser, onCompleteRequest, onWithdraw }) => {
   const [completingId, setCompletingId] = useState<string | null>(null);
   const [celebratingBadge, setCelebratingBadge] = useState<BadgeDef | null>(null);
   const [viewedBadge, setViewedBadge] = useState<BadgeDef | null>(null);
   const [showContact, setShowContact] = useState(false);
   const { t } = useTheme();

   const isPending = user.backgroundCheckStatus === 'PENDING' || user.backgroundCheckStatus === 'NOT_STARTED';

   // Check for New Badges to Celebrate
   useEffect(() => {
      if (user.newBadges && user.newBadges.length > 0) {
         const badgeId = user.newBadges[0];
         const badgeDef = BADGES.find(b => b.id === badgeId);
         if (badgeDef) {
            setCelebratingBadge(badgeDef);
         }
      }
   }, [user.newBadges]);

   const handleCloseCelebration = () => {
      if (!celebratingBadge || !user.newBadges) return;
      const remainingNewBadges = user.newBadges.filter(id => id !== celebratingBadge.id);
      onUpdateUser({ newBadges: remainingNewBadges });
      setCelebratingBadge(null);
   };

   // Auto-open reporting for completed requests (1 hour after service time)
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

   if (user.onboardingStep !== OnboardingStep.COMPLETE) {
      return <UnifiedOnboarding user={user} onUpdate={onUpdateUser} onNavigate={onNavigate} />;
   }

   const myAssignments = requests.filter(r => {
      const isSoloMatch = r.volunteerId === user.id && r.status === RequestStatus.MATCHED;
      const isGroupEnrollment = r.isGroupEvent && r.enrolledVolunteers?.includes(user.id);
      return isSoloMatch || isGroupEnrollment;
   });

   return (
      <div className="space-y-8" title="Volunteer Dashboard" aria-label="Volunteer Dashboard">
         {/* Stats & Badges */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatWidget label={t('vol.total_hours')} value={user.totalHours || 0} icon={<Clock size={20} />} color="bg-brand-500" />
            <StatWidget label={t('vol.lives_impacted')} value="28" icon={<CheckCircle size={20} />} color="bg-emerald-500" />
            <div className="md:col-span-2 bg-white dark:bg-black p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('vol.badges')}</h3>
               <div className="flex flex-wrap gap-2">
                  {BADGES.filter(b => user.badges?.includes(b.id)).map(badge => (
                     <button
                        key={badge.id}
                        onClick={() => setViewedBadge(badge)}
                        className={`${badge.color} text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm hover:scale-105 transition-transform min-w-[120px] justify-center`}
                        title={t('vol.click_to_view_badge')}
                     >
                        <span className="mr-1">{badge.icon}</span> {t(badge.labelKey)}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
               {isPending ? (
                  <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-slate-900">
                     <div className="text-center py-8">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-4">
                           <Clock size={32} />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white mb-2">{t('vol.app_pending')}</h3>
                        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">{t('vol.app_pending_desc')}</p>
                        <Button variant="outline" onClick={() => onNavigate('volunteer-resources')}>{t('vol.start_training_btn')}</Button>
                     </div>
                  </Card>
               ) : (
                  <>
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-yellow-400">{t('vol.my_assignments')}</h2>
                        <Button onClick={() => onNavigate('opportunities')} variant="secondary">{t('vol.find_opps')}</Button>
                     </div>

                     {myAssignments.length === 0 ? (
                        <Card className="text-center py-12 text-slate-500 dark:text-slate-400">
                           {t('vol.no_assignments')}
                        </Card>
                     ) : (
                        myAssignments.map(req => (
                           <AssignedRequestCard
                              key={req.id}
                              request={req}
                              onLogHours={() => setCompletingId(req.id)}
                              onWithdraw={onWithdraw}
                           />
                        ))
                     )}
                  </>
               )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
               {/* Training Center - Pulses if Pending */}
               <div className={`transition - all duration - 500 ${isPending ? 'ring-4 ring-blue-200 dark:ring-blue-900 rounded-xl animate-pulse' : ''} `}>
                  <Card title={t('vol.training')}>
                     <div className="space-y-2">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                           <div className={`h - 2.5 rounded - full ${isPending ? 'bg-amber-500 w-1/3' : 'bg-brand-600 dark:bg-yellow-400 w-full'} `}></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                           {isPending ? t('vol.training_incomplete') : t('vol.training_complete')}
                        </p>
                        <Button
                           variant={isPending ? 'primary' : 'outline'}
                           size="sm"
                           className="w-full mt-2"
                           onClick={() => onNavigate('volunteer-resources')}
                        >
                           {isPending ? t('common.view_status') : t('client.view_resources')}
                        </Button>
                     </div>
                  </Card>
               </div>

               <Card title={t('client.notifications')}>
                  <div className="space-y-3">
                     {user.notifications?.map((notif, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded border text-sm ${notif.type === 'ACTION_REQUIRED'
                           ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                           : 'bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700'
                           }`}>
                           <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.type === 'ACTION_REQUIRED' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                           <div className="flex-1">
                              <div className="flex justify-between items-start">
                                 <p className="font-bold text-slate-800 dark:text-white">
                                    {notif.type === 'ACTION_REQUIRED' ? t('alert.action_needed') : t('common.update')}
                                 </p>
                                 <button
                                    onClick={() => onUpdateUser({ notifications: user.notifications?.filter(n => n.id !== notif.id) })}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    aria-label={t('common.close')}
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-2 leading-relaxed">{notif.message}</p>

                              {notif.type === 'ACTION_REQUIRED' && notif.requestId && (
                                 <div className="flex gap-2 mt-2">
                                    <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => onUpdateUser({ notifications: user.notifications?.filter(n => n.id !== notif.id) })}
                                    >
                                       {t('vol.keep_assignment')}
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="danger"
                                       onClick={() => {
                                          onWithdraw?.(notif.requestId!, t('vol.drop_reason'));
                                          onUpdateUser({ notifications: user.notifications?.filter(n => n.id !== notif.id) });
                                       }}
                                    >
                                       {t('vol.drop')}
                                    </Button>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                     {(!user.notifications || user.notifications.length === 0) && !isPending && (
                        <div className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors text-sm">
                           <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                           <div>
                              <p className="font-medium text-slate-800 dark:text-white">{t('vol.match_confirmed')}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t('vol.match_desc_mock')}</p>
                           </div>
                        </div>
                     )}
                  </div>
               </Card>

               <Card title={t('client.announcements')}>
                  <div className="space-y-3">
                     <div className="p-3 bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 rounded-lg text-sm">
                        <p className="font-bold text-brand-800 dark:text-white mb-1">{t('vol.winter_services')}</p>
                        <p className="text-brand-700 dark:text-slate-300">{t('vol.winter_desc')}</p>
                     </div>
                  </div>
               </Card>

               <div className="pt-2">
                  <Button variant="danger" className="w-full justify-center py-3 font-bold shadow-sm mb-3" onClick={() => onNavigate('report-safety')}>
                     <AlertTriangle size={20} className="mr-2" />
                     {t('client.report_safety')}
                  </Button>

                  <Button variant="outline" className="w-full justify-center py-3 font-bold shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" onClick={() => setShowContact(true)}>
                     <MessageSquare size={20} className="mr-2" />
                     {t('common.contact_staff')}
                  </Button>
               </div>

               {/* Account Settings Relocated */}
               <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400">
                           <Settings size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('vol.account_settings')}</h4>
                           <p className="text-xs text-slate-500">{t('vol.manage_profile')}</p>
                        </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => onNavigate('settings')}>
                        {t('common.open')}
                     </Button>
                  </div>
               </Card>



               {/* Need Help Card */}
               <NeedHelpCard />
            </div>
         </div >

         {completingId && (
            <Modal isOpen={true} onClose={() => { }} title={t('survey.post_service_report')} hideCloseButton={true} customStyle={{ width: '90vw', maxWidth: '1200px' }}>
               <SurveyForm
                  onSubmit={(data) => {
                     onCompleteRequest(completingId, data);
                     setCompletingId(null);
                  }}
                  onCancel={() => { }}
               />
            </Modal>
         )}

         {/* Settings Modal - Placeholder for now, triggered by future UI */}
         {/* We can add a Settings button to the sidebar or header later if requested.
             Verified requirements mention Account & Privacy. 
             Let's add a Settings Button in the sidebar right now. */}


         {
            celebratingBadge && (
               <Modal isOpen={true} onClose={handleCloseCelebration} title="">
                  <div className="text-center py-6 px-4">
                     <div className="flex justify-center mb-4">
                        <span className="text-6xl">{celebratingBadge.icon}</span>
                     </div>
                     <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t('vol.congrats')}</h2>
                     <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">{t('vol.earned_badge')} <span className="text-brand-700 dark:text-yellow-400 font-bold">{t(celebratingBadge.labelKey)}</span> {t('vol.badge')}!</p>

                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 max-w-sm mx-auto">
                        <p className="text-slate-700 dark:text-slate-300 italic">"{t(celebratingBadge.descriptionKey)}"</p>
                     </div>
                     <Button onClick={handleCloseCelebration} size="lg" className="w-full">{t('common.awesome')}</Button>
                  </div>
               </Modal>
            )
         }

         {
            viewedBadge && (
               <Modal isOpen={true} onClose={() => setViewedBadge(null)} title={t(viewedBadge.labelKey)}>
                  <div className="text-center py-6">
                     <div className="text-6xl mb-4">{viewedBadge.icon}</div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t(viewedBadge.labelKey)}</h3>

                     <p className="text-slate-600 dark:text-slate-400 italic px-4">
                        {t(viewedBadge.descriptionKey)}
                     </p>
                     <Button className="mt-8 w-full" onClick={() => setViewedBadge(null)}>{t('common.close')}</Button>
                  </div>
               </Modal>
            )
         }


         {
            showContact && (
               <ContactStaffModal onClose={() => setShowContact(false)} />
            )
         }

         {
            user.justFinishedOnboarding && (
               <OnboardingNextStepsModal
                  role="VOLUNTEER"
                  onClose={() => onUpdateUser({ justFinishedOnboarding: false })}
               />
            )
         }
      </div >
   );
};

// --- Helper Functions ---



const AssignedRequestCard: React.FC<{ request: Request; onLogHours: () => void; onWithdraw: (id: string, reason: string) => void }> = ({ request, onLogHours, onWithdraw }) => {
   const { t } = useTheme();
   const [expanded, setExpanded] = useState(false);
   const [withdrawing, setWithdrawing] = useState(false);
   const [withdrawReason, setWithdrawReason] = useState('');
   const [showCalendarModal, setShowCalendarModal] = useState(false);

   // Lookup Client
   const client = Object.values(MOCK_USERS).find(u => u.id === request.clientId);

   const withdrawalReasons = [
      t('vol.withdraw_health'),
      t('vol.withdraw_time'),
      t('vol.withdraw_family'),
      t('vol.withdraw_transport'),
      t('vol.withdraw_move'),
      t('vol.withdraw_skills'),
      t('vol.withdraw_safety'),
      t('vol.withdraw_confusing'),
      t('common.other')
   ];

   if (withdrawing) {
      return (
         <Card className="border-l-4 border-l-rose-500 bg-rose-50 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400 mb-2">{t('vol.withdraw_title')}</h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">{t('vol.withdraw_desc')}</p>
            <Input label={t('survey.reason_label')} aria-label={t('survey.reason_label')} title={t('survey.reason_label')} id={`withdrawReason-${request.id}`} as="select" value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}>
               <option value="">{t('common.select_reason')}</option>
               {withdrawalReasons.map(r => <option key={r}>{r}</option>)}
            </Input>
            <div className="flex gap-2 mt-4">
               <Button variant="outline" size="sm" onClick={() => setWithdrawing(false)}>{t('common.cancel')}</Button>
               <Button variant="danger" size="sm" onClick={() => onWithdraw(request.id, withdrawReason)}>{t('vol.confirm_withdraw')}</Button>
            </div>
         </Card>
      );
   }

   return (
      <Card className="border-l-4 border-l-purple-500 transition-all dark:bg-slate-900">
         <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex gap-4 items-start">
               {/* Icon Placeholder */}
               <div className="w-16 h-16 flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center p-1 text-center group-hover:border-purple-300 transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-tight">{request.category.substring(0, 4)}</span>
               </div>

               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{t('vol.my_assignment')}</span>
                     <span className="text-xs text-slate-500 dark:text-slate-400">#{request.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t(`category.${request.category}`) || request.category}: {t(`subcategory.${request.subcategory}`) || request.subcategory}</h3>
                  {request.category === RequestCategory.RIDE ? (
                     <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <p><strong>{t('req.pickup')}:</strong> {request.pickupTime} • <strong>{t('req.appointment')}:</strong> {request.appointmentTime || 'TBD'} • <strong>{t('req.return')}:</strong> {request.returnTime || t('req.after_appointment')}</p>
                        <p><strong>{t('req.destination')}:</strong> {request.destinationAddress || request.location}</p>
                     </div>
                  ) : (
                     <p className="text-sm text-slate-600 dark:text-slate-300">{request.date} @ {formatTimeWithAMPM(request.timeWindow || request.pickupTime || '')}</p>
                  )}
               </div>
            </div>
            <button className="text-slate-400" aria-label={expanded ? t('common.collapse') : t('common.expand')}>{expanded ? <ChevronUp /> : <ChevronDown />}</button>
         </div>

         {expanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2 text-sm text-slate-700 dark:text-slate-300 mb-4">
                  <p><strong>{t('common.client')}:</strong> {client?.preferredName || request.clientName}</p>
                  {request.category === RequestCategory.RIDE ? (
                     <>
                        <p><strong>{t('req.pickup_address')}:</strong> {request.pickupAddress || request.location} <a href="#" className="text-blue-600 dark:text-blue-400 underline ml-2">({t('common.map')})</a></p>
                        <p><strong>{t('req.destination')}:</strong> {request.destinationAddress} <a href="#" className="text-blue-600 dark:text-blue-400 underline ml-2">({t('common.map')})</a></p>
                     </>
                  ) : (
                     <p><strong>{t('common.location')}:</strong> {request.location} <a href="#" className="text-blue-600 dark:text-blue-400 underline ml-2">({t('common.map')})</a></p>
                  )}
                  <p><strong>{t('request.details')}:</strong> {request.description}</p>

                  {client && (
                     <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-brand-700 dark:text-yellow-400 mb-1">{t('vol.client_insights')}</h4>
                        <p className="text-xs"><span className="font-semibold">{t('onboarding.pets')}:</span> {client.pets || t('common.none_listed')}</p>
                        <p className="text-xs"><span className="font-semibold">{t('onboarding.hobbies')}:</span> {client.hobbies?.join(', ') || client.interestingFacts || t('common.none_listed')}</p>

                        <div className="mt-2 flex gap-2">
                           {client.accessibility?.mobility && (
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs font-bold">{client.accessibility.mobility}</span>
                           )}
                        </div>
                     </div>
                  )}

                  {request.adminNotes && <p className="text-amber-700 bg-amber-50 dark:bg-amber-900 dark:text-amber-100 p-2 rounded mt-2">{t('request.note')}: {request.adminNotes}</p>}
               </div>

               <div className="flex gap-3 flex-wrap">
                  <Button className="flex-1" onClick={onLogHours}>{t('vol.log_hours')}</Button>
                  <Button variant="secondary" className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowCalendarModal(true); }}>
                     <CalendarPlus size={16} /> {t('vol.add_to_calendar')}
                  </Button>
                  <Button variant="outline" className="text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setWithdrawing(true)}>{t('vol.withdraw')}</Button>
               </div>
            </div>
         )}

         {showCalendarModal && (
            <Modal isOpen={true} onClose={() => setShowCalendarModal(false)} title={t('vol.add_to_calendar')}>
               <div className="space-y-4 py-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('vol.calendar_choice')}</p>

                  <Button
                     variant="outline"
                     className="w-full justify-start text-left gap-3"
                     onClick={() => {
                        const start = request.date.replace(/-/g, '');
                        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${request.category}: ${request.subcategory}`)}&dates=${start}/${start}&details=${encodeURIComponent(request.description)}&location=${encodeURIComponent(request.location)}`;
                        window.open(url, '_blank');
                        setShowCalendarModal(false);
                     }}
                  >
                     <Globe size={18} className="text-blue-500" /> {t('calendar.google')}
                  </Button >

                  <Button
                     variant="outline"
                     className="w-full justify-start text-left gap-3"
                     onClick={() => {
                        const start = `${request.date}T12:00:00Z`;
                        const url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(`${request.category}: ${request.subcategory}`)}&startdt=${start}&enddt=${start}&body=${encodeURIComponent(request.description)}&location=${encodeURIComponent(request.location)}`;
                        window.open(url, '_blank');
                        setShowCalendarModal(false);
                     }}
                  >
                     <Mail size={18} className="text-blue-600" /> {t('calendar.outlook')}
                  </Button>

                  <Button
                     variant="outline"
                     className="w-full justify-start text-left gap-3"
                     onClick={() => {
                        downloadICS(request);
                        setShowCalendarModal(false);
                     }}
                  >
                     <FileText size={18} className="text-slate-500" /> {t('vol.download_ics')} {t('calendar.apple')}
                  </Button>

                  <div className="pt-2">
                     <Button variant="secondary" className="w-full" onClick={() => setShowCalendarModal(false)}>{t('common.cancel')}</Button>
                  </div>
               </div >
            </Modal >
         )}
      </Card >
   );
};

export const VolunteerOnboarding: React.FC<{ user: User; onUpdate: (u: Partial<User>) => void; onNavigate: (p: string) => void }> = ({ user, onUpdate, onNavigate }) => {
   const { t } = useTheme();
   const [step, setStep] = useState(1);
   const [error, setError] = useState<string | null>(null);
   const [formData, setFormData] = useState<Partial<User>>({
      address: 'North Plains, OR 97133', // Prefill
      ...user
   });

   const validateStep = (currentStep: number): boolean => {
      setError(null);
      switch (currentStep) {
         case 1: // Contact & Identity
            if (!formData.name || !formData.dob || !formData.gender) {
               setError(t('common.fill_required'));
               return false;
            }
            if (!formData.phone && !formData.email) {
               setError(t('onboarding.contact_required') || 'Phone or Email is required');
               return false;
            }
            if (!formData.preferredContactMethod) {
               setError(t('common.fill_required'));
               return false;
            }
            break;
         case 2: // HUD / Demographics
            if (!formData.race || !formData.ethnicity || !formData.maritalStatus || !formData.incomeRange) {
               setError(t('common.fill_required'));
               return false;
            }
            // Emergency Contact
            if (!formData.emergencyContact?.name || !formData.emergencyContact?.phone || !formData.emergencyContact?.relation) {
               setError(t('onboarding.emergency_required') || 'Emergency contact required');
               return false;
            }
            break;
         case 3: // Personal
            // Accessibility fields have defaults, others are optional text
            break;
         case 4: // Skills
            // Checkbox and language multi-select are optional or have defaults
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

   const handleFinish = () => {
      confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 }
      });

      let adminNotes = user.adminNotes || '';
      if (formData.dob && new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18) {
         adminNotes += '\n[SYSTEM]: User identified as minor (Under 18). Guardian permission required.';
      }

      onUpdate({
         ...formData,
         adminNotes,
         onboardingStep: OnboardingStep.COMPLETE,
         backgroundCheckStatus: 'PENDING',
         intakeDate: new Date().toISOString().split('T')[0],
         justFinishedOnboarding: true
      });
      // Force navigation to dashboard after state update
      setTimeout(() => {
         onNavigate('dashboard');
      }, 100);
   };

   const [showBgModal, setShowBgModal] = useState(false);

   const handleFinishLater = () => {
      // Trigger confetti for completion
      confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 }
      });
      // Deferral: Set status to NOT_STARTED, but Onboarding COMPLETE
      onUpdate({
         ...formData,
         onboardingStep: OnboardingStep.COMPLETE,
         backgroundCheckStatus: 'NOT_STARTED',
         intakeDate: new Date().toISOString().split('T')[0],
         justFinishedOnboarding: true
      });
      // Force navigation to dashboard after state update
      setTimeout(() => {
         onNavigate('dashboard');
      }, 100);
   };

   return (
      <div className="max-w-3xl mx-auto py-8">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">{t('onboarding.volunteer_title')}</h1>
         <div className="max-w-2xl mx-auto mb-8">
            <ProgressBar current={step} total={6} labels={[t('onboarding.contact'), t('onboarding.demographics'), t('onboarding.personal'), t('onboarding.skills'), t('onboarding.waiver'), t('onboarding.complete')]} />

            {error && (
               <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertTriangle size={18} />
                  <span className="font-bold">{error}</span>
               </div>
            )}
         </div>

         <Card>
            {step === 1 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-xl font-bold dark:text-white mb-4">{t('onboarding.step_1_contact')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.first_name')} value={formData.name?.split(' ')[0] || ''} onChange={e => setFormData({ ...formData, name: `${e.target.value} ${formData.name?.split(' ')[1] || ''}` })} />
                     <Input label={t('onboarding.last_name')} value={formData.name?.split(' ')[1] || ''} onChange={e => setFormData({ ...formData, name: `${formData.name?.split(' ')[0] || ''} ${e.target.value}` })} />
                  </div>
                  <Input label={t('onboarding.preferred_name')} value={formData.preferredName || ''} onChange={e => setFormData({ ...formData, preferredName: e.target.value })} />

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.dob')} type="date" value={formData.dob || ''} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                     <Input label={t('onboarding.gender')} aria-label={t('onboarding.gender')} title={t('onboarding.gender')} id="gender" as="select" value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Female">{t('onboarding.female')}</option>
                        <option value="Male">{t('onboarding.male')}</option>
                        <option value="Non-binary">{t('onboarding.non_binary')}</option>
                        <option value="Prefer not to say">{t('onboarding.prefer_not_say')}</option>
                     </Input>
                  </div>
                  {formData.dob && new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18 && (
                     <p className="text-xs text-amber-600 font-bold mb-4 animate-in fade-in bg-amber-50 p-2 rounded border border-amber-200">
                        {t('onboarding.minor_warning')}
                     </p>
                  )}

                  <Input label={t('onboarding.address')} value={formData.address} disabled className="bg-slate-50 dark:bg-slate-800" />

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('common.phone')} type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                     <Input label={t('common.email')} type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <Input label={t('onboarding.preferred_contact')} aria-label={t('onboarding.preferred_contact')} title={t('onboarding.preferred_contact')} id="preferredContact" as="select" value={formData.preferredContactMethod || 'Email'} onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value as any })}>
                     <option value="Email">{t('onboarding.contact_email')}</option>
                     <option value="Call">{t('onboarding.contact_call')}</option>
                     <option value="Text">{t('onboarding.contact_text')}</option>
                  </Input>

                  <div className="flex justify-end pt-4">
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 2 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-xl font-bold dark:text-white mb-4">{t('onboarding.step_2_hud')}</h2>
                  <p className="text-sm text-slate-500 mb-4">{t('onboarding.hud_grant_desc')}</p>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.race')} aria-label={t('onboarding.race')} title={t('onboarding.race')} id="race" as="select" value={formData.race || ''} onChange={e => setFormData({ ...formData, race: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                        <option value="Asian">Asian</option>
                        <option value="Black or African American">Black or African American</option>
                        <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                        <option value="White">White</option>
                        <option value="Other / Multi-Racial">Other / Multi-Racial</option>
                     </Input>
                     <Input label={t('onboarding.ethnicity')} aria-label={t('onboarding.ethnicity')} title={t('onboarding.ethnicity')} id="ethnicity" as="select" value={formData.ethnicity || ''} onChange={e => setFormData({ ...formData, ethnicity: e.target.value as any })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Hispanic/Latino">{t('onboarding.hispanic')}</option>
                        <option value="Not Hispanic/Latino">{t('onboarding.not_hispanic')}</option>
                     </Input>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.marital_status')} aria-label={t('onboarding.marital_status')} title={t('onboarding.marital_status')} id="maritalStatus" as="select" value={formData.maritalStatus || ''} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Single">{t('onboarding.single')}</option>
                        <option value="Married">{t('onboarding.married')}</option>
                        <option value="Widowed">{t('onboarding.widowed')}</option>
                        <option value="Divorced">{t('onboarding.divorced')}</option>
                     </Input>
                     <Input label={t('onboarding.income_range')} aria-label={t('onboarding.income_range')} title={t('onboarding.income_range')} id="incomeRange" as="select" value={formData.incomeRange || ''} onChange={e => setFormData({ ...formData, incomeRange: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Under $30,000">{t('onboarding.income_under_30k')}</option>
                        <option value="$30,000 - $50,000">{t('onboarding.income_30k_50k')}</option>
                        <option value="$50,000 - $80,000">{t('onboarding.income_50k_80k')}</option>
                        <option value="$80,000+">{t('onboarding.income_80k_plus')}</option>
                     </Input>
                  </div>

                  <div className="border-t pt-4 mt-4 dark:border-slate-700">
                     <h3 className="font-bold mb-2">{t('onboarding.emergency_contact')}</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label={t('common.name')} value={formData.emergencyContact?.name || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { phone: '', relation: '' }), name: e.target.value } })} />
                        <Input label={t('common.phone')} value={formData.emergencyContact?.phone || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { name: '', relation: '' }), phone: e.target.value } })} />
                     </div>
                     <Input label={t('onboarding.relationship')} value={formData.emergencyContact?.relation || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { name: '', phone: '' }), relation: e.target.value } })} />
                  </div>

                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={() => setStep(1)}>{t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 3 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-xl font-bold dark:text-white mb-4">{t('onboarding.step_3_personal')}</h2>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                     <div>
                        <h4 className="font-bold">{t('onboarding.profile_photo')}</h4>
                        <p className="text-xs text-slate-500">{t('onboarding.profile_photo_desc')}</p>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm">{t('onboarding.choose_gallery')}</Button>
                        <Button variant="secondary" size="sm">{t('onboarding.take_photo')}</Button>
                     </div>
                  </div>

                  <Input label={t('onboarding.pets_home')} placeholder="e.g. 2 Dogs (Max & Spot)" value={formData.pets || ''} onChange={e => setFormData({ ...formData, pets: e.target.value })} />
                  <Input label={t('onboarding.interesting_facts')} as="textarea" value={formData.interestingFacts || ''} onChange={e => setFormData({ ...formData, interestingFacts: e.target.value })} />

                  <div className="border-t pt-4 mt-4 dark:border-slate-700">
                     <h3 className="font-bold mb-2">{t('onboarding.accessibility_notes')}</h3>
                     <p className="text-xs text-slate-500 mb-4">{t('onboarding.accessibility_desc')}</p>
                     <div className="grid grid-cols-3 gap-4">
                        <Input label={t('onboarding.hearing_impairment')} aria-label={t('onboarding.hearing_impairment')} title={t('onboarding.hearing_impairment')} id="hearing" as="select" value={formData.accessibility?.hearing || 'Unknown'} onChange={e => setFormData({ ...formData, accessibility: { ...formData.accessibility!, hearing: e.target.value } })}>
                           <option value="Unknown">{t('common.unknown')}</option>
                           <option value="Yes">{t('common.yes')}</option>
                           <option value="No">{t('common.no')}</option>
                        </Input>
                        <Input label={t('onboarding.vision_impairment')} aria-label={t('onboarding.vision_impairment')} title={t('onboarding.vision_impairment')} id="vision" as="select" value={formData.accessibility?.vision || 'Unknown'} onChange={e => setFormData({ ...formData, accessibility: { ...formData.accessibility!, vision: e.target.value } })}>
                           <option value="Unknown">{t('common.unknown')}</option>
                           <option value="Yes">{t('common.yes')}</option>
                           <option value="No">{t('common.no')}</option>
                        </Input>
                        <Input label={t('onboarding.mobility')} aria-label={t('onboarding.mobility')} title={t('onboarding.mobility')} id="mobility" as="select" value={formData.accessibility?.mobility || 'None'} onChange={e => setFormData({ ...formData, accessibility: { ...formData.accessibility!, mobility: e.target.value } })}>
                           <option value="None">{t('common.none')}</option>
                           <option value="Walker">{t('onboarding.walker')}</option>
                           <option value="Wheelchair">{t('onboarding.wheelchair')}</option>
                           <option value="Stairs are difficult">{t('onboarding.stairs_diff')}</option>
                        </Input>
                     </div>
                  </div>

                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={() => setStep(2)}>{t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 4 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-xl font-bold dark:text-white mb-4">{t('onboarding.step_4_skills')}</h2>

                  <div className="space-y-2">
                     <label className="font-bold text-sm">{t('onboarding.languages')}</label>
                     <div className="flex gap-2 flex-wrap">
                        {['English', 'Spanish', 'French', 'Sign Language', 'Other'].map(lang => (
                           <button
                              key={lang}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${formData.languages?.includes(lang) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-black text-slate-600 border-slate-300'}`}
                              onClick={() => {
                                 const current = formData.languages || [];
                                 setFormData({ ...formData, languages: current.includes(lang) ? current.filter(l => l !== lang) : [...current, lang] });
                              }}
                           >
                              {lang === 'English' ? t('languages.english') : lang === 'Spanish' ? t('languages.spanish') : lang === 'French' ? t('languages.french') : lang === 'Sign Language' ? t('languages.sign') : t('common.other')}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                     <input type="checkbox" id="driver" className="w-5 h-5 rounded text-brand-600" checked={formData.isDriver || false} onChange={e => setFormData({ ...formData, isDriver: e.target.checked })} />
                     <label htmlFor="driver" className="font-medium">{t('onboarding.is_driver')}</label>
                  </div>


                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={() => setStep(3)}>{t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 5 && (
               <WaiverForm
                  onAcknowledge={(sig) => {
                     setFormData(prev => ({ ...prev, signature: sig, waiverAcceptedDate: new Date().toISOString().split('T')[0] }));
                     setStep(6);
                  }}
                  onBack={() => setStep(4)}
               />
            )}

            {step === 6 && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                  <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center mx-auto text-brand-600 mb-4">
                     <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-2xl font-bold dark:text-white">{t('onboarding.almost_done')}</h2>
                  <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                     {t('onboarding.vol_thanks')}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-4">
                     <h3 className="font-bold text-lg">{t('onboarding.background_check')}</h3>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('onboarding.background_check_desc')}
                     </p>

                     <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={() => setShowBgModal(true)}>{t('onboarding.fill_form_now')}</Button>
                        <Button variant="outline" className="w-full" onClick={handleFinishLater}>{t('onboarding.fill_later') || "Fill Out Later"}</Button>
                     </div>

                     <p className="text-xs text-slate-500 italic p-2 bg-white dark:bg-black rounded border border-slate-100 dark:border-slate-800">
                        {t('onboarding.training_processing')}
                     </p>
                  </div>

                  <div className="flex justify-between pt-4 max-w-md mx-auto">
                     <Button variant="outline" onClick={() => setStep(5)}>{t('common.back')}</Button>
                  </div>
               </div>
            )}
         </Card>

         {showBgModal && (
            <BackgroundCheckModal
               onClose={() => setShowBgModal(false)}
               onSubmit={handleFinish}
            />
         )}
      </div>
   );
};

export const OpportunityBoard: React.FC<{ requests: Request[]; onAccept: (id: string) => void; user: User }> = ({ requests, onAccept, user }) => {
   const { t } = useTheme();
   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
   const [dateFilter, setDateFilter] = useState('');
   const [viewingId, setViewingId] = useState<string | null>(null);
   const [showCalendar, setShowCalendar] = useState(false);

   const available = requests.filter(r =>
      r.status === RequestStatus.PENDING ||
      (r.isGroupEvent && r.status === RequestStatus.MATCHED && (r.enrolledVolunteers?.length || 0) < (r.maxVolunteers || 1))
   );

   const filtered = available.filter(r => {
      const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(r.category);
      const matchesDate = !dateFilter || r.date === dateFilter;

      // Hide transportation requests from non-drivers (only if user is defined)
      if (user && r.category === RequestCategory.RIDE && !user.isDriver) return false;

      return matchesCat && matchesDate;
   });

   const availableDates = Array.from(new Set(available.map(r => r.date)));

   const categories = Object.values(RequestCategory);
   const toggleCategory = (cat: string) => {
      if (selectedCategories.includes(cat)) {
         setSelectedCategories(prev => prev.filter(c => c !== cat));
      } else {
         setSelectedCategories(prev => [...prev, cat]);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-black p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex-1 overflow-x-auto pb-2 md:pb-0">
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">{t('vol.filter_category')}</label>
               <div className="flex gap-2">
                  <button
                     onClick={() => setSelectedCategories([])}
                     className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedCategories.length === 0 ? 'bg-slate-800 text-white border-slate-800 dark:bg-yellow-400 dark:text-black' : 'bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                  >
                     {t('common.all')}
                  </button>
                  {categories.map(cat => (
                     <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap flex items-center gap-1
                  ${selectedCategories.includes(cat) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}
                `}
                     >
                        {getCategoryIcon(cat as RequestCategory)} {t(`category.${cat}`) || cat}
                     </button>
                  ))}
               </div>
            </div>
            <div className="w-full md:w-auto relative">
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">{t('common.date')}</label>
               <div
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-white text-sm cursor-pointer hover:border-brand-500 transition-colors gap-2 min-w-[140px]"
                  onClick={() => setShowCalendar(!showCalendar)}
               >
                  <div className="flex items-center gap-2">
                     <Calendar size={16} className="text-brand-500" />
                     <span>{dateFilter || t('common.all_dates')}</span>
                  </div>
                  {dateFilter && (
                     <X size={14} className="ml-1 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setDateFilter(''); }} />
                  )}
               </div>

               {showCalendar && (
                  <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                     <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2">
                        <CalendarWidget
                           selectedDate={dateFilter}
                           onChange={(d) => { setDateFilter(d); setShowCalendar(false); }}
                           highlights={availableDates}
                        />
                     </div>
                  </>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(req => (
               <div key={req.id} className="bg-white dark:bg-black rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className={`h-2 ${getCategoryColor(req.category)}`} />
                  <div className="p-5 flex-1">
                     <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(req.category)} bg-opacity-10 text-slate-700 dark:text-slate-300`}>
                           {getCategoryIcon(req.category)}
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t(`category.${req.category}`) || req.category}</span>
                           {req.isGroupEvent && (
                              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mt-1">
                                 {req.enrolledVolunteers?.length || 0} / {req.maxVolunteers} {t('common.volunteers')}
                              </span>
                           )}
                        </div>
                     </div>
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{t(`subcategory.${req.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || req.subcategory}</h3>
                     <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <MapPin size={14} className="mr-1" /> {req.geozone}
                     </div>
                     <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                        <Clock size={14} className="mr-2 text-brand-500" />
                        {req.isFlexible ? (
                           <span>Flexible: {req.flexStartDate} - {req.flexEndDate}</span>
                        ) : (
                           <span>{req.date} @ {formatTimeWithAMPM(req.pickupTime || req.timeWindow || '')}</span>
                        )}
                     </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                     <Button className="w-full" onClick={() => setViewingId(req.id)}>{t('vol.view_details')}</Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 text-[10px] text-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                     {t('vol.address_revealed')}
                  </div>
               </div>
            ))}
            {filtered.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-black rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  {t('vol.no_opps')}
               </div>
            )}
         </div>

         {viewingId && (
            <Modal isOpen={true} onClose={() => setViewingId(null)} title={t('vol.opp_details')}>
               <div className="space-y-4">
                  {(() => {
                     const req = requests.find(r => r.id === viewingId);
                     if (!req) return null;

                     // Group Event Logic
                     const isGroup = req.isGroupEvent;
                     const taken = req.enrolledVolunteers?.length || 0;
                     const max = req.maxVolunteers || 1;
                     const spotsLeft = max - taken;
                     const isFull = isGroup && spotsLeft <= 0;

                     return (
                        <>
                           <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded text-sm text-slate-700 dark:text-slate-300">
                              <div className="flex justify-between items-start mb-2">
                                 <p className="font-bold text-lg">{t(`category.${req.category}`) || req.category} - {t(`subcategory.${req.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || req.subcategory}</p>
                                 {isGroup && (
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${isFull ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                                       {isFull ? t('client.full') : `${spotsLeft} ${t('client.spots_remaining')}`}
                                    </span>
                                 )}
                              </div>

                              {req.isFlexible ? (
                                 <div className="bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 p-3 rounded mb-2">
                                    <p className="font-bold text-blue-800 dark:text-blue-100 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-2" /> {t('request.flexible_schedule')}</p>
                                    <p><strong>{t('common.range')}:</strong> {req.flexStartDate} to {req.flexEndDate}</p>
                                    <p><strong>{t('common.preferred')}:</strong> {req.flexTimes}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                                       {t('vol.flexible_msg')}
                                    </p>
                                 </div>
                              ) : (
                                 <p><strong>{t('common.when')}:</strong> {req.date} @ {formatTimeWithAMPM(req.timeWindow || req.pickupTime || '')}</p>
                              )}

                              <p><strong>{t('common.where')}:</strong> {req.geozone} ({t('vol.location_hidden')})</p>
                              <p className="mt-2"><strong>{t('request.details')}:</strong> {req.description}</p>
                              {isGroup && <p className="mt-2 text-xs text-blue-600 font-bold bg-blue-50 p-2 rounded">👥 {t('vol.group_event_msg')}</p>}
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{t('vol.accept_commit')}</p>
                           <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setViewingId(null)}>{t('common.cancel')}</Button>
                              <Button
                                 variant={isFull ? 'secondary' : 'success'}
                                 disabled={isFull}
                                 onClick={() => {
                                    if (req.isFlexible) {
                                       // In a real app, we might prompt for a specific time proposal here.
                                       // For now, accepting implies "I will coordinate".
                                       alert(t('vol.coordinate_alert'));
                                    }
                                    onAccept(req.id);
                                    setViewingId(null);
                                 }}
                              >
                                 {isGroup ? t('vol.join_group') : t('vol.accept_connect')}
                              </Button>
                           </div>
                        </>
                     );
                  })()}
               </div>
            </Modal>
         )}
      </div>
   );
};

export const VolunteerResources: React.FC<{ user: User; onUpdate: (u: Partial<User>) => void }> = ({ user, onUpdate }) => {
   const { t } = useTheme();
   const [showBgModal, setShowBgModal] = useState(false);
   const needBgCheck = user.backgroundCheckStatus === 'NOT_STARTED';

   return (
      <div className="max-w-3xl mx-auto space-y-8">
         <div>
            <h2 className="text-3xl font-bold dark:text-white mb-2">{t('vol.training_title')}</h2>
            <p className="text-slate-600 dark:text-slate-300">{t('vol.training_subtitle')}</p>
         </div>

         {/* Background Check Call to Action */}
         {needBgCheck && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-6 rounded-xl flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4">
               <div className="p-4 bg-amber-100 dark:bg-amber-800 rounded-full text-amber-600 dark:text-amber-200">
                  <ShieldAlert size={32} />
               </div>
               <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('onboarding.background_check')}</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">{t('onboarding.background_check_desc')}</p>
                  <Button onClick={() => setShowBgModal(true)} variant="primary">{t('onboarding.fill_form_now')}</Button>
               </div>
            </div>
         )}

         {showBgModal && (
            <BackgroundCheckModal
               onClose={() => setShowBgModal(false)}
               onSubmit={() => {
                  onUpdate({ backgroundCheckStatus: 'PENDING' });
                  setShowBgModal(false);
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
               }}
            />
         )}

         <div className="grid md:grid-cols-2 gap-6">
            <Card title={t('vol.training_modules')}>
               <div className="space-y-4">
                  <div className="p-4 border rounded-lg dark:border-slate-700 bg-white dark:bg-slate-900">
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold dark:text-white">{t('vol.module_1_title')}</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">{t('common.completed')}</span>
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{t('vol.module_1_desc')}</p>
                     <Button size="sm" variant="outline" className="w-full">{t('common.review')}</Button>
                  </div>
                  <div className="p-4 border rounded-lg dark:border-slate-700 bg-white dark:bg-slate-900">
                     <h4 className="font-bold dark:text-white">{t('vol.module_2_title')}</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{t('vol.module_2_desc')}</p>
                     <Button size="sm" className="w-full">{t('common.start')}</Button>
                  </div>
               </div>
            </Card>

            <Card title={t('vol.quick_downloads')}>
               <div className="space-y-3">
                  {/* Conditional Guardian Form (Check age 18) */}
                  {user.dob && new Date().getFullYear() - new Date(user.dob).getFullYear() < 18 && (
                     <button className="flex items-center gap-3 w-full p-3 rounded bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                        <div className="bg-amber-100 text-amber-600 p-2 rounded"><ShieldAlert size={20} /></div>
                        <div className="text-left flex-1">
                           <p className="font-bold text-sm text-amber-900">{t('resources.guardian_form')}</p>
                           <p className="text-xs text-amber-700">{t('resources.guardian_form_desc')}</p>
                        </div>
                        <div className="text-amber-800 text-xs font-bold uppercase">{t('resources.download')}</div>
                     </button>
                  )}
                  <button className="flex items-center gap-3 w-full p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200">
                     <div className="bg-red-50 text-red-600 p-2 rounded"><FileText size={20} /></div>
                     <div className="text-left">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{t('vol.handbook_pdf')}</p>
                        <p className="text-xs text-slate-500">{t('vol.policies_desc')}</p>
                     </div>
                  </button>
                  <button className="flex items-center gap-3 w-full p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200">
                     <div className="bg-blue-50 text-blue-600 p-2 rounded"><FileText size={20} /></div>
                     <div className="text-left">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{t('vol.code_conduct')}</p>
                        <p className="text-xs text-slate-500">{t('vol.ethical_desc')}</p>
                     </div>
                  </button>
               </div>
            </Card>
         </div>

         <Card title={t('vol.handbook_highlights')}>
            <div className="space-y-1">
               <Accordion title={t('vol.code_conduct_title')} defaultOpen icon={<ShieldCheck size={18} />}>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                     {t('vol.code_conduct_desc')}
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
                     <li>{t('vol.conduct_reliable')}</li>
                     <li>{t('vol.conduct_privacy')}</li>
                     <li>{t('vol.conduct_boundaries')}</li>
                  </ul>
               </Accordion>
               <Accordion title={t('vol.boundaries_title')} icon={<Map size={18} />}>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                     {t('vol.boundaries_desc')}
                  </p>
               </Accordion>
               <Accordion title={t('vol.confidentiality_title')} icon={<Lock size={18} />}>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                     {t('vol.confidentiality_desc')}
                  </p>
               </Accordion>
               <Accordion title={t('vol.reporting_title')} icon={<AlertTriangle size={18} />}>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                     {t('vol.reporting_desc')}
                  </p>
               </Accordion>
            </div>
         </Card>

         <div className="space-y-4">
            <h3 className="text-xl font-bold dark:text-white">{t('common.faq')}</h3>
            <div className="grid gap-4">
               <Card>
                  <Accordion title={t('vol.faq_money_title')} icon={<HelpCircle size={18} />}>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('vol.faq_money_desc')}
                     </p>
                  </Accordion>
                  <Accordion title={t('vol.faq_miss_shift_title')} icon={<HelpCircle size={18} />}>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('vol.faq_miss_shift_desc')}
                     </p>
                  </Accordion>
                  <Accordion title={t('vol.faq_child_pet_title')} icon={<HelpCircle size={18} />}>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('vol.faq_child_pet_desc')}
                     </p>
                  </Accordion>
               </Card>
            </div>
         </div>
      </div>
   );
};

export const VolunteerHistory: React.FC<{ user: User; requests: Request[] }> = ({ user, requests }) => {
   const { t } = useTheme();
   const history = requests.filter(r => r.volunteerId === user.id && (r.status === RequestStatus.COMPLETED || r.status === RequestStatus.CANCELLED));

   return (
      <div className="space-y-6">
         <h2 className="text-2xl font-bold dark:text-white">{t('vol.my_history')}</h2>
         <Card>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
               <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.date')}</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.category')}</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.client')}</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.status')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {history.map(req => (
                     <tr key={req.id}>
                        <td className="px-6 py-4 text-sm dark:text-slate-300">{req.date}</td>
                        <td className="px-6 py-4 text-sm dark:text-slate-300">{t(`category.${req.category}`) || req.category}</td>
                        <td className="px-6 py-4 text-sm dark:text-slate-300">{req.clientName}</td>
                        <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                     </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">{t('common.no_history')}</td></tr>}
               </tbody>
            </table>
         </Card>
      </div>
   );
};

export const DualHistory: React.FC<{ user: User; requests: Request[] }> = ({ user, requests }) => {
   const { t } = useTheme();
   return (
      <div className="space-y-8">
         <VolunteerHistory user={user} requests={requests} />

         <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">{t('vol.my_client_history')}</h2>
            <Card>
               <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.date')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.category')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.status')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                     {requests.filter(r => r.clientId === user.id && (r.status === RequestStatus.COMPLETED || r.status === RequestStatus.CANCELLED)).map(req => (
                        <tr key={req.id}>
                           <td className="px-6 py-4 text-sm dark:text-slate-300">{req.date}</td>
                           <td className="px-6 py-4 text-sm dark:text-slate-300">{t(`category.${req.category}`) || req.category}</td>
                           <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                        </tr>
                     ))}
                     {requests.filter(r => r.clientId === user.id && (r.status === RequestStatus.COMPLETED || r.status === RequestStatus.CANCELLED)).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-500">{t('common.no_history')}</td></tr>}
                  </tbody>
               </table>
            </Card>
         </div>
      </div>
   );
};

export const SafetyReportingPage: React.FC<{ user: User; onNavigate: (p: string) => void }> = ({ user, onNavigate }) => {
   const { t } = useTheme();
   const [submitted, setSubmitted] = useState(false);
   const [formData, setFormData] = useState({
      category: '',
      incidentDate: '',
      description: ''
   });

   const handleSubmit = async () => {
      if (!formData.category || !formData.incidentDate || !formData.description) {
         alert('Please fill in all fields');
         return;
      }

      // Import safety report service and supabase
      const { createSafetyReport } = await import('../services/safetyReportService');
      const { supabase } = await import('../services/supabase');

      // Get the authenticated user's UUID from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         alert('You must be logged in to submit a safety report');
         return;
      }

      const report = await createSafetyReport({
         reporter_id: session.user.id, // Use auth UUID, not custom user.id
         reporter_name: user.name || 'Unknown',
         reporter_role: user.role === 'VOLUNTEER' || user.role === 'CLIENT_VOLUNTEER' ? 'VOLUNTEER' : 'CLIENT',
         category: formData.category,
         incident_date: formData.incidentDate,
         description: formData.description,
         status: 'PENDING'
      });

      if (report) {
         console.log('✅ Safety report submitted:', report.id);
         setSubmitted(true);
      } else {
         console.error('❌ Failed to submit safety report');
         alert('Failed to submit report. Please try again.');
      }
   };

   if (submitted) {
      return (
         <Card className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
               <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('safety.submitted')}</h2>
            <p className="text-slate-600 mb-6">{t('safety.submitted_desc')}</p>
            <Button onClick={() => onNavigate('dashboard')}>{t('common.return_dashboard')}</Button>
         </Card>
      );
   }

   return (
      <div className="max-w-2xl mx-auto py-8">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t('safety.report_concern')}</h1>
         <Card>
            <div className="space-y-4">
               <Input
                  label={t('safety.concern_category')}
                  aria-label={t('safety.concern_category')}
                  title={t('safety.concern_category')}
                  id="concernCategory"
                  as="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
               >
                  <option value="">{t('common.select_category')}</option>
                  <option value="Medical Emergency">{t('safety.cat_medical')}</option>
                  <option value="Home Safety Hazard">{t('safety.cat_hazard')}</option>
                  <option value="Client Behavioral Concern">{t('safety.cat_behavior')}</option>
                  <option value="Volunteer Injury">{t('safety.cat_injury')}</option>
                  <option value="Animal / Pet Issue">{t('safety.cat_pet')}</option>
                  <option value="Other">{t('common.other')}</option>
               </Input>

               <Input
                  label={t('safety.incident_date')}
                  type="datetime-local"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
               />

               <Input
                  label={t('safety.incident_desc')}
                  as="textarea"
                  rows={4}
                  placeholder={t('safety.incident_placeholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
               />

               <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-bold flex items-center gap-2"><Info size={16} /> {t('common.note')}</p>
                  <p>{t('safety.emergency_note')}</p>
               </div>

               <div className="flex justify-end gap-4 pt-4">
                  <Button variant="outline" onClick={() => onNavigate('dashboard')}>{t('common.cancel')}</Button>
                  <Button variant="danger" onClick={handleSubmit}>{t('safety.submit_report')}</Button>
               </div>
            </div>
         </Card>
      </div>
   );
};

export const CommunityResources: React.FC = () => {
   const { t } = useTheme();
   const [expandedSection, setExpandedSection] = useState<string | null>(null);

   const toggleSection = (section: string) => {
      setExpandedSection(expandedSection === section ? null : section);
   };

   return (
      <div className="max-w-3xl mx-auto space-y-6">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('resources.title')}</h1>
         <p className="text-slate-600 dark:text-slate-300">{t('resources.subtitle')}</p>

         <div className="grid gap-4">
            {/* Food Assistance */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button
                  onClick={() => toggleSection('food')}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <Utensils size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.food_assistance')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'food' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'food' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.np_food_pantry')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.np_food_hours')}</p>
                        <p className="text-sm text-slate-500">{t('resources.np_food_address')}</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.or_food_bank')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.or_food_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 282-0555</p>
                        <a href="https://www.oregonfoodbank.org" target="_blank" rel="noopener noreferrer" className="text-brand-600 text-sm hover:underline">{t('resources.visit_website')}</a>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.snap_benefits')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.snap_desc')}</p>
                        <p className="text-sm text-brand-600">1-800-699-9075</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Transportation */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('transportation')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <Bus size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.transportation')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'transportation' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'transportation' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.ride_connection')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.ride_connection_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 226-0700</p>
                        <a href="https://rideconnection.org" target="_blank" rel="noopener noreferrer" className="text-brand-600 text-sm hover:underline">{t('resources.visit_website')}</a>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.trimet_reduced')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.trimet_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 238-7433</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Housing & Utilities */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('housing')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <Home size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.housing_utilities')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'housing' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'housing' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.wc_housing')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.wc_housing_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 846-4794</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.energy_assist')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.energy_desc')}</p>
                        <p className="text-sm text-brand-600">1-800-453-5511</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.211_info')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.211_desc')}</p>
                        <p className="text-sm text-brand-600">{t('resources.dial_211')}</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Healthcare */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('healthcare')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <Heart size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.healthcare')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'healthcare' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'healthcare' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.virginia_garcia')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.virginia_garcia_desc')}</p>
                        <p className="text-sm text-slate-500">{t('resources.hillsboro_location')}</p>
                        <p className="text-sm text-brand-600">(503) 352-6000</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.or_health_plan')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.or_health_desc')}</p>
                        <p className="text-sm text-brand-600">1-800-699-9075</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.medicare_info')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.medicare_desc')}</p>
                        <p className="text-sm text-brand-600">1-800-MEDICARE (1-800-633-4227)</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Mental Health */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('mental')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <Heart size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.mental_health')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'mental' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'mental' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.wc_crisis')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.wc_crisis_desc')}</p>
                        <p className="text-sm text-brand-600 font-bold">(503) 291-9111</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.988_lifeline')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.988_desc')}</p>
                        <p className="text-sm text-brand-600 font-bold">{t('resources.dial_988')}</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.nami_oregon')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.nami_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 230-8009</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Legal & Financial */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('legal')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <FileText size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.legal_financial')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'legal' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'legal' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.legal_aid')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.legal_aid_desc')}</p>
                        <p className="text-sm text-brand-600">1-800-520-5292</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.senior_law')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.senior_law_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 224-4086</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Emergency Services */}
            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <button onClick={() => toggleSection('emergency')} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3">
                     <ShieldAlert size={24} className="text-brand-600" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('resources.emergency_services')}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedSection === 'emergency' ? 'rotate-180' : ''}`} />
               </button>
               {expandedSection === 'emergency' && (
                  <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.emergency_911')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.emergency_911_desc')}</p>
                        <p className="text-sm text-red-600 font-bold text-lg">{t('resources.dial_911')}</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.non_emergency_police')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.non_emergency_desc')}</p>
                        <p className="text-sm text-brand-600">(503) 629-0111</p>
                     </div>
                     <div className="border-b pb-4 last:border-0 dark:border-slate-700">
                        <h3 className="font-bold dark:text-white">{t('resources.adult_protective')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resources.adult_protective_desc')}</p>
                        <p className="text-sm text-brand-600">1-855-503-SAFE (7233)</p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

const PasswordChangeForm: React.FC = () => {
   const { t } = useTheme();
   const [isEditing, setIsEditing] = useState(false);
   const [currentPass, setCurrentPass] = useState('');
   const [newPass, setNewPass] = useState('');
   const [confirmPass, setConfirmPass] = useState('');

   if (!isEditing) {
      return (
         <div className="flex items-center justify-between">
            <div>
               <label className="block text-sm font-bold mb-1">{t('settings.current_password')}</label>
               <div className="font-mono text-sm text-slate-500">••••••••</div>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(true)}>{t('settings.change_password')}</Button>
         </div>
      );
   }

   return (
      <div className="space-y-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
         <Input
            label={t('settings.current_password')}
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
         />
         <Input
            label="New Password"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
         />
         <Input
            label="Confirm New Password"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
         />
         <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => setIsEditing(false)}>{t('btn.save')}</Button>
         </div>
      </div>
   );
};



export const VolunteerSettings: React.FC = () => {
   const { t } = useTheme();
   return (
      <div className="max-w-xl mx-auto space-y-6">
         <h2 className="text-2xl font-bold dark:text-white">{t('settings.account_settings')}</h2>

         <Card title={t('settings.notification_prefs')}>
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <label htmlFor="emailNotifs" className="font-medium text-slate-700 dark:text-slate-300">{t('settings.email_notifs')}</label>
                  <input id="emailNotifs" type="checkbox" defaultChecked className="w-5 h-5 rounded text-brand-600" />
               </div>
               <div className="flex items-center justify-between">
                  <label htmlFor="smsAlerts" className="font-medium text-slate-700 dark:text-slate-300">{t('settings.sms_alerts')}</label>
                  <input id="smsAlerts" type="checkbox" defaultChecked className="w-5 h-5 rounded text-brand-600" />
               </div>
               <div className="flex items-center justify-between">
                  <label htmlFor="marketing" className="font-medium text-slate-700 dark:text-slate-300">{t('settings.marketing')}</label>
                  <input id="marketing" type="checkbox" className="w-5 h-5 rounded text-brand-600" />
               </div>
            </div>
         </Card>

         <Card title={t('settings.security')}>
            <div className="space-y-4">
               {/* Password Management */}
               <PasswordChangeForm />
            </div>
         </Card>

         <Card title={t('settings.privacy_data')}>
            <div className="space-y-4">
               <div>
                  <Button variant="danger" size="sm">{t('settings.deactivate_account')}</Button>
               </div>
            </div>
         </Card>
      </div>
   );
};

// --- Styling Helpers ---
const getCategoryColor = (cat: RequestCategory) => {
   switch (cat) {
      case RequestCategory.RIDE: return 'bg-blue-500 text-blue-500';
      case RequestCategory.SHOPPING: return 'bg-green-500 text-green-500';
      case RequestCategory.SOCIAL: return 'bg-purple-500 text-purple-500';
      case RequestCategory.HOME_HELP: return 'bg-orange-500 text-orange-500';
      default: return 'bg-slate-500 text-slate-500';
   }
};

const getCategoryIcon = (cat: RequestCategory) => {
   switch (cat) {
      case RequestCategory.RIDE: return <Car size={16} />;
      case RequestCategory.SHOPPING: return <ShoppingBasket size={16} />;
      case RequestCategory.SOCIAL: return <Heart size={16} />;
      case RequestCategory.HOME_HELP: return <Home size={16} />;
      default: return <HelpCircle size={16} />;
   }
};
