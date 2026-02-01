import React, { useState, useEffect } from 'react';
import { Request, RequestStatus, RequestCategory, User, OnboardingStep } from '../types';
import { Card, Button, StatusBadge, StatWidget, Modal, Input, ProgressBar, Accordion, NeedHelpCard, WaiverForm, Tabs } from '../components/UI';
import { Calendar, MapPin, Clock, AlertTriangle, CheckCircle, ShieldCheck, CreditCard, Heart, ChevronRight, ChevronLeft, Phone, Mail, HelpCircle, Users, AlertCircle, Star, PlayCircle, Settings, X, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VolunteerDashboard } from './Volunteer';
import { OpportunitiesPage } from './OpportunitiesPage';
import { MOCK_USERS } from '../services/mockData';
import { useTheme } from '../context/ThemeContext';
import { downloadICS } from '../utils/export';
import { formatTimeWithAMPM } from '../services/timeUtils';
import { UnifiedOnboarding } from './UnifiedOnboarding';
import { TrainingCenter } from './TrainingCenter';

interface ClientProps {
   user: User;
   requests: Request[];
   onCreateRequest: (r: Partial<Request>) => void;
   onUpdateUser: (u: Partial<User>) => void;
   onNavigate: (p: string) => void;
   onCompleteSurvey: (reqId: string, data: any) => void;
   onUpdateRequest: (id: string, data: Partial<Request>) => void;
   onCancelRequest: (id: string, reason: string) => void;
}

export interface DualProps {
   user: User;
   requests: Request[];
   actions: {
      onCreateRequest: (r: Partial<Request>) => void;
      onUpdateUser: (u: Partial<User>) => void;
      onNavigate: (p: string) => void;
      onCompleteSurvey: (reqId: string, data: any) => void;
      onAccept: (id: string) => void;
      onCompleteRequest: (reqId: string, data: any) => void;
      onWithdraw: (reqId: string, reason: string) => void;
      onUpdateRequest: (id: string, data: Partial<Request>) => void;
      onCancelRequest: (id: string, reason: string) => void;
   };
}

export const OnboardingNextStepsModal: React.FC<{ onClose: () => void, role: 'CLIENT' | 'VOLUNTEER' }> = ({ onClose, role }) => {
   const { t } = useTheme();

   return (
      <Modal isOpen={true} onClose={onClose} title={t('welcome')}>
         <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
               <CheckCircle size={40} />
            </div>

            <h2 className="text-2xl font-bold dark:text-white">
               {t('onboarding.welcome_title')}
            </h2>

            <p className="text-slate-600 dark:text-slate-300">
               {role === 'VOLUNTEER'
                  ? t('onboarding.volunteer_thank_you')
                  : t('onboarding.client_thank_you')}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-4">
               <h3 className="font-bold text-lg dark:text-white">{t('onboarding.next_steps')}</h3>
               <ul className="space-y-3">
                  {role === 'VOLUNTEER' ? (
                     <>
                        <li className="flex items-start gap-3">
                           <div className="bg-blue-100 text-blue-700 p-1 rounded-full mt-0.5"><ShieldCheck size={14} /></div>
                           <span className="text-sm dark:text-slate-300"><strong>{t('onboarding.bg_check_title')}:</strong> {t('onboarding.bg_check_status_desc')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="bg-purple-100 text-purple-700 p-1 rounded-full mt-0.5"><PlayCircle size={14} /></div>
                           <span className="text-sm dark:text-slate-300"><strong>{t('onboarding.training')}:</strong> {t('onboarding.training_desc')}</span>
                        </li>
                     </>
                  ) : (
                     <>
                        <li className="flex items-start gap-3">
                           <div className="bg-blue-100 text-blue-700 p-1 rounded-full mt-0.5"><MessageSquare size={14} /></div>
                           <span className="text-sm dark:text-slate-300"><strong>{t('onboarding.make_request')}:</strong> {t('onboarding.make_request_desc')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="bg-purple-100 text-purple-700 p-1 rounded-full mt-0.5"><Users size={14} /></div>
                           <span className="text-sm dark:text-slate-300"><strong>{t('onboarding.get_matched')}:</strong> {t('onboarding.get_matched_desc')}</span>
                        </li>
                     </>
                  )}
               </ul>
            </div>

            <Button size="lg" className="w-full" onClick={onClose}>
               {role === 'VOLUNTEER' ? t('onboarding.go_dashboard') : t('onboarding.get_started')}
            </Button>
         </div>
      </Modal>
   );
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
            <Input label={t('contact.subject')} placeholder={t('contact.placeholder')} />
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
   // End ContactStaffModal
};

const CancellationModal: React.FC<{ request: Request; onClose: () => void; onConfirm: (reason: string) => void }> = ({ request, onClose, onConfirm }) => {
   const { t } = useTheme();
   const [reason, setReason] = useState('');

   return (
      <Modal isOpen={true} onClose={onClose} title={t('common.cancel_request')}>
         <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
               {t('client.cancel_confirm')} <strong>{request.category}</strong>?
            </p>
            {request.status === RequestStatus.MATCHED && (
               <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm rounded border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={16} className="inline mr-1 mb-0.5" />
                  {t('client.cancel_matched_warning')}
               </div>
            )}
            <Input
               label={t('common.reason')}
               placeholder={t('client.cancel_reason_placeholder')}
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               as="textarea"
            />
            <div className="flex justify-end gap-2 pt-2">
               <Button variant="outline" onClick={onClose}>{t('common.back')}</Button>
               <Button variant="danger" disabled={!reason.trim()} onClick={() => onConfirm(reason)}>{t('common.confirm_cancel')}</Button>
            </div>
         </div>
      </Modal>
   );
};

export const ClientDashboard: React.FC<ClientProps> = ({ user, requests, onCreateRequest, onUpdateUser, onNavigate, onCompleteSurvey, onUpdateRequest, onCancelRequest }) => {
   const [surveyRequest, setSurveyRequest] = useState<Request | null>(null);
   const [editingRequest, setEditingRequest] = useState<Request | null>(null);
   const [cancellingRequest, setCancellingRequest] = useState<Request | null>(null);
   const [showContact, setShowContact] = useState(false);
   const { t } = useTheme();

   // Check for onboarding
   if (user.onboardingStep !== OnboardingStep.COMPLETE) {
      return <UnifiedOnboarding user={user} onUpdate={onUpdateUser} onNavigate={onNavigate} />;
   }

   // Check for mandatory surveys (1 hour after service completion)
   useEffect(() => {
      const now = new Date();
      const pendingSurvey = requests.find(r => {
         if (r.status !== RequestStatus.COMPLETED || r.clientSurveyCompleted) return false;

         // Parse request date and time
         const [y, m, d] = r.date.split('-').map(Number);
         let serviceDateTime = new Date(y, m - 1, d);

         // Extract time from timeWindow, appointmentTime, or pickupTime
         const timeStr = r.appointmentTime || r.pickupTime || r.timeWindow;
         if (timeStr) {
            const match = timeStr.match(/(\d+):(\d+)/);
            if (match) {
               let hours = parseInt(match[1]);
               const minutes = parseInt(match[2]);
               if (timeStr.toLowerCase().includes('pm') && hours < 12) hours += 12;
               if (timeStr.toLowerCase().includes('am') && hours === 12) hours = 0;
               serviceDateTime.setHours(hours, minutes);
            }
         }

         // Add 1 hour delay
         const oneHourAfter = new Date(serviceDateTime.getTime() + 60 * 60 * 1000);

         // Show survey if current time is at least 1 hour after service time
         return now >= oneHourAfter;
      });

      if (pendingSurvey) {
         setSurveyRequest(pendingSurvey);
      }
   }, [requests]);

   const activeRequests = requests.filter(r =>
      [RequestStatus.PENDING, RequestStatus.MATCHED, RequestStatus.IN_PROGRESS].includes(r.status)
   );

   const historyRequests = requests.filter(r =>
      [RequestStatus.COMPLETED, RequestStatus.CANCELLED, RequestStatus.EXPIRED].includes(r.status)
   );

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Content Area */}
         <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-yellow-400">{t('welcome')}, {user.preferredName || user.name}</h2>
               <Button onClick={() => onNavigate('create-request')}>{t('client.new_request')}</Button>
            </div>

            {/* Active Requests */}
            <section>
               <h3 className="text-lg font-semibold text-slate-700 dark:text-white mb-4">{t('client.active_upcoming')}</h3>
               {activeRequests.length === 0 ? (
                  <Card className="p-8 text-center text-slate-500 dark:text-slate-300">{t('client.no_active')}</Card>
               ) : (
                  <div className="grid gap-6">
                     {activeRequests.map(req => (
                        <RequestCard
                           key={req.id}
                           request={req}
                           onEdit={(req) => setEditingRequest(req)}
                           onCancel={(id) => {
                              const r = requests.find(rq => rq.id === id);
                              if (r) setCancellingRequest(r);
                           }}
                        />
                     ))}
                  </div>
               )}
            </section>

            {/* History */}
            <section>
               <h3 className="text-lg font-semibold text-slate-700 dark:text-white mb-4">{t('client.history')}</h3>
               <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('common.date')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('common.category')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('table.status')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('table.volunteer')}</th>
                           </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-black divide-y divide-slate-200 dark:divide-slate-700">
                           {historyRequests.map(req => (
                              <tr key={req.id}>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{req.date}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.category}</td>
                                 <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.volunteerName || '-'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </section>
         </div>

         {/* Sidebar Area */}
         <div className="space-y-6">
            {/* Training Center for Clients */}
            <Card title={t('client.training')}>
               <div className="space-y-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                     <div className="bg-brand-600 dark:bg-yellow-400 h-2.5 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-right">{t('client.platform_overview')}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onNavigate('client-resources')}>{t('client.view_resources')}</Button>
               </div>
            </Card>

            {/* Local Resource Directory */}
            <Card title={t('client.directory')}>
               <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{t('client.access_resources')}</p>
               <Button variant="secondary" className="w-full" onClick={() => onNavigate('resources')}>{t('client.view_directory')}</Button>
            </Card>

            {/* Notifications */}
            <Card title={t('client.notifications')}>
               <div className="space-y-3">
                  {activeRequests.some(r => r.status === RequestStatus.MATCHED) && (
                     <div className="flex items-start gap-3 p-2 bg-blue-50 dark:bg-slate-800 rounded border border-blue-100 dark:border-slate-600 text-sm">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        <div>
                           <p className="font-bold text-blue-900 dark:text-blue-300">{t('client.volunteer_assigned')}</p>
                           <p className="text-xs text-blue-700 dark:text-blue-200">{t('client.neighbor_picked')}</p>
                        </div>
                     </div>
                  )}
                  <div className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition-colors text-sm">
                     <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full flex-shrink-0" />
                     <div>
                        <p className="font-medium text-slate-800 dark:text-white">{t('client.system_update')}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('client.holiday_hours')}</p>
                     </div>
                  </div>
               </div>
            </Card>

            {/* Announcements */}
            <Card title={t('client.announcements')}>
               <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                     <p className="font-bold text-slate-800 dark:text-white mb-1">{t('client.senior_events')}</p>
                     <p className="text-slate-600 dark:text-slate-300">{t('client.lunch_learn')}</p>
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

            {/* Need Help Card */}
            <NeedHelpCard />
         </div>

         {/* Mandatory Survey Modal */}
         {surveyRequest && (
            <PostServiceSurvey
               request={surveyRequest}
               onSubmit={(data) => {
                  onCompleteSurvey(surveyRequest.id, data);
                  setSurveyRequest(null);
               }}
            />
         )}

         {/* Edit Request Modal */}
         {editingRequest && (
            <EditRequestModal
               request={editingRequest}
               onClose={() => setEditingRequest(null)}
               onSave={(updatedData) => {
                  onUpdateRequest(editingRequest.id, updatedData);
                  setEditingRequest(null);
               }}
            />
         )}


         {showContact && (
            <ContactStaffModal onClose={() => setShowContact(false)} />
         )}

         {cancellingRequest && (
            <CancellationModal
               request={cancellingRequest}
               onClose={() => setCancellingRequest(null)}
               onConfirm={(reason) => {
                  onCancelRequest(cancellingRequest.id, reason);
                  setCancellingRequest(null);
               }}
            />
         )}

         {user.justFinishedOnboarding && (
            <OnboardingNextStepsModal
               role="CLIENT"
               onClose={() => onUpdateUser({ justFinishedOnboarding: false })}
            />
         )}
      </div>
   );
};

export const DualDashboard: React.FC<DualProps> = ({ user, requests, actions }) => {
   const [view, setView] = useState<'CLIENT' | 'VOLUNTEER' | 'OPPORTUNITIES'>('CLIENT');
   const { t } = useTheme();

   // Check for onboarding - dual users go through unified onboarding
   if (user.onboardingStep !== OnboardingStep.COMPLETE) {
      return <UnifiedOnboarding user={user} onUpdate={actions.onUpdateUser} onNavigate={actions.onNavigate} />;
   }

   return (
      <div className="space-y-6">
         <Tabs
            tabs={[t('client.active_upcoming'), t('vol.my_assignments'), 'Opportunities']}
            activeTab={view === 'CLIENT' ? t('client.active_upcoming') : view === 'VOLUNTEER' ? t('vol.my_assignments') : 'Opportunities'}
            onChange={(tab) => {
               if (tab === t('client.active_upcoming')) setView('CLIENT');
               else if (tab === t('vol.my_assignments')) setView('VOLUNTEER');
               else setView('OPPORTUNITIES');
            }}
         />

         {view === 'CLIENT' ? (
            <ClientDashboard
               user={user}
               requests={requests.filter(r => r.clientId === user.id)}
               onCreateRequest={actions.onCreateRequest}
               onUpdateUser={actions.onUpdateUser}
               onNavigate={actions.onNavigate}
               onCompleteSurvey={actions.onCompleteSurvey}
               onUpdateRequest={actions.onUpdateRequest}
               onCancelRequest={actions.onCancelRequest}
            />
         ) : view === 'VOLUNTEER' ? (
            <VolunteerDashboard
               user={user}
               requests={requests}
               onAccept={actions.onAccept}
               onNavigate={actions.onNavigate}
               onUpdateUser={actions.onUpdateUser}
               onCompleteRequest={actions.onCompleteRequest}
               onWithdraw={actions.onWithdraw}
            />
         ) : (
            <OpportunitiesPage
               user={user}
               requests={requests}
               onAccept={actions.onAccept}
               onNavigate={actions.onNavigate}
            />
         )}
      </div>
   );
};

const ClientOnboarding: React.FC<{ user: User; onUpdate: (u: Partial<User>) => void; onNavigate: (p: string) => void }> = ({ user, onUpdate, onNavigate }) => {
   const { t } = useTheme();
   const [step, setStep] = useState(1);
   const [error, setError] = useState<string | null>(null);
   const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
   const [formData, setFormData] = useState<Partial<User>>({
      ...user,
      incomeSources: user.incomeSources || [],
      nonCashBenefits: user.nonCashBenefits || []
   });

   // Logic for Preferred Language 'Other'
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

   const toggleArrayItem = (field: 'incomeSources' | 'nonCashBenefits', item: string) => {
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
         case 1: // Identity
            if (!formData.name || !formData.dob) {
               setError(t('common.fill_required'));
               return false;
            }
            break;
         case 2: // Demographics
            if (!formData.gender || !formData.ethnicity || !formData.race || !formData.preferredLanguage) {
               setError(t('common.fill_required'));
               return false;
            }
            if (langSelect === 'Other' && !formData.preferredLanguage) {
               setError(t('common.fill_required'));
               return false;
            }
            break;
         case 3: // Household
            if (!formData.householdType || !formData.householdSize || !formData.incomeRange) {
               setError(t('common.fill_required'));
               return false;
            }
            break;
         case 4: // Disability
            if (formData.disabilityStatus === undefined) {
               setError(t('common.fill_required'));
               return false;
            }
            if (formData.disabilityStatus === true && (!formData.disabilityType || formData.affectsIndependence === undefined)) {
               setError(t('common.fill_required'));
               return false;
            }
            break;
         case 5: // Contact
            if (!formData.phone && !formData.email) {
               setError(t('onboarding.contact_required')); // Ensure this key exists or use fallback
               return false;
            }
            if (!formData.preferredContactMethod) {
               setError(t('common.fill_required'));
               return false;
            }
            // Emergency Contact Validation
            if (!formData.emergencyContact?.name || !formData.emergencyContact?.phone || !formData.emergencyContact?.relation) {
               setError(t('onboarding.emergency_required') || "Emergency contact details are required.");
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

      onUpdate({ ...formData, adminNotes, onboardingStep: OnboardingStep.COMPLETE, intakeDate: new Date().toISOString().split('T')[0], justFinishedOnboarding: true });
   };

   return (
      <div className="max-w-2xl mx-auto py-8">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">{t('onboarding.welcome_title')}</h1>
         <p className="text-slate-600 dark:text-slate-300 text-center mb-8">{t('onboarding.welcome_desc')}</p>

         <ProgressBar current={step} total={6} labels={[t('onboarding.step_1_title').split(': ')[1], t('onboarding.step_2_title').split(': ')[1], t('onboarding.step_3_title').split(': ')[1], t('onboarding.step_4_title').split(': ')[1], t('onboarding.step_5_title').split(': ')[1], t('onboarding.waiver')]} />

         {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
               <AlertTriangle size={18} />
               <span className="font-bold">{error}</span>
            </div>
         )}

         <Card>
            {step === 1 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">{t('onboarding.step_1_title')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.first_name')} value={formData.name?.split(' ')[0] || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                     <Input label={t('onboarding.last_name')} placeholder="Smith" />
                  </div>
                  <Input label={t('onboarding.preferred_name')} value={formData.preferredName || ''} onChange={e => setFormData({ ...formData, preferredName: e.target.value })} />
                  <Input label={t('onboarding.address')} value="North Plains, OR 97133" disabled className="bg-slate-50 dark:bg-slate-800" />
                  <div>
                     <Input label={t('onboarding.dob')} type="date" value={formData.dob || ''} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                     {formData.dob && new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18 && (
                        <p className="text-xs text-amber-600 font-bold mt-1 animate-in fade-in bg-amber-50 p-2 rounded border border-amber-200">
                           {t('onboarding.minor_warning')}
                        </p>
                     )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 pt-4">
                     {/* Profile Photo */}
                     <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded border border-blue-200 dark:border-slate-600">
                        <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                           <ShieldCheck size={18} className="mr-2" />
                           {t('onboarding.profile_photo')}
                        </label>
                        <Input label="" type="file" className="bg-white dark:bg-black" onChange={(e) => handleFileUpload(e as React.ChangeEvent<HTMLInputElement>, 'avatar')} />
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mt-2">
                           "{t('onboarding.photo_desc')}"
                        </p>
                     </div>
                  </div>

                  <div className="flex justify-end pt-4">
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {/* ... (Other onboarding steps omitted for brevity, logic remains similar with dark mode classes) ... */}
            {/* I'll include the next steps with dark mode fixes */}

            {step === 2 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">{t('onboarding.step_2_title')}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('onboarding.hud_desc')}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label={t('onboarding.gender')} as="select" value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Female">{t('onboarding.female')}</option>
                        <option value="Male">{t('onboarding.male')}</option>
                        <option value="Non-binary">{t('onboarding.non_binary')}</option>
                        <option value="Prefer not to say">{t('onboarding.prefer_not_say')}</option>
                     </Input>
                     <Input label={t('onboarding.veteran_status')} as="select" value={formData.veteranStatus !== undefined ? (formData.veteranStatus ? 'Yes' : 'No') : ''} onChange={e => setFormData({ ...formData, veteranStatus: e.target.value === 'Yes' })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Yes">{t('onboarding.is_veteran')}</option>
                        <option value="No">{t('common.no')}</option>
                     </Input>
                  </div>

                  <Input label={t('onboarding.ethnicity')} as="select" value={formData.ethnicity || ''} onChange={e => setFormData({ ...formData, ethnicity: e.target.value as any })}>
                     <option value="">{t('common.select')}</option>
                     <option value="Hispanic/Latino">{t('onboarding.hispanic')}</option>
                     <option value="Not Hispanic/Latino">{t('onboarding.not_hispanic')}</option>
                  </Input>

                  <Input label={t('onboarding.race')} as="select" value={formData.race || ''} onChange={e => setFormData({ ...formData, race: e.target.value })}>
                     <option value="">{t('common.select')}</option>
                     <option value="White">{t('onboarding.white')}</option>
                     <option value="Black or African American">{t('onboarding.black')}</option>
                     <option value="Asian">{t('onboarding.asian')}</option>
                     <option value="American Indian or Alaska Native">{t('onboarding.native')}</option>
                     <option value="Native Hawaiian or Other Pacific Islander">{t('onboarding.pacific')}</option>
                     <option value="Multi-Racial">{t('onboarding.multi')}</option>
                  </Input>

                  <div>
                     <Input label={t('onboarding.preferred_language')} as="select" value={langSelect} onChange={e => handleLanguageChange(e.target.value)}>
                        <option value="">{t('common.select')}</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Other">{t('common.other')}</option>
                     </Input>
                     {langSelect === 'Other' && (
                        <Input label={t('onboarding.specify_language')} value={formData.preferredLanguage || ''} onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })} />
                     )}
                  </div>

                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 3 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">{t('onboarding.step_3_title')}</h2>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('onboarding.household_type')} as="select" value={formData.householdType || ''} onChange={e => setFormData({ ...formData, householdType: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="Single Adult">{t('onboarding.single_adult')}</option>
                        <option value="Couple">{t('onboarding.couple')}</option>
                        <option value="Family with Children">{t('onboarding.family_children')}</option>
                        <option value="Multi-generational">{t('onboarding.multi_gen')}</option>
                     </Input>
                     <Input label={t('onboarding.household_size')} type="number" value={formData.householdSize || ''} onChange={e => setFormData({ ...formData, householdSize: parseInt(e.target.value) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={formData.hasMinors || false} onChange={e => setFormData({ ...formData, hasMinors: e.target.checked })} /> {t('onboarding.includes_minors')}</label>
                     <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={formData.hasSeniors || false} onChange={e => setFormData({ ...formData, hasSeniors: e.target.checked })} /> {t('onboarding.includes_seniors')}</label>
                  </div>

                  <div className="border-t pt-4">
                     <Input label={t('onboarding.income_range')} as="select" value={formData.incomeRange || ''} onChange={e => setFormData({ ...formData, incomeRange: e.target.value })}>
                        <option value="">{t('common.select')}</option>
                        <option value="0-30k">{t('onboarding.income_under_30k')}</option>
                        <option value="30k-50k">{t('onboarding.income_30k_50k')}</option>
                        <option value="50k-80k">{t('onboarding.income_50k_80k')}</option>
                        <option value="80k+">{t('onboarding.income_80k_plus')}</option>
                     </Input>

                     <div className="mt-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('onboarding.income_sources')}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                           {['Wages', 'Social Security', 'SSI', 'SSDI', 'Pension', 'Unemployment', 'None'].map(src => (
                              <label key={src} className="flex items-center gap-2 dark:text-slate-300">
                                 <input type="checkbox" checked={formData.incomeSources?.includes(src)} onChange={() => toggleArrayItem('incomeSources', src)} />
                                 {t(`income_source.${src.toLowerCase().replace(/ /g, '_')}`) || src}
                              </label>
                           ))}
                        </div>
                     </div>

                     <div className="mt-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('onboarding.non_cash')}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                           {['SNAP', 'WIC', 'TANF', 'VA Benefits', 'Housing Voucher'].map(ben => (
                              <label key={ben} className="flex items-center gap-2 dark:text-slate-300">
                                 <input type="checkbox" checked={formData.nonCashBenefits?.includes(ben)} onChange={() => toggleArrayItem('nonCashBenefits', ben)} />
                                 {t(`non_cash.${ben.toLowerCase().replace(/ /g, '_')}`) || ben}
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

            {step === 4 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">{t('onboarding.step_4_title')}</h2>

                  <Input label={t('onboarding.has_disability')} as="select" value={formData.disabilityStatus !== undefined ? (formData.disabilityStatus ? 'Yes' : 'No') : ''} onChange={e => setFormData({ ...formData, disabilityStatus: e.target.value === 'Yes' })}>
                     <option value="">{t('common.select')}</option>
                     <option value="Yes">{t('common.yes')}</option>
                     <option value="No">{t('common.no')}</option>
                  </Input>

                  {formData.disabilityStatus && (
                     <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                        <Input label={t('onboarding.disability_type')} placeholder={t('onboarding.disability_placeholder')} value={formData.disabilityType || ''} onChange={e => setFormData({ ...formData, disabilityType: e.target.value })} />
                        <Input label={t('onboarding.affects_independence')} as="select" value={formData.affectsIndependence !== undefined ? (formData.affectsIndependence ? 'Yes' : 'No') : ''} onChange={e => setFormData({ ...formData, affectsIndependence: e.target.value === 'Yes' })}>
                           <option value="">{t('common.select')}</option>
                           <option value="Yes">{t('common.yes')}</option>
                           <option value="No">{t('common.no')}</option>
                        </Input>
                     </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                     <h3 className="font-bold text-slate-900 dark:text-white">{t('onboarding.functional_needs')}</h3>
                     <div className="grid grid-cols-3 gap-4">
                        <Input label={t('onboarding.hearing_impaired')} as="select" onChange={e => setFormData({ ...formData, accessibility: { ...(formData.accessibility || { vision: 'Unknown', mobility: "" }), hearing: e.target.value } })}>
                           <option value="Unknown">{t('common.unknown')}</option><option value="Yes">{t('common.yes')}</option><option value="No">{t('common.no')}</option>
                        </Input>
                        <Input label={t('onboarding.vision_impaired')} as="select" onChange={e => setFormData({ ...formData, accessibility: { ...(formData.accessibility || { hearing: 'Unknown', mobility: "" }), vision: e.target.value } })}>
                           <option value="Unknown">{t('common.unknown')}</option><option value="Yes">{t('common.yes')}</option><option value="No">{t('common.no')}</option>
                        </Input>
                     </div>
                     <Input label={t('onboarding.mobility_needs')} as="select" value={formData.accessibility?.mobility || ''} onChange={e => setFormData({ ...formData, accessibility: { ...(formData.accessibility || { hearing: 'Unknown', vision: 'Unknown' }), mobility: e.target.value } })}>
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

            {step === 5 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">{t('onboarding.step_5_title')}</h2>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('common.phone')} value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                     <Input label={t('common.email')} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <Input label={t('onboarding.preferred_contact')} as="select" value={formData.preferredContactMethod || ''} onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value as any })}>
                     <option value="">{t('common.select')}</option>
                     <option value="Call">{t('onboarding.contact_call')}</option>
                     <option value="Text">{t('onboarding.contact_text')}</option>
                     <option value="Email">{t('onboarding.contact_email')}</option>
                  </Input>

                  <h3 className="font-bold text-slate-700 dark:text-slate-300 pt-2">{t('onboarding.emergency_contact')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label={t('common.name')} value={formData.emergencyContact?.name || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { phone: '', relation: '' }), name: e.target.value } })} />
                     <Input label={t('common.phone')} value={formData.emergencyContact?.phone || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { name: '', relation: '' }), phone: e.target.value } })} />
                  </div>
                  <Input label={t('onboarding.relationship')} value={formData.emergencyContact?.relation || ''} onChange={e => setFormData({ ...formData, emergencyContact: { ...(formData.emergencyContact || { name: '', phone: '' }), relation: e.target.value } })} />

                  <div className="space-y-2 border-t pt-4">
                     <label className="font-medium text-slate-700 dark:text-slate-300">{t('onboarding.pets')}</label>
                     <Input label={t('onboarding.pet_details')} placeholder={t('onboarding.pet_placeholder')} value={formData.pets || ''} onChange={e => setFormData({ ...formData, pets: e.target.value })} />
                  </div>
                  <Input label={t('onboarding.hobbies')} as="textarea" value={formData.hobbies?.join(', ') || ''} onChange={e => setFormData({ ...formData, hobbies: e.target.value.split(', ') })} />



                  <div className="flex justify-between pt-6">
                     <Button variant="outline" onClick={() => setStep(s => s - 1)}>{t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.next')}</Button>
                  </div>
               </div>
            )}

            {step === 6 && (
               <WaiverForm
                  onAcknowledge={(sig) => {
                     setFormData(prev => ({ ...prev, signature: sig, waiverAcceptedDate: new Date().toISOString().split('T')[0] }));
                     handleFinish();
                  }}
                  onBack={() => setStep(5)}
               />
            )}
         </Card>
      </div>
   );
};

const RequestCard: React.FC<{ request: Request; onEdit?: (req: Request) => void; onCancel?: (id: string) => void }> = ({ request, onEdit, onCancel }) => {
   const { t } = useTheme();
   // Mock lookup for volunteer hobbies if matched
   const volunteer = Object.values(MOCK_USERS).find(u => u.id === request.volunteerId);

   return (
      <Card className="relative border-l-4 border-l-brand-500 dark:bg-slate-900">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h4 className="font-bold text-lg text-slate-900 dark:text-white">{t(`category.${request.category}`) || request.category}</h4>
               <p className="text-slate-500 dark:text-slate-300 text-sm">{t(`subcategory.${request.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || request.subcategory}</p>
            </div>
            <StatusBadge status={request.status} />
         </div>

         <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 mb-6">
            <div className="flex items-center">
               <Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
               <span>{request.date} @ {formatTimeWithAMPM(request.timeWindow || request.appointmentTime || '')}</span>
            </div>
            <div className="flex items-center">
               <MapPin className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
               <span>{request.category === RequestCategory.RIDE ? `${t('client.to')} ${request.destinationAddress || 'Destination'}` : request.location}</span>
            </div>
            {request.volunteerName ? (
               <div className="bg-green-50 dark:bg-green-900/30 rounded-md text-green-800 dark:text-green-300 border border-green-100 dark:border-green-800 mt-2">
                  <div className="flex items-center p-3">
                     <CheckCircle className="w-5 h-5 mr-2" />
                     <div>
                        <p className="font-bold text-xs uppercase">{t('client.your_volunteer')}</p>
                        <span className="font-medium">{volunteer?.preferredName || request.volunteerName}</span>
                     </div>
                  </div>
                  {/* Display Volunteer Hobbies */}
                  {volunteer && volunteer.hobbies && (
                     <div className="px-3 pb-3 pt-0 text-xs border-t border-green-100 dark:border-green-800 mt-2">
                        <p className="font-bold mt-2 text-green-700 dark:text-green-300 flex items-center gap-1"><Heart size={10} /> {t('client.hobbies')}</p>
                        <p>{volunteer.hobbies.join(', ')}</p>
                     </div>
                  )}
               </div>
            ) : (
               <div className="flex items-center p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800 mt-2 text-xs">
                  {t('client.looking_neighbor')}
               </div>
            )}

            {/* Group Event Enrollment Status */}
            {request.isGroupEvent && (
               <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-brand-50 dark:bg-slate-800 rounded-lg border border-brand-100 dark:border-slate-700">
                  <Users size={16} className="text-brand-600 dark:text-yellow-400" />
                  <div className="flex flex-col">
                     <span className="font-bold text-slate-900 dark:text-white leading-none">
                        {t('client.group_enrollment')} {request.enrolledVolunteers?.length || 0} / {request.maxVolunteers || 0}
                     </span>
                     <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {request.maxVolunteers && (request.maxVolunteers - (request.enrolledVolunteers?.length || 0) > 0) ? (
                           <>({request.maxVolunteers - (request.enrolledVolunteers?.length || 0)} {t('client.spots_remaining')})</>
                        ) : (
                           <span className="text-orange-600 dark:text-orange-400 font-medium">{t('client.full')}</span>
                        )}
                     </span>
                  </div>
               </div>
            )}
         </div>

         <div className="flex space-x-3">
            <Button
               size="sm"
               variant="outline"
               className="flex-1"
               onClick={() => onEdit?.(request)}
            >
               {t('common.edit')}
            </Button>
            {(request.status === RequestStatus.PENDING || request.status === RequestStatus.MATCHED) && (
               <Button
                  size="sm"
                  variant="danger"
                  className="flex-1"
                  onClick={() => onCancel?.(request.id)}
               >
                  {t('common.cancel')}
               </Button>
            )}
            {request.status === RequestStatus.MATCHED && (
               <Button size="sm" variant="secondary" className="pl-2 pr-2" onClick={() => downloadICS(request)} title="Add to Calendar">
                  <Calendar size={16} />
               </Button>
            )}
         </div>
      </Card>
   );
};

// Edit Request Modal Component - Enhanced to allow editing all fields
const EditRequestModal: React.FC<{ request: Request; onClose: () => void; onSave: (data: Partial<Request>) => void }> = ({ request, onClose, onSave }) => {
   const { t } = useTheme();

   // Initialize state with current request values
   const [category, setCategory] = useState(request.category);
   const [subcategory, setSubcategory] = useState(request.subcategory || '');
   const [isFlexible, setIsFlexible] = useState(request.isFlexible || false);
   const [date, setDate] = useState(request.date || '');
   const [timeWindow, setTimeWindow] = useState(request.timeWindow || request.appointmentTime || '');
   const [flexStartDate, setFlexStartDate] = useState(request.flexStartDate || '');
   const [flexEndDate, setFlexEndDate] = useState(request.flexEndDate || '');
   const [flexTimes, setFlexTimes] = useState(request.flexTimes || '');
   const [description, setDescription] = useState(request.description || '');

   // Address fields
   const [location, setLocation] = useState(request.location || '');
   const [pickupAddress, setPickupAddress] = useState(request.pickupAddress || '');
   const [destinationAddress, setDestinationAddress] = useState(request.destinationAddress || '');

   // Group event fields
   const [isGroupEvent, setIsGroupEvent] = useState(request.isGroupEvent || false);
   const [maxVolunteers, setMaxVolunteers] = useState(request.maxVolunteers || 2);

   const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
      [RequestCategory.RIDE]: ['Medical Appointment', 'Work/Job Interview', 'Social Event', 'Errand Run', 'Other'],
      [RequestCategory.SHOPPING]: ['Grocery Shopping', 'Post Office Run', 'Library Drop-off', 'Donation Drop-off', 'Other'],
      [RequestCategory.HOME_HELP]: ['Light Bulb Replacement', 'Smoke Alarm Battery', 'Moving Furniture/Boxes', 'Safety Check', 'Holiday Decoration', 'Garden/Yard Help', 'Other'],
      [RequestCategory.SOCIAL]: ['Friendly Visit', 'Phone Check-in', 'Walk Companion', 'Game/Activity Buddy', 'Reading Helper', 'Other'],
   };

   const handleSave = () => {
      const updates: Partial<Request> = {
         category,
         subcategory,
         description,
         isFlexible,
         isGroupEvent,
      };

      // Date/time handling
      if (isFlexible) {
         updates.flexStartDate = flexStartDate;
         updates.flexEndDate = flexEndDate;
         updates.flexTimes = flexTimes;
         updates.date = flexStartDate; // Use start date as primary
      } else {
         updates.date = date;
         updates.timeWindow = timeWindow;
         updates.appointmentTime = timeWindow;
      }

      // Address handling based on category
      if (category === RequestCategory.RIDE) {
         updates.pickupAddress = pickupAddress;
         updates.destinationAddress = destinationAddress;
         updates.location = destinationAddress; // Use destination as location
      } else {
         updates.location = location;
      }

      // Group event handling
      if (isGroupEvent) {
         updates.maxVolunteers = maxVolunteers;
      }

      onSave(updates);
   };

   return (
      <Modal isOpen={true} onClose={onClose} title={`${t('client.edit_title')}${request.id}`}>
         <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Category & Subcategory */}
            <div className="space-y-3">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                     {t('common.category')}
                  </label>
                  <select
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white dark:bg-black dark:border-slate-600 dark:text-white"
                     value={category}
                     aria-label={t('common.category')}
                     onChange={(e) => {
                        setCategory(e.target.value as RequestCategory);
                        setSubcategory(''); // Reset subcategory when category changes
                     }}
                  >
                     {Object.values(RequestCategory).map(cat => (
                        <option key={cat} value={cat}>{t(`category.${cat}`) || cat}</option>
                     ))}
                  </select>
               </div>

               {category !== RequestCategory.OTHER && (
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('common.subcategory')}
                     </label>
                     <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white dark:bg-black dark:border-slate-600 dark:text-white"
                        value={subcategory}
                        aria-label={t('common.subcategory')}
                        onChange={(e) => setSubcategory(e.target.value)}
                     >
                        <option value="">{t('common.select')}</option>
                        {SUBCATEGORY_OPTIONS[category]?.map(opt => (
                           <option key={opt} value={opt}>{t(`subcategory.${opt.toLowerCase().replace(/[\/\s-]/g, '_')}`) || opt}</option>
                        ))}
                     </select>
                  </div>
               )}
            </div>

            {/* Flexible Schedule Toggle */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
               <input
                  type="checkbox"
                  id="editIsFlexible"
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={isFlexible}
                  onChange={(e) => setIsFlexible(e.target.checked)}
               />
               <label htmlFor="editIsFlexible" className="font-medium text-slate-900 dark:text-white cursor-pointer select-none">
                  {t('request.is_flexible')}
               </label>
            </div>

            {/* Date/Time Fields */}
            {isFlexible ? (
               <div className="space-y-3">
                  <Input
                     label={t('request.flex_start')}
                     type="date"
                     value={flexStartDate}
                     onChange={(e) => setFlexStartDate(e.target.value)}
                  />
                  <Input
                     label={t('request.flex_end')}
                     type="date"
                     value={flexEndDate}
                     onChange={(e) => setFlexEndDate(e.target.value)}
                  />
                  <Input
                     label={t('request.flex_times')}
                     placeholder={t('request.flex_placeholder')}
                     value={flexTimes}
                     onChange={(e) => setFlexTimes(e.target.value)}
                  />
               </div>
            ) : (
               <div className="grid grid-cols-2 gap-3">
                  <Input
                     label={t('common.date')}
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                  />
                  <Input
                     label={t('common.time')}
                     type="time"
                     value={timeWindow}
                     onChange={(e) => setTimeWindow(e.target.value)}
                  />
               </div>
            )}

            {/* Address Fields - Different for Rides vs Others */}
            {category === RequestCategory.RIDE ? (
               <div className="space-y-3">
                  <Input
                     label={t('request.pickup_address')}
                     value={pickupAddress}
                     onChange={(e) => setPickupAddress(e.target.value)}
                     placeholder={t('request.pickup_placeholder')}
                  />
                  <Input
                     label={t('request.dest_address')}
                     value={destinationAddress}
                     onChange={(e) => setDestinationAddress(e.target.value)}
                     placeholder={t('request.dest_placeholder')}
                  />
               </div>
            ) : (
               <Input
                  label={t('request.service_address')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('request.service_placeholder')}
               />
            )}

            {/* Group Event Toggle */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-3">
               <div className="flex items-center gap-3">
                  <input
                     type="checkbox"
                     id="editGroupEvent"
                     className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                     checked={isGroupEvent}
                     onChange={(e) => setIsGroupEvent(e.target.checked)}
                  />
                  <label htmlFor="editGroupEvent" className="font-medium text-slate-900 dark:text-white cursor-pointer select-none">
                     {t('request.is_group')}
                  </label>
               </div>
               {isGroupEvent && (
                  <Input
                     label={t('request.volunteers_needed')}
                     type="number"
                     min={2}
                     max={20}
                     value={maxVolunteers}
                     onChange={(e) => setMaxVolunteers(parseInt(e.target.value))}
                  />
               )}
            </div>

            {/* Description */}
            <Input
               label={t('common.description')}
               as="textarea"
               rows={3}
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder={t('client.time_placeholder')}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
               <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('common.cancel')}
               </Button>
               <Button onClick={handleSave} className="flex-1">
                  {t('common.save')}
               </Button>
            </div>
         </div>
      </Modal>
   );
};

export const CreateRequestFlow: React.FC<{ onSubmit: (data: Partial<Request>) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
   const { t } = useTheme();
   // ... content largely the same, but Card and Inputs handle themselves. 
   // We just need to check for hardcoded text colors.
   // I'll update the component structure to include dark mode classes where needed.

   const [step, setStep] = useState(1);
   const [data, setData] = useState<Partial<Request>>({
      category: RequestCategory.RIDE,
      isRecurring: false
   });
   const [showUrgentWarning, setShowUrgentWarning] = useState(false);

   const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
      [RequestCategory.RIDE]: ['Medical Appointment', 'Work/Job Interview', 'Social Event', 'Errand Run', 'Other'],
      [RequestCategory.SHOPPING]: ['Grocery Shopping', 'Post Office Run', 'Library Drop-off', 'Donation Drop-off', 'Other'],
      [RequestCategory.HOME_HELP]: ['Light Bulb Replacement', 'Smoke Alarm Battery', 'Moving Furniture/Boxes', 'Safety Check', 'Holiday Decoration', 'Garden/Yard Help', 'Other'],
      [RequestCategory.SOCIAL]: ['Friendly Visit', 'Phone Check-in', 'Walk Companion', 'Game/Activity Buddy', 'Reading Helper', 'Other'],
   };

   const categories = Object.values(RequestCategory);
   const handleNext = () => setStep(s => s + 1);
   const handleBack = () => setStep(s => s - 1);

   const checkUrgentDate = (dateVal: string) => {
      if (!dateVal) return;
      const [year, month, day] = dateVal.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = selectedDate.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 0 && diffDays < 2) {
         setShowUrgentWarning(true);
      }
   };

   return (
      <div className="max-w-2xl mx-auto py-8">
         <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('request.new_title')}</h1>
            <Button variant="outline" size="sm" onClick={onCancel}>{t('common.cancel')}</Button>
         </div>

         <ProgressBar current={step} total={3} labels={[t('common.category'), t('common.description'), t('common.save')]} />

         <Card>
            {step === 1 && (
               <div className="space-y-6">
                  <h2 className="text-xl font-bold">{t('request.category_title')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {categories.map(cat => (
                        <div
                           key={cat}
                           onClick={() => setData({ ...data, category: cat })}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${data.category === cat ? 'border-brand-500 bg-brand-50 dark:bg-slate-800 dark:border-yellow-400' : 'border-slate-200 dark:border-slate-700 hover:border-brand-200'}`}
                        >
                           <h3 className="font-bold text-slate-900 dark:text-white">{cat}</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('request.assist_desc')}</p>
                        </div>
                     ))}
                  </div>

                  <div className="mt-4">
                     {data.category !== RequestCategory.OTHER ? (
                        <>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('request.subcategory_label')}</label>
                           <select
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white dark:bg-black dark:border-slate-600 dark:text-white"
                              value={data.subcategory || ''}
                              aria-label={t('request.subcategory_label')}
                              onChange={e => setData({ ...data, subcategory: e.target.value })}
                           >
                              <option value="">{t('common.select')}</option>
                              {SUBCATEGORY_OPTIONS[data.category || '']?.map(opt => (
                                 <option key={opt} value={opt}>{t(`subcategory.${opt.toLowerCase().replace(/[\/\s-]/g, '_')}`) || opt}</option>
                              ))}
                           </select>
                           <p className="text-xs text-slate-500 mt-1">{t('request.subcategory_desc')}</p>
                        </>
                     ) : (
                        <p className="text-sm text-slate-500 italic">{t('request.other_desc')}</p>
                     )}
                  </div>

                  <div className="flex justify-end pt-4">
                     <Button onClick={handleNext}>{t('common.next')} <ChevronRight size={16} className="ml-2" /></Button>
                  </div>
               </div>
            )}

            {/* Step 2 and 3 omitted for brevity but would follow same pattern. */}
            {step === 2 && (
               <div className="space-y-4">
                  <h2 className="text-xl font-bold">{t('request.details_title')}</h2>

                  <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-4">
                     <div className="flex items-center gap-3 mb-2">
                        <input
                           type="checkbox"
                           id="isFlexible"
                           className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                           checked={data.isFlexible || false}
                           onChange={e => setData({ ...data, isFlexible: e.target.checked })}
                        />
                        <label htmlFor="isFlexible" className="font-medium text-slate-900 dark:text-white cursor-pointer select-none">
                           {t('request.is_flexible')}
                        </label>
                     </div>

                     {data.isFlexible ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                           <Input
                              label={t('request.start_date')}
                              type="date"
                              value={data.flexStartDate || ''}
                              onChange={e => {
                                 setData({ ...data, flexStartDate: e.target.value });
                                 checkUrgentDate(e.target.value);
                              }}
                           />
                           <Input label={t('request.end_date')} type="date" value={data.flexEndDate || ''} onChange={e => setData({ ...data, flexEndDate: e.target.value })} />
                           <div className="md:col-span-2">
                              <Input label={t('request.preferred_times')} placeholder={t('request.preferred_times_placeholder')} value={data.flexTimes || ''} onChange={e => setData({ ...data, flexTimes: e.target.value })} />
                           </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                           <Input
                              label={t('request.date_needed')}
                              type="date"
                              value={data.date || ''}
                              onChange={e => {
                                 setData({ ...data, date: e.target.value });
                                 checkUrgentDate(e.target.value);
                              }}
                           />
                           <Input label={t('request.time_needed')} type="time" value={data.timeWindow || ''} onChange={e => setData({ ...data, timeWindow: e.target.value })} />
                        </div>
                     )}
                  </div>

                  {data.category === RequestCategory.RIDE ? (
                     <div className="space-y-4 pt-2">
                        <Input
                           label={t('request.pickup_address')}
                           value={data.pickupAddress || '123 Main St, North Plains (Home)'}
                           onChange={e => setData({ ...data, pickupAddress: e.target.value })}
                           placeholder={t('request.pickup_address_placeholder')}
                        />
                        <Input
                           label={t('request.destination_address')}
                           value={data.destinationAddress || ''}
                           onChange={e => setData({ ...data, destinationAddress: e.target.value })}
                           placeholder={t('request.destination_address_placeholder')}
                        />
                        <p className="text-xs text-slate-500">{t('request.address_privacy_note')}</p>
                     </div>
                  ) : data.category === RequestCategory.OTHER ? (
                     <Input
                        label={t('request.address_location')}
                        value={data.location || ''}
                        onChange={e => setData({ ...data, location: e.target.value })}
                        placeholder={t('request.address_location_placeholder')}
                     />
                  ) : (
                     <Input
                        label={t('request.service_address')}
                        value={data.location || ''}
                        onChange={e => setData({ ...data, location: e.target.value })}
                        placeholder={t('request.service_address_placeholder')}
                     />
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3">
                        <input
                           type="checkbox"
                           id="groupEvent"
                           className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                           checked={data.isGroupEvent || false}
                           onChange={e => setData({ ...data, isGroupEvent: e.target.checked, maxVolunteers: e.target.checked ? 2 : 1 })}
                        />
                        <label htmlFor="groupEvent" className="font-medium text-slate-900 dark:text-white cursor-pointer select-none flex items-center gap-2">
                           {t('request.is_group_event')}
                           <div className="relative group">
                              <HelpCircle size={16} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                 {t('request.group_event_help')}
                              </div>
                           </div>
                        </label>
                     </div>
                     {data.isGroupEvent && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                           <Input
                              label={t('request.volunteers_needed')}
                              type="number"
                              min={2}
                              max={20}
                              value={data.maxVolunteers || 2}
                              onChange={e => setData({ ...data, maxVolunteers: parseInt(e.target.value) })}
                           />
                           <p className="text-xs text-slate-500">{t('request.group_event_desc')}</p>
                        </div>
                     )}
                  </div>

                  <Input
                     label={data.category === RequestCategory.SOCIAL ? t('request.description_social_label') : t('request.description')}
                     as="textarea"
                     rows={3}
                     placeholder={data.category === RequestCategory.SOCIAL ? t('request.description_social_placeholder') : t('request.description_placeholder')}
                     value={data.description || ''}
                     onChange={e => setData({ ...data, description: e.target.value })}
                  />
                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={handleBack}><ChevronLeft size={16} className="mr-2" /> {t('common.back')}</Button>
                     <Button onClick={handleNext}>{t('common.review')} <ChevronRight size={16} className="ml-2" /></Button>
                  </div>
               </div>
            )}
            {step === 3 && (
               <div className="space-y-6">
                  <h2 className="text-xl font-bold">{t('request.review_title')}</h2>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3 text-sm text-slate-700 dark:text-slate-300">
                     <p><span className="font-bold">{t('common.category')}:</span> {data.category}</p>
                     <p><span className="font-bold">{t('request.task')}:</span> {data.subcategory}</p>
                     <p><span className="font-bold">{t('common.date')}:</span> {data.date || `${data.flexStartDate} - ${data.flexEndDate}`}</p>
                     {data.category === RequestCategory.RIDE ? (
                        <>
                           <p><span className="font-bold">{t('request.pickup')}:</span> {data.pickupAddress || t('request.home')}</p>
                           <p><span className="font-bold">{t('request.destination')}:</span> {data.destinationAddress}</p>
                        </>
                     ) : (
                        <p><span className="font-bold">{t('common.location')}:</span> {data.location}</p>
                     )}
                  </div>
                  <div className="flex justify-between pt-4">
                     <Button variant="outline" onClick={handleBack}>{t('common.back')}</Button>
                     <Button variant="success" onClick={() => {
                        const finalData = { ...data };
                        // Flag for admin review if "Other" category or subcategory is selected
                        if (finalData.category === RequestCategory.OTHER || finalData.subcategory === 'Other') {
                           finalData.adminReviewRequired = true;
                           finalData.adminReviewReason = finalData.category === RequestCategory.OTHER
                              ? 'Other category selected - requires admin review to ensure service is appropriate'
                              : 'Other subcategory selected - requires admin review';
                        }
                        onSubmit(finalData);
                     }} className="px-8">{t('request.submit')}</Button>
                  </div>
               </div>
            )}
         </Card>

         {/* Urgent Request Warning Modal */}
         {showUrgentWarning && (
            <Modal isOpen={true} onClose={() => setShowUrgentWarning(false)} title="Urgent Request Warning">
               <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg flex items-start gap-3 border border-amber-200 dark:border-amber-800">
                     <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                     <div>
                        <h4 className="font-bold text-amber-800 dark:text-amber-300">Notice: Short Notice Request</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                           Requests made within 48 hours are difficult to fill. We will try our best, but cannot guarantee a volunteer will be available.
                        </p>
                     </div>
                  </div>
                  <div className="flex justify-end pt-2">
                     <Button onClick={() => setShowUrgentWarning(false)}>
                        I Understand
                     </Button>
                  </div>
               </div>
            </Modal>
         )}
      </div>
   );
};

export const PostServiceSurvey: React.FC<{ request: Request; onSubmit: (data: any) => void }> = ({ request, onSubmit }) => {
   const { t } = useTheme();
   const [step, setStep] = useState<'INITIAL' | 'COMPLETED' | 'NO_SHOW' | 'UNABLE'>('INITIAL');
   const [rating, setRating] = useState(0);
   const [onTime, setOnTime] = useState('');
   const [safe, setSafe] = useState('');
   const [comments, setComments] = useState('');
   const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);

   const handleSubmit = (status: string) => {
      onSubmit({ status, rating, onTime, safe, comments, strengths: selectedStrengths });
   };

   return (
      <Modal isOpen={true} onClose={() => { }} title={t('survey.title')} hideCloseButton={true} customStyle={{ width: '90vw', maxWidth: '1200px' }}>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm dark:text-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase text-xs tracking-wide border-b pb-2">{t('survey.request_details')}</h4>

                  <div className="space-y-3">
                     <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">{t('common.service')}</span>
                        <span className="text-lg font-medium text-slate-900 dark:text-white">{t(`category.${request.category}`) || request.category} - {t(`subcategory.${request.subcategory}`) || request.subcategory}</span>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <span className="block text-xs font-bold text-slate-400 uppercase">{t('common.date')}</span>
                           <span className="font-medium text-slate-700 dark:text-slate-300">{request.date}</span>
                        </div>
                        <div>
                           <span className="block text-xs font-bold text-slate-400 uppercase">{t('common.time')}</span>
                           <span className="font-medium text-slate-700 dark:text-slate-300">
                              {request.category === 'Ride' ? `${request.pickupTime} (${t('request.pickup')})` : request.timeWindow}
                           </span>
                        </div>
                     </div>

                     <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">{t('common.volunteer')}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold">
                              {request.volunteerName ? request.volunteerName.charAt(0) : '?'}
                           </div>
                           <span className="font-medium text-slate-900 dark:text-white">{request.volunteerName || t('common.unassigned')}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               {step === 'INITIAL' && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 text-center">{t('survey.was_completed')}</h3>
                     <div className="space-y-3">
                        {[
                           { id: 'COMPLETED', label: t('survey.status_completed'), icon: CheckCircle, color: 'text-green-600', activeBg: 'bg-green-50 border-green-500', activeRing: 'ring-green-500' },
                           { id: 'NO_SHOW', label: t('survey.status_no_show'), icon: AlertTriangle, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500', activeRing: 'ring-amber-500' },
                           { id: 'UNABLE', label: t('survey.status_unable'), icon: X, color: 'text-red-600', activeBg: 'bg-red-50 border-red-500', activeRing: 'ring-red-500' }
                        ].map((option) => (
                           <button
                              key={option.id}
                              type="button"
                              onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 console.log('Setting step to', option.id);
                                 setStep(option.id as any);
                              }}
                              className="w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer relative z-10"
                           >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 ${option.color}`}>
                                 <option.icon size={20} />
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{option.label}</span>
                              <ChevronRight className="ml-auto text-slate-400" />
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {step === 'COMPLETED' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                     <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={() => setStep('INITIAL')} aria-label={t('common.back')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ChevronLeft /></button>
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{t('survey.status_completed')}</h3>
                     </div>

                     <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        {/* Rating */}
                        <div className="text-center">
                           <label className="block font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">{t('survey.rating_label')}</label>
                           <div className="flex justify-center gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                 <button
                                    key={star}
                                    type="button"
                                    className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                                    onClick={() => setRating(star)}
                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                 >
                                    <Heart size={40} fill={rating >= star ? "currentColor" : "none"} />
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* On Time & Safety - Radio Style */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">{t('survey.on_time_label')}</h3>
                              <div className="space-y-2">
                                 {['Yes', 'No'].map(opt => (
                                    <button
                                       key={opt}
                                       type="button"
                                       className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                                       onClick={() => setOnTime(opt)}
                                    >
                                       <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${onTime === opt ? 'border-brand-600' : 'border-slate-300'}`}
                                       >
                                          {onTime === opt && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                                       </div>
                                       <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{opt === 'Yes' ? t('common.yes') : t('common.no')}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">{t('survey.safe_label')}</h3>
                              <div className="space-y-2">
                                 {['Yes', 'No'].map(opt => (
                                    <button
                                       key={opt}
                                       type="button"
                                       className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                                       onClick={() => setSafe(opt)}
                                    >
                                       <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${safe === opt ? 'border-brand-600' : 'border-slate-300'}`}
                                       >
                                          {safe === opt && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                                       </div>
                                       <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{opt === 'Yes' ? t('common.yes') : t('common.no')}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Strengths */}
                        <div>
                           <label className="font-bold text-sm text-slate-700 dark:text-slate-300 block mb-2">{t('survey.strengths_label')}</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {['Reliability', 'Empathy', 'Punctuality', 'Communication', 'Skills', 'Teamwork'].map(strength => (
                                 <label key={strength} className="flex items-center gap-2 p-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <input
                                       type="checkbox"
                                       className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                       checked={selectedStrengths.includes(strength)}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setSelectedStrengths([...selectedStrengths, strength]);
                                          } else {
                                             setSelectedStrengths(selectedStrengths.filter(s => s !== strength));
                                          }
                                       }}
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                       {t(`strength.${strength.toLowerCase()}`) || strength}
                                    </span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        {/* Comments */}
                        <div>
                           <label className="font-bold text-sm text-slate-700 dark:text-slate-300 block mb-2">{t('survey.comments_label')}</label>
                           <textarea
                              className="w-full p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                              rows={3}
                              placeholder={t('survey.comments_placeholder')}
                              value={comments}
                              onChange={e => setComments(e.target.value)}
                           />
                        </div>
                     </div>

                     <div className="pt-2 space-y-3">
                        <Button
                           className="w-full py-4 text-lg font-bold shadow-md hover:shadow-lg transform transition-all active:scale-[0.99]"
                           disabled={!rating || !onTime || !safe}
                           onClick={() => handleSubmit('COMPLETED')}
                        >
                           {t('survey.submit_feedback')}
                        </Button>
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 px-4">
                           {t('survey.privacy_note')}
                        </p>
                     </div>
                  </div>
               )}

               {step === 'NO_SHOW' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                     <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={() => setStep('INITIAL')} aria-label={t('common.back')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ChevronLeft /></button>
                        <h3 className="font-bold text-xl text-amber-600">{t('survey.no_show_title')}</h3>
                     </div>
                     <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-slate-700 dark:text-slate-300 mb-4">{t('survey.no_show_desc')}</p>
                        <textarea
                           className="w-full p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-black focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                           rows={4}
                           placeholder={t('survey.comments_placeholder')}
                           value={comments}
                           onChange={e => setComments(e.target.value)}
                        />
                     </div>
                     <Button variant="danger" className="w-full py-4 font-bold" onClick={() => handleSubmit('NO_SHOW')}>
                        {t('survey.submit')}
                     </Button>
                  </div>
               )}

               {step === 'UNABLE' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                     <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={() => setStep('INITIAL')} aria-label={t('common.back')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ChevronLeft /></button>
                        <h3 className="font-bold text-xl text-red-600">{t('survey.unable_title')}</h3>
                     </div>
                     <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                        <p className="text-slate-700 dark:text-slate-300 mb-4">{t('survey.unable_desc')}</p>
                        <textarea
                           className="w-full p-4 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-black focus:ring-2 focus:ring-red-500 outline-none resize-none"
                           rows={4}
                           placeholder={t('survey.comments_placeholder')}
                           value={comments}
                           onChange={e => setComments(e.target.value)}
                        />
                     </div>
                     <Button onClick={() => handleSubmit('UNABLE')} className="w-full py-4 font-bold">
                        {t('survey.submit')}
                     </Button>
                  </div>
               )}
            </div>
         </div>
      </Modal>
   );
};

export const ClientResources: React.FC = () => {
   const { t } = useTheme();
   return (
      <div className="max-w-2xl mx-auto space-y-6">
         <h2 className="text-2xl font-bold dark:text-white">{t('client.resources_title')}</h2>
         <Card title={t('client.guide_title')}>
            <p className="mb-4">{t('client.guide_desc')}</p>
            <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
               <span className="text-slate-500 dark:text-slate-400 font-bold">{t('client.video_placeholder')}</span>
            </div>
         </Card>
      </div>
   );
};