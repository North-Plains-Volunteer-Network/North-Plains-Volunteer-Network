import React, { useState, useEffect } from 'react';
import { Request, RequestStatus, RequestCategory, SafetyReport, UserRole, CommunicationLog, CommunicationType } from '../types';
import { MOCK_COMM_LOGS } from '../services/mockData';
import { exportToCSV } from '../utils/export';
import { StatWidget, Card, StatusBadge, Tabs, Input, Button, Modal, ChartContainer, StandardGrid, StandardXAxis, StandardYAxis, StandardTooltip, TimeFrameSelector } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { Users, ClipboardList, AlertTriangle, Activity, ShieldAlert, BookOpen, Mail, Shield, Download, FileText, CheckCircle, Clock, Search, MessageSquare, Filter, ChevronDown, ChevronUp, Heart, XCircle, Calendar, Printer, Send, Smartphone, TrendingUp, TrendingDown, PlayCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Export AdminAssignments
export { AdminAssignments } from './AdminAssignments';

// --- Sub-Dashboards ---

// --- Sub-Dashboards ---

export interface AdminProps {
   requests: Request[];
   onUpdateRequest: (id: string, updates: Partial<Request>) => void;
   initialTab?: string;
}

const CategoryFilterBar: React.FC<{ selected: string[], onToggle: (cat: string) => void }> = ({ selected, onToggle }) => {
   const categories = Object.values(RequestCategory);
   return (
      <div className="flex flex-wrap gap-2">
         {categories.map(cat => (
            <button
               key={cat}
               onClick={() => onToggle(cat)}
               className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${selected.includes(cat) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
            >
               {cat}
            </button>
         ))}
      </div>
   );
};

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => (
   <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data.map((val, i) => ({ i, val }))}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} />
         </LineChart>
      </ResponsiveContainer>
   </div>
);

const RequestHeatmap: React.FC<{ requests: Request[] }> = ({ requests }) => {
   // Mocking a 7-day x 3-slot grid (Morning, Afternoon, Evening)
   const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
   const times = ['Morning', 'Afternoon', 'Evening'];

   // In real app, we would parse request.date/timeWindow to fill this
   const getIntensity = (day: string, time: string) => {
      // Pseudo-random deterministic intensity for demo
      const hash = day.length + time.length;
      return (hash % 4); // 0-3 scale
   };

   return (
      <div className="h-64 flex flex-col justify-center">
         <div className="grid grid-cols-8 gap-1 text-xs">
            <div className="col-span-1"></div>
            {days.map(d => <div key={d} className="text-center font-bold text-slate-500">{d}</div>)}

            {times.map(t => (
               <React.Fragment key={t}>
                  <div className="col-span-1 font-bold text-slate-500 flex items-center">{t}</div>
                  {days.map(d => {
                     const level = getIntensity(d, t);
                     const color = level === 0 ? 'bg-slate-100' : level === 1 ? 'bg-blue-200' : level === 2 ? 'bg-blue-400' : 'bg-blue-600';
                     return (
                        <div key={`${d}-${t}`} className={`h-10 rounded ${color} border border-white hover:opacity-80 transition-opacity`} title={`Demand: ${level === 3 ? 'High' : level === 2 ? 'Medium' : 'Low'}`} />
                     );
                  })}
               </React.Fragment>
            ))}
         </div>
         <div className="flex justify-end items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Low</span>
            <div className="flex gap-0.5">
               <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
               <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
               <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            </div>
            <span>High</span>
         </div>
      </div>
   );
};

const ExecutiveDashboard: React.FC<{ requests: Request[]; onNavigate: (tab: string) => void }> = ({ requests, onNavigate }) => {
   const { t } = useTheme();
   const [timeFrame, setTimeFrame] = useState('6 Months');

   const getTimelineLabels = (range: string) => {
      const now = new Date();
      const labels = [];
      if (range === '7 Days') {
         for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else if (range === '30 Days') {
         for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 6));
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else {
         const count = range === '6 Months' ? 6 : range === '1 Year' ? 12 : range === '3 Months' ? 3 : 4;
         for (let i = count - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('default', { month: 'short' }));
         }
      }
      return labels;
   };

   // Dynamic calculations for Executive View
   const filteredRequests = requests.filter(r => {
      if (timeFrame === 'All Time') return true;
      const date = new Date(r.date);
      const now = new Date();
      let cutoff = new Date();
      if (timeFrame === '7 Days') cutoff.setDate(now.getDate() - 7);
      else if (timeFrame === '30 Days') cutoff.setDate(now.getDate() - 30);
      else if (timeFrame === '3 Months') cutoff.setMonth(now.getMonth() - 3);
      else if (timeFrame === '6 Months') cutoff.setMonth(now.getMonth() - 6);
      else if (timeFrame === '1 Year') cutoff.setFullYear(now.getFullYear() - 1);
      return date >= cutoff;
   });

   const statusCounts = filteredRequests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
   }, {} as Record<string, number>);

   const statusData = [
      { name: t('common.completed'), value: statusCounts[RequestStatus.COMPLETED] || 0, color: '#10b981' },
      { name: t('common.pending'), value: statusCounts[RequestStatus.PENDING] || 0, color: '#f59e0b' },
      { name: t('common.matched'), value: statusCounts[RequestStatus.MATCHED] || 0, color: '#0ea5e9' },
      { name: t('common.cancelled'), value: statusCounts[RequestStatus.CANCELLED] || 0, color: '#94a3b8' },
   ];

   const totalVolume = filteredRequests.length;
   const newRequests30d = requests.filter(r => {
      const d = new Date(r.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
   }).length;

   const unmetRequests = requests.filter(r => r.status === RequestStatus.EXPIRED).length;

   const unmetDemandData = getTimelineLabels(timeFrame).map((label, idx, arr) => {
      // Mocking unmet demand based on filtered request counts for a more realistic feel
      const value = Math.max(2, Math.floor(Math.random() * 5) + (timeFrame === '7 Days' ? 1 : 3));
      return { time: label, count: value };
   });

   const handlePrintReport = () => {
      window.print();
   };

   return (
      <div className="space-y-8 animate-in fade-in">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 hidden-print">
            <div>
               <h2 className="text-2xl font-bold text-slate-900">{t('admin.executive_overview')}</h2>
               <p className="text-slate-500 text-sm">{t('admin.monthly_performance')}</p>
            </div>
            <div className="flex items-center gap-3">
               <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} options={['7 Days', '30 Days', '3 Months', '6 Months', '1 Year', 'All Time']} />
               <Button size="lg" className="shadow-md flex items-center gap-2" onClick={handlePrintReport}>
                  <Printer size={20} /> {t('admin.print_report')}
               </Button>
            </div>
         </div>

         {/* Print Header (Visible only when printing) */}
         <div className="hidden print:block mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('admin.board_report')}</h1>
            <p className="text-slate-500">{t('admin.generated_on')} {new Date().toLocaleDateString()}</p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('Requests')}>
               <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{timeFrame === 'All Time' ? t('admin.total_requests') : `${t('admin.total_requests')} (${timeFrame})`}</p>
                  <div className="flex items-end gap-2">
                     <p className="text-3xl font-bold text-slate-900">{totalVolume}</p>
                     <span className="text-xs font-bold text-emerald-600 mb-1">↑ {newRequests30d} {t('admin.last_30d')}</span>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <div className={`p-3 rounded-full bg-blue-100 text-blue-600`}><ClipboardList size={24} /></div>
                  <Sparkline data={[10, 15, 12, 20, 25, 22, 30]} color="#3b82f6" />
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('Volunteers')}>
               <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('admin.active_volunteers')}</p>
                  <div className="flex items-end gap-2">
                     <p className="text-3xl font-bold text-slate-900">84</p>
                     <span className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
                        <TrendingUp size={12} /> ↑ 5 {t('admin.this_month')}
                     </span>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <div className={`p-3 rounded-full bg-indigo-100 text-indigo-600`}><Users size={24} /></div>
                  <Sparkline data={[60, 65, 70, 75, 80, 84]} color="#6366f1" />
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow ml-0" onClick={() => onNavigate('Requests')}>
               <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('admin.fulfilled_percent')}</p>
                  <div className="flex items-end gap-2">
                     <p className="text-3xl font-bold text-slate-900">94%</p>
                     <span className="text-xs font-bold text-emerald-600 mb-1">↑ 2%</span>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <div className={`p-3 rounded-full bg-emerald-100 text-emerald-600`}><CheckCircle size={24} /></div>
                  <Sparkline data={[90, 88, 92, 91, 93, 94]} color="#10b981" />
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('Safety')}>
               <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('admin.open_safety_flags')}</p>
                  <p className="text-3xl font-bold text-slate-900">3</p>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <div className={`p-3 rounded-full bg-rose-100 text-rose-600`}><AlertTriangle size={24} /></div>
                  <Sparkline data={[1, 0, 2, 1, 3, 3]} color="#f43f5e" />
               </div>
            </div>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title={t('admin.request_status_dist')}>
               <ChartContainer>
                  <PieChart>
                     <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <StandardTooltip />
                     <Legend />
                  </PieChart>
               </ChartContainer>
            </Card>
            <Card title={t('admin.unmet_demand')}>
               <ChartContainer>
                  <BarChart data={unmetDemandData}>
                     <StandardGrid />
                     <StandardXAxis dataKey="time" />
                     <StandardYAxis />
                     <StandardTooltip />
                     <Bar
                        dataKey="count"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        name="Unmet/Expired"
                        onClick={() => onNavigate('Requests')}
                        style={{ cursor: 'pointer' }}
                     />
                  </BarChart>
               </ChartContainer>
            </Card>
         </div>
      </div>
   );
};

// Reusable Filterable Table Component for Request Oversight
const RequestDataGrid: React.FC<{ title: string; requests: Request[]; onViewRequest?: (req: Request) => void }> = ({ title, requests, onViewRequest }) => {
   const { t } = useTheme();
   const [searchId, setSearchId] = useState('');
   const [filterStatus, setFilterStatus] = useState('All');
   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

   // Filters
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [clientFilter, setClientFilter] = useState('');
   const [volunteerFilter, setVolunteerFilter] = useState('');

   // 48h Logic (Gap Check)
   // A request is "Pending > 48h" if it was created more than 2 days ago and is still PENDING
   const checkIsOverdue = (req: Request) => {
      if (req.status !== RequestStatus.PENDING) return false;
      const created = new Date(req.date);
      const diff = new Date().getTime() - created.getTime();
      return diff > (48 * 60 * 60 * 1000);
   };

   const toggleCategory = (cat: string) => {
      if (selectedCategories.includes(cat)) {
         setSelectedCategories(prev => prev.filter(c => c !== cat));
      } else {
         setSelectedCategories(prev => [...prev, cat]);
      }
   };

   // Filter Logic
   const filteredRequests = requests.filter(req => {
      const matchId = !searchId || req.id.toLowerCase().includes(searchId.toLowerCase());
      const matchStatus = filterStatus === 'All' || req.status === (filterStatus as RequestStatus);
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(req.category);

      const reqDate = new Date(req.date);
      const matchStartDate = !startDate || reqDate >= new Date(startDate);
      const matchEndDate = !endDate || reqDate <= new Date(endDate);

      const matchClient = !clientFilter || req.clientName.toLowerCase().includes(clientFilter.toLowerCase());
      const matchVol = !volunteerFilter || (req.volunteerName && req.volunteerName.toLowerCase().includes(volunteerFilter.toLowerCase()));

      return matchId && matchStatus && matchCategory && matchStartDate && matchEndDate && matchClient && matchVol;
   });

   const handleExport = () => {
      // Flatten data for CSV
      const csvData = filteredRequests.map(r => ({
         ID: r.id,
         Date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
         Client: r.clientName,
         Category: r.category,
         Subcategory: r.subcategory,
         Status: r.status,
         Volunteer: r.volunteerName || 'Unassigned',
         Rating: r.status === RequestStatus.COMPLETED ? '5' : '',
         Hours: r.status === RequestStatus.COMPLETED ? '1.5' : '',
         Notes: r.adminNotes || ''
      }));
      exportToCSV(csvData, `NPVN_Requests_Export_${new Date().toISOString().split('T')[0]}`);
   };

   return (
      <Card title={title}>
         {/* Filters Bar */}
         <div className="flex flex-col gap-4 mb-6 border-b pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Date Range */}
               <Input label={t('filter.start_date')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mb-0" />
               <Input label={t('filter.end_date')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mb-0" />

               {/* Name Filters */}
               <Input label={t('filter.client_name')} placeholder={t('filter.search_client')} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="mb-0" />
               <Input label={t('filter.volunteer_name')} placeholder={t('filter.search_volunteer')} value={volunteerFilter} onChange={(e) => setVolunteerFilter(e.target.value)} className="mb-0" />
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                     type="text"
                     placeholder={t('filter.search_id')}
                     value={searchId}
                     onChange={(e) => setSearchId(e.target.value)}
                     className="pl-9 pr-4 py-2 border rounded text-sm w-48 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
               </div>

               <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter by Status"
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
               >
                  <option value="All">{t('filter.all_statuses')}</option>
                  <option value={RequestStatus.PENDING}>{t('status.PENDING')}</option>
                  <option value={RequestStatus.MATCHED}>{t('status.MATCHED')}</option>
                  <option value={RequestStatus.IN_PROGRESS}>{t('status.IN_PROGRESS')}</option>
                  <option value={RequestStatus.COMPLETED}>{t('status.COMPLETED')}</option>
                  <option value={RequestStatus.CANCELLED}>{t('status.CANCELLED')}</option>
                  <option value={RequestStatus.EXPIRED}>{t('status.EXPIRED')}</option>
               </select>

               <Button size="sm" variant="outline" className="ml-auto flex items-center gap-2" onClick={handleExport}>
                  <Download size={14} /> {t('btn.export_csv')}
               </Button>
            </div>

            <CategoryFilterBar
               selected={selectedCategories}
               onToggle={(cat) => toggleCategory(cat)}
            />
         </div>

         <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-600">
               <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
                  <tr>
                     <th className="px-4 py-3">{t('table.id')}</th>
                     <th className="px-4 py-3">{t('table.date')}</th>
                     <th className="px-4 py-3">{t('table.client')}</th>
                     <th className="px-4 py-3">{t('table.category')}</th>
                     <th className="px-4 py-3">{t('table.volunteer')}</th>
                     <th className="px-4 py-3">{t('table.status')}</th>
                     <th className="px-4 py-3">{t('table.rating')}</th>
                     <th className="px-4 py-3">{t('table.hours')}</th>
                     <th className="px-4 py-3">{t('table.notes')}</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredRequests.map(req => (
                     <tr key={req.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs">
                           {req.id}
                           {checkIsOverdue(req) && <span className="ml-2 px-1 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">48h+</span>}
                        </td>
                        <td className="px-4 py-3">{req.date}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{req.clientName}</td>
                        <td className="px-4 py-3">{t(`subcategory.${req.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || req.subcategory}</td>
                        <td className="px-4 py-3">{req.volunteerName || <span className="text-slate-400 italic">{t('request.unassigned')}</span>}</td>
                        <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                        <td className="px-4 py-3 text-amber-500 font-bold">{req.status === RequestStatus.COMPLETED ? '5.0' : '-'}</td>
                        <td className="px-4 py-3 font-mono">{req.status === RequestStatus.COMPLETED ? '1.5' : '-'}</td>
                        <td className="px-4 py-3">
                           {req.adminNotes ? (
                              <span
                                 className="text-xs bg-slate-100 p-1 rounded cursor-pointer hover:bg-slate-200 transition-colors"
                                 title={req.adminNotes}
                                 onClick={() => onViewRequest?.(req)}
                              >
                                 {t('request.has_notes')}
                              </span>
                           ) : '-'}
                        </td>
                     </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                     <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400 italic">{t('request.no_match_filters')}</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>
   );
}

const RequestReportingDashboard: React.FC<{ requests: Request[] }> = ({ requests }) => {
   const [timeFrame, setTimeFrame] = useState('All Time');
   const [filteredRequests, setFilteredRequests] = useState<Request[]>(requests);

   // --- Date Filtering Logic ---
   useEffect(() => {
      const now = new Date();
      let cutoff = new Date();
      let hasCutoff = true;

      switch (timeFrame) {
         case '7 Days':
            cutoff.setDate(now.getDate() - 7);
            break;
         case '30 Days':
            cutoff.setDate(now.getDate() - 30);
            break;
         case '3 Months':
            cutoff.setMonth(now.getMonth() - 3);
            break;
         case '1 Year':
            cutoff.setFullYear(now.getFullYear() - 1);
            break;
         default:
            hasCutoff = false;
      }

      const excludeHighHours = (r: Request) => !(r.adminNotes && r.adminNotes.includes('[AUTO-FLAG] High Hours'));

      if (hasCutoff) {
         setFilteredRequests(requests.filter(r => excludeHighHours(r) && new Date(r.date) >= cutoff));
      } else {
         setFilteredRequests(requests.filter(excludeHighHours));
      }
   }, [timeFrame, requests]);

   // --- Stats Calculation ---
   const total = filteredRequests.length;
   const completed = filteredRequests.filter(r => r.status === RequestStatus.COMPLETED).length;
   const pending = filteredRequests.filter(r => r.status === RequestStatus.PENDING).length;
   const completionRate = total ? Math.round((completed / total) * 100) : 0;

   // Group by category
   const catCounts = filteredRequests.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
   }, {} as Record<string, number>);
   const catData = Object.keys(catCounts).map(k => ({ name: k, value: catCounts[k] }));

   // Dynamic Timeline Data (Days vs Months)
   const getTimelineData = () => {
      const isShortTerm = timeFrame === '7 Days' || timeFrame === '30 Days';
      const timelineMap: Record<string, number> = {};

      filteredRequests.forEach(r => {
         const date = new Date(r.date);
         let key = '';
         if (isShortTerm) {
            // Group by Day (MM/DD)
            key = `${date.getMonth() + 1}/${date.getDate()}`;
         } else {
            // Group by Month (Short Name)
            key = date.toLocaleString('default', { month: 'short' });
         }
         timelineMap[key] = (timelineMap[key] || 0) + 1;
      });

      // Sort logic
      return Object.keys(timelineMap).map(k => ({ time: k, count: timelineMap[k] }));
   };

   const timelineData = getTimelineData();

   const statusData = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Other', value: total - completed - pending, color: '#94a3b8' }
   ];

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Request Analytics & Reporting</h2>

            {/* Time Frame Selector */}
            <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} />
         </div>

         {/* KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatWidget label="Total Volume" value={total} icon={<ClipboardList size={20} />} color="bg-blue-500" />
            <StatWidget label="Completion Rate" value={`${completionRate}%`} icon={<CheckCircle size={20} />} color="bg-emerald-500" />
            <StatWidget label="Pending Action" value={pending} icon={<Clock size={20} />} color="bg-amber-500" />
            <StatWidget label="Avg Satisfaction" value="4.8/5" icon={<Heart size={20} />} color="bg-rose-500" />
         </div>

         {/* Charts Row 1 */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={`Requests by Category (${timeFrame})`}>
               <ChartContainer>
                  {catData.length > 0 ? (
                     <BarChart data={catData}>
                        <StandardGrid />
                        <StandardXAxis dataKey="name" />
                        <StandardYAxis />
                        <StandardTooltip />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                     </BarChart>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 italic">No data for selected time frame</div>
                  )}
               </ChartContainer>
            </Card>
            <Card title={`Engagement & Request Trends (${timeFrame})`}>
               <ChartContainer>
                  {timelineData.length > 0 ? (
                     <LineChart data={timelineData}>
                        <StandardGrid />
                        <StandardXAxis dataKey="time" />
                        <StandardYAxis />
                        <StandardTooltip />
                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                     </LineChart>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 italic">No data for selected time frame</div>
                  )}
               </ChartContainer>
            </Card>
         </div>

         {/* Charts Row 2 */}
         <div className="grid grid-cols-1 gap-6">
            <Card title="Status Distribution">
               <ChartContainer>
                  {total > 0 ? (
                     <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                           {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <StandardTooltip />
                        <Legend />
                     </PieChart>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 italic">No data for selected time frame</div>
                  )}
               </ChartContainer>
            </Card>
         </div>
      </div>
   );
};

const AllRequestsTable: React.FC<{ requests: Request[]; onUpdateRequest?: (reqId: string, data: Partial<Request>) => void }> = ({ requests, onUpdateRequest }) => {
   const { t } = useTheme();
   // Action Modal State
   const [alertViewType, setAlertViewType] = useState<'PENDING_LONG' | 'EXPIRED' | 'RESCHEDULED' | 'HIGH_HOURS' | null>(null);
   const [selectedActionRequest, setSelectedActionRequest] = useState<Request | null>(null);
   const [adminNoteInput, setAdminNoteInput] = useState('');

   // Alert Logic Helpers
   const pendingLong = requests.filter(r => r.status === RequestStatus.PENDING && !r.alertResolved);
   const expired = requests.filter(r => r.status === RequestStatus.EXPIRED && !r.alertResolved);
   const rescheduled = requests.filter(r => r.status === RequestStatus.MATCHED && r.date > '2023-12-01' && !r.alertResolved);
   // Safe access to adminNotes
   const highHours = requests.filter(r => r.adminNotes && r.adminNotes.includes('[AUTO-FLAG] High Hours') && !r.alertResolved);

   const getRequestsForAlert = () => {
      if (alertViewType === 'PENDING_LONG') return pendingLong;
      if (alertViewType === 'EXPIRED') return expired;
      if (alertViewType === 'RESCHEDULED') return rescheduled;
      if (alertViewType === 'HIGH_HOURS') return highHours;
      return [];
   };

   const handleSaveNote = () => {
      if (selectedActionRequest && onUpdateRequest) {
         const newNotes = (selectedActionRequest.adminNotes ? selectedActionRequest.adminNotes + '\n' : '') + `[${new Date().toLocaleDateString()}] Admin Action: ${adminNoteInput}`;
         onUpdateRequest(selectedActionRequest.id, { adminNotes: newNotes });
         setSelectedActionRequest(null);
         setAdminNoteInput('');
      }
   };

   const handleResolveAlert = () => {
      if (selectedActionRequest && onUpdateRequest) {
         onUpdateRequest(selectedActionRequest.id, { alertResolved: true, adminNotes: (selectedActionRequest.adminNotes || '') + `\n[Alert Resolved by Admin]` });
         setSelectedActionRequest(null);
      }
   };

   const handleCancelRequest = () => {
      if (selectedActionRequest && onUpdateRequest) {
         onUpdateRequest(selectedActionRequest.id, { status: RequestStatus.CANCELLED, alertResolved: true, adminNotes: (selectedActionRequest.adminNotes || '') + `\n[Cancelled by Admin]` });
         setSelectedActionRequest(null);
      }
   };

   return (
      <div className="space-y-6">
         {/* Automated Alerts (Clickable) */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
               onClick={() => setAlertViewType('PENDING_LONG')}
               className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow group"
            >
               <div className="p-2 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                  <Clock className="text-amber-600" />
               </div>
               <div>
                  <p className="font-bold text-amber-900">{pendingLong.length} {t('alert.pending_48h')}</p>
                  <p className="text-xs text-amber-700">{t('alert.needs_assignment')}</p>
               </div>
            </div>
            <div
               onClick={() => setAlertViewType('EXPIRED')}
               className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow group"
            >
               <div className="p-2 bg-rose-100 rounded-full group-hover:bg-rose-200 transition-colors">
                  <AlertTriangle className="text-rose-600" />
               </div>
               <div>
                  <p className="font-bold text-rose-900">{expired.length} {t('alert.expired')}</p>
                  <p className="text-xs text-rose-700">{t('alert.no_match')}</p>
               </div>
            </div>
            <div
               onClick={() => setAlertViewType('RESCHEDULED')}
               className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow group"
            >
               <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Activity className="text-blue-600" />
               </div>
               <div>
                  <p className="font-bold text-blue-900">{rescheduled.length} {t('alert.rescheduled')}</p>
                  <p className="text-xs text-blue-700">{t('alert.client_initiated')}</p>
               </div>
            </div>
            <div
               onClick={() => setAlertViewType('HIGH_HOURS')}
               className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow group"
            >
               <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <AlertTriangle className="text-purple-600" />
               </div>
               <div>
                  <p className="font-bold text-purple-900">{highHours.length} {t('alert.high_hours')}</p>
                  <p className="text-xs text-purple-700">{t('alert.needs_verification')}</p>
               </div>
            </div>
         </div>

         {/* Single Filterable Table with All Requests */}
         <RequestDataGrid
            title={t('request.master_database')}
            requests={requests}
            onViewRequest={(req) => {
               setSelectedActionRequest(req);
               setAdminNoteInput(req.adminNotes || '');
            }}
         />

         {/* Alert Action Modal */}
         {alertViewType && (
            <Modal isOpen={true} onClose={() => { setAlertViewType(null); setSelectedActionRequest(null); }} title={`Action Needed: ${alertViewType.replace('_', ' ')}`}>
               <div className="space-y-4">
                  {!selectedActionRequest ? (
                     <div className="space-y-2">
                        <p className="text-sm text-slate-600">Select a request to view details and add actions.</p>
                        <div className="max-h-60 overflow-y-auto border rounded divide-y">
                           {getRequestsForAlert().map(req => (
                              <div
                                 key={req.id}
                                 className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                 onClick={() => setSelectedActionRequest(req)}
                              >
                                 <div>
                                    <p className="font-bold text-sm text-slate-900">{req.clientName} ({req.category})</p>
                                    <p className="text-xs text-slate-500">Date: {req.date}</p>
                                 </div>
                                 <StatusBadge status={req.status} />
                              </div>
                           ))}
                           {getRequestsForAlert().length === 0 && (
                              <div className="p-4 text-center text-slate-500 text-sm">No requests found in this category.</div>
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-4 animate-in fade-in">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-900">Request #{selectedActionRequest.id}</h4>
                           <button onClick={() => setSelectedActionRequest(null)} className="text-xs text-brand-600 hover:underline">Back to List</button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded text-sm space-y-1">
                           <p><strong>Client:</strong> {selectedActionRequest.clientName}</p>
                           <p><strong>Task:</strong> {t(`category.${selectedActionRequest.category}`) || selectedActionRequest.category} - {t(`subcategory.${selectedActionRequest.subcategory.toLowerCase().replace(/[\/\s-]/g, '_')}`) || selectedActionRequest.subcategory}</p>
                           <p><strong>Date:</strong> {selectedActionRequest.date}</p>
                           <p><strong>Contact:</strong> 555-0123 (Click to Call)</p>
                        </div>

                        <div className="space-y-2">
                           <h5 className="font-bold text-sm">Existing Notes</h5>
                           <div className="bg-white border p-2 rounded text-xs text-slate-600 h-20 overflow-y-auto whitespace-pre-wrap">
                              {selectedActionRequest.adminNotes || 'No notes yet.'}
                           </div>
                        </div>

                        <div className="space-y-2">
                           <h5 className="font-bold text-sm">Add Action Note</h5>
                           <Input
                              label=""
                              as="textarea"
                              rows={2}
                              placeholder="E.g. Called client, rescheduled for next week..."
                              value={adminNoteInput}
                              onChange={(e) => setAdminNoteInput(e.target.value)}
                           />
                        </div>

                        <div className="flex justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => setSelectedActionRequest(null)}>Cancel</Button>
                           <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={handleResolveAlert}>Resolve Alert</Button>
                           <Button size="sm" variant="danger" onClick={handleCancelRequest}>Cancel Request</Button>
                           <Button size="sm" onClick={handleSaveNote}>Save Note</Button>
                        </div>
                     </div>
                  )}
               </div>
            </Modal>
         )}
      </div>
   );
};

const ClientTable = () => {
   const [viewMode, setViewMode] = useState<'OPERATIONAL' | 'HUD_REPORT'>('OPERATIONAL');
   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

   // --- Comprehensive Filters ---
   const [filters, setFilters] = useState({
      searchName: '',
      role: '',
      gender: '',
      ethnicity: '',
      race: '',
      veteran: '',
      income: '',
      disability: '',
      householdType: '',
      hasMinors: '',
      hasSeniors: '',
      isolation: '',
   });

   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

   // Comprehensive Mock Client Data - Local types for filter matching
   const clients = [
      {
         id: 'c1',
         name: 'Martha Stewart',
         role: 'CLIENT',
         intakeDate: '2023-01-15',
         dob: '1948-05-12',
         gender: 'Female',
         demographics: 'White • 65+ • Low Income',
         ethnicity: 'Not Hispanic',
         veteran: false,
         disability: true,
         disabilityType: 'Mobility',
         incomeRange: '0-30k',
         incomeSources: ['Social Security', 'Pension'],
         nonCashBenefits: ['SNAP'],
         householdType: 'Single Adult',
         householdSize: 1,
         hasMinors: false,
         hasSeniors: true,
         race: 'White',
         requests: 12,
         matchRate: '100%',
         satisfaction: 4.8,
         isolation: 'Low',
         categories: [RequestCategory.RIDE, RequestCategory.HOME_HELP]
      },
      {
         id: 'c2',
         name: 'Robert Black',
         role: 'CLIENT',
         intakeDate: '2023-06-20',
         dob: '1955-11-03',
         gender: 'Male',
         demographics: 'Black • 65+ • Mod Income',
         ethnicity: 'Not Hispanic',
         veteran: true,
         disability: false,
         disabilityType: '',
         incomeRange: '30k-50k',
         incomeSources: ['Wages', 'VA Benefits'],
         nonCashBenefits: [],
         householdType: 'Couple',
         householdSize: 2,
         hasMinors: false,
         hasSeniors: true,
         race: 'Black',
         requests: 3,
         matchRate: '66%',
         satisfaction: 3.5,
         isolation: 'High',
         categories: [RequestCategory.SOCIAL]
      },
      {
         id: 'c3',
         name: 'Emily White',
         role: 'CLIENT',
         intakeDate: '2023-03-10',
         dob: '1935-08-22',
         gender: 'Female',
         demographics: 'White • 80+ • Low Income',
         ethnicity: 'Hispanic',
         veteran: false,
         disability: true,
         disabilityType: 'Vision',
         incomeRange: '0-30k',
         incomeSources: ['SSI'],
         nonCashBenefits: ['Housing Voucher', 'SNAP'],
         householdType: 'Multi-generational',
         householdSize: 4,
         hasMinors: true,
         hasSeniors: true,
         race: 'White',
         requests: 8,
         matchRate: '90%',
         satisfaction: 4.2,
         isolation: 'Med',
         categories: [RequestCategory.SHOPPING, RequestCategory.RIDE]
      },
      {
         id: 'd1',
         name: 'Alex Taylor',
         role: 'DUAL (Client+Vol)',
         intakeDate: '2023-09-05',
         dob: '1980-02-14',
         gender: 'Non-binary',
         demographics: 'Hispanic • <65 • Mod Income',
         ethnicity: 'Hispanic',
         veteran: false,
         disability: false,
         disabilityType: '',
         incomeRange: '50k-80k',
         incomeSources: ['Wages'],
         nonCashBenefits: [],
         householdType: 'Family with Children',
         householdSize: 3,
         hasMinors: true,
         hasSeniors: false,
         race: 'White',
         requests: 2,
         matchRate: '100%',
         satisfaction: 5.0,
         isolation: 'Low',
         categories: [RequestCategory.RIDE]
      },
   ];

   const filteredClients = clients.filter(c => {
      // Category Filter
      const catMatch = selectedCategories.length === 0 || c.categories.some(cat => selectedCategories.includes(cat as string));

      // Basic Search
      const nameMatch = !filters.searchName || c.name.toLowerCase().includes(filters.searchName.toLowerCase());

      // Comprehensive Filters
      const roleMatch = !filters.role || c.role.includes(filters.role);
      const genderMatch = !filters.gender || c.gender === filters.gender;
      const ethMatch = !filters.ethnicity || c.ethnicity.includes(filters.ethnicity);
      const raceMatch = !filters.race || c.race === filters.race;
      const vetMatch = !filters.veteran || (filters.veteran === 'Yes' ? c.veteran : !c.veteran);
      const incMatch = !filters.income || c.incomeRange === filters.income;
      const disMatch = !filters.disability || (filters.disability === 'Yes' ? c.disability : !c.disability);
      const hhTypeMatch = !filters.householdType || c.householdType === filters.householdType;
      const minorsMatch = !filters.hasMinors || (filters.hasMinors === 'Yes' ? c.hasMinors : !c.hasMinors);
      const seniorsMatch = !filters.hasSeniors || (filters.hasSeniors === 'Yes' ? c.hasSeniors : !c.hasSeniors);
      const isoMatch = !filters.isolation || c.isolation === filters.isolation;

      return catMatch && nameMatch && roleMatch && genderMatch && ethMatch && raceMatch && vetMatch && incMatch && disMatch && hhTypeMatch && minorsMatch && seniorsMatch && isoMatch;
   });

   const toggleCategory = (cat: string) => {
      if (selectedCategories.includes(cat)) {
         setSelectedCategories(prev => prev.filter(c => c !== cat));
      } else {
         setSelectedCategories(prev => [...prev, cat]);
      }
   };

   const updateFilter = (key: keyof typeof filters, val: string) => {
      setFilters(prev => ({ ...prev, [key]: val }));
   };

   const clearFilters = () => {
      setFilters({
         searchName: '', role: '', gender: '', ethnicity: '', race: '', veteran: '', income: '', disability: '',
         householdType: '', hasMinors: '', hasSeniors: '', isolation: '',
      });
      setSelectedCategories([]);
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">Client Database & Reporting</h2>
            <div className="bg-white p-1 rounded-lg border border-slate-200 flex text-sm font-medium shadow-sm">
               <button
                  onClick={() => setViewMode('OPERATIONAL')}
                  className={`px-4 py-2 rounded-md transition-all ${viewMode === 'OPERATIONAL' ? 'bg-brand-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                  Operational View
               </button>
               <button
                  onClick={() => setViewMode('HUD_REPORT')}
                  className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'HUD_REPORT' ? 'bg-blue-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                  <FileText size={16} /> HUD Reporting View
               </button>
            </div>
         </div>

         <Card className="overflow-hidden border-slate-300 shadow-md">
            {/* --- MASTER FILTER SECTION --- */}
            <div className="bg-slate-50 border-b border-slate-200">
               <div className="p-4 border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                     <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                           type="text"
                           placeholder="Search Client Name..."
                           value={filters.searchName}
                           onChange={e => updateFilter('searchName', e.target.value)}
                           className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                     </div>

                     <div className="flex gap-2 w-full lg:w-auto">
                        <Button
                           variant="outline"
                           onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                           className={`flex-1 lg:flex-none justify-center ${showAdvancedFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
                        >
                           <Filter size={16} className="mr-2" />
                           {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                        </Button>
                        <Button variant="outline" onClick={clearFilters} className="text-slate-500 border-slate-300 hover:text-rose-600 hover:border-rose-300">
                           Clear
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Collapsible Advanced Filters Grid */}
               {showAdvancedFilters && (
                  <div className="p-4 bg-white animate-in slide-in-from-top-2 fade-in">
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Row 1: Demographics */}
                        <Input label="Gender" as="select" className="mb-0 text-xs" value={filters.gender} onChange={e => updateFilter('gender', e.target.value)}>
                           <option value="">All</option><option>Female</option><option>Male</option><option>Non-binary</option>
                        </Input>
                        <Input label="Race" as="select" className="mb-0 text-xs" value={filters.race} onChange={e => updateFilter('race', e.target.value)}>
                           <option value="">All</option><option>White</option><option>Black</option><option>Asian</option><option>Native</option>
                        </Input>
                        <Input label="Ethnicity" as="select" className="mb-0 text-xs" value={filters.ethnicity} onChange={e => updateFilter('ethnicity', e.target.value)}>
                           <option value="">All</option><option>Hispanic</option><option>Not Hispanic</option>
                        </Input>
                        <Input label="Veteran" as="select" className="mb-0 text-xs" value={filters.veteran} onChange={e => updateFilter('veteran', e.target.value)}>
                           <option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>
                        </Input>

                        {/* Row 2: Status & Health */}
                        <Input label="Role" as="select" className="mb-0 text-xs" value={filters.role} onChange={e => updateFilter('role', e.target.value)}>
                           <option value="">All</option><option value="CLIENT">Client Only</option><option value="DUAL">Dual (Client+Vol)</option>
                        </Input>
                        <Input label="Disability" as="select" className="mb-0 text-xs" value={filters.disability} onChange={e => updateFilter('disability', e.target.value)}>
                           <option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>
                        </Input>
                        <Input label="Isolation Risk" as="select" className="mb-0 text-xs" value={filters.isolation} onChange={e => updateFilter('isolation', e.target.value)}>
                           <option value="">All</option><option>High</option><option>Med</option><option>Low</option>
                        </Input>
                        <Input label="Income Range" as="select" className="mb-0 text-xs" value={filters.income} onChange={e => updateFilter('income', e.target.value)}>
                           <option value="">All</option><option>0-30k</option><option>30k-50k</option><option>50k-80k</option>
                        </Input>

                        {/* Row 3: Household */}
                        <Input label="Household Type" as="select" className="mb-0 text-xs" value={filters.householdType} onChange={e => updateFilter('householdType', e.target.value)}>
                           <option value="">All</option><option>Single Adult</option><option>Couple</option><option>Family with Children</option><option>Multi-generational</option>
                        </Input>
                        <Input label="Has Minors" as="select" className="mb-0 text-xs" value={filters.hasMinors} onChange={e => updateFilter('hasMinors', e.target.value)}>
                           <option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>
                        </Input>
                        <Input label="Has Seniors" as="select" className="mb-0 text-xs" value={filters.hasSeniors} onChange={e => updateFilter('hasSeniors', e.target.value)}>
                           <option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>
                        </Input>
                     </div>
                  </div>
               )}

               <div className="px-4 pt-4 pb-2">
                  <CategoryFilterBar selected={selectedCategories} onToggle={toggleCategory} />
               </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200 text-sm">
                  {viewMode === 'OPERATIONAL' ? (
                     <>
                        <thead className="bg-slate-50">
                           <tr>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Client</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Role</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Service Types Used</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">HUD Profile (Summary)</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Total Requests</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Match Rate</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Satisfaction</th>
                              <th className="px-6 py-3 text-left font-bold text-slate-500">Isolation Risk</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {filteredClients.map((client, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${client.role.includes('DUAL') ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                                       {client.role}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px]">{client.categories.join(', ')}</td>
                                 <td className="px-6 py-4 text-xs text-slate-500">
                                    <div>{client.race} / {client.ethnicity}</div>
                                    <div>{client.incomeRange}</div>
                                    <div className="flex gap-1 mt-1">
                                       {client.veteran && <span className="bg-blue-100 text-blue-800 px-1 rounded text-[10px] font-bold">Vet</span>}
                                       {client.disability && <span className="bg-amber-100 text-amber-800 px-1 rounded text-[10px] font-bold">Disability</span>}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 font-mono">{client.requests}</td>
                                 <td className="px-6 py-4 text-green-600 font-bold">{client.matchRate}</td>
                                 <td className="px-6 py-4 font-bold text-amber-600">{client.satisfaction} / 5</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${client.isolation === 'High' ? 'bg-rose-100 text-rose-800' : client.isolation === 'Med' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                       {client.isolation}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </>
                  ) : (
                     /* HUD REPORTING VIEW */
                     <>
                        <thead className="bg-slate-800 text-slate-200">
                           <tr>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Intake Date</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Name</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">DOB / Gender</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Race / Ethnicity</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Veteran</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Household</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Income & Sources</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Non-Cash Benefits</th>
                              <th className="px-4 py-3 text-left text-xs uppercase font-bold whitespace-nowrap">Disability</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {filteredClients.map((client, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-3 text-xs font-mono text-slate-500">{client.intakeDate}</td>
                                 <td className="px-4 py-3 font-medium text-xs">
                                    {client.name}
                                    <div className="text-[10px] text-slate-400">{client.role}</div>
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    <div>{client.dob}</div>
                                    <div className="text-slate-500">{client.gender}</div>
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    <div className="font-medium">{client.race}</div>
                                    <div className="text-slate-500">{client.ethnicity}</div>
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    {client.veteran ? 'Yes' : 'No'}
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    <div className="font-medium">{client.householdType}</div>
                                    <div>Size: {client.householdSize}</div>
                                    <div className="text-[10px] text-slate-400">
                                       {client.hasMinors && 'Minors '}
                                       {client.hasSeniors && 'Seniors'}
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    <div className="font-medium">{client.incomeRange}</div>
                                    <div className="text-[10px] text-slate-500">{client.incomeSources.join(', ')}</div>
                                 </td>
                                 <td className="px-4 py-3 text-xs text-slate-500">
                                    {client.nonCashBenefits.join(', ') || '-'}
                                 </td>
                                 <td className="px-4 py-3 text-xs">
                                    <div className={client.disability ? 'text-amber-700 font-bold' : ''}>{client.disability ? 'Yes' : 'No'}</div>
                                    {client.disabilityType && <div className="text-[10px]">{client.disabilityType}</div>}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </>
                  )}

                  {filteredClients.length === 0 && <tr><td colSpan={9} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                     <XCircle size={32} className="mb-2 opacity-50" />
                     No clients found matching selected criteria.
                  </td></tr>}
               </table>
            </div>
            {viewMode === 'HUD_REPORT' && (
               <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                  <Button size="sm" variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50">
                     <Download size={16} className="mr-2" /> Export HUD Data (CSV)
                  </Button>
               </div>
            )}
         </Card>

         {/* Charts */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Race & Ethnicity Distribution">
               <ChartContainer>
                  <PieChart>
                     <Pie data={[
                        { name: 'White', value: 75, color: '#3b82f6' },
                        { name: 'Hispanic', value: 15, color: '#10b981' },
                        { name: 'Black', value: 5, color: '#f59e0b' },
                        { name: 'Other', value: 5, color: '#6366f1' },
                     ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                        {[
                           { name: 'White', value: 75, color: '#3b82f6' },
                           { name: 'Hispanic', value: 15, color: '#10b981' },
                           { name: 'Black', value: 5, color: '#f59e0b' },
                           { name: 'Other', value: 5, color: '#6366f1' },
                        ].map((entry, index) => <Cell key={`race-cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <StandardTooltip />
                     <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
               </ChartContainer>
            </Card>
            <Card title="Income Range Distribution">
               <ChartContainer>
                  <BarChart data={[
                     { range: '0-30k', count: 40 },
                     { range: '30k-50k', count: 35 },
                     { range: '50k-80k', count: 15 },
                     { range: '80k+', count: 10 },
                  ]}>
                     <StandardGrid />
                     <StandardXAxis dataKey="range" />
                     <StandardYAxis />
                     <StandardTooltip />
                     <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ChartContainer>
            </Card>
         </div>
      </div>
   );
};

const SafetyDashboard: React.FC<{ requests: Request[] }> = ({ requests }) => {
   const [timeFrame, setTimeFrame] = useState('6 Months');
   const [reports, setReports] = useState<SafetyReport[]>([
      { id: '1', reporterId: 'v1', reporterName: 'John Doe', reporterRole: 'VOLUNTEER', severity: 'MEDIUM', category: 'Home Hazard', description: 'Loose rug on stairs, client almost tripped.', status: 'IN_REVIEW', date: '2023-10-24', assignedStaff: 'Sarah', subjectName: 'Robert Smith' },
      { id: '2', reporterId: 'c1', reporterName: 'Martha Stewart', reporterRole: 'CLIENT', severity: 'LOW', category: 'Mobility Concern', description: 'Volunteer walked too fast for me.', status: 'NEW', date: '2023-11-02', subjectName: 'Jane Doe' },
      { id: '3', reporterId: 'v1', reporterName: 'John Doe', reporterRole: 'VOLUNTEER', severity: 'HIGH', category: 'Aggressive Pet', description: 'Dog bit my pant leg. Unsafe.', status: 'RESOLVED', date: '2023-09-15', assignedStaff: 'Mike', adminNotes: 'Spoke with client. Dog will be crated during visits.' },
   ]);

   const getTimelineLabels = (range: string) => {
      const now = new Date();
      const labels = [];
      if (range === '7 Days') {
         for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else if (range === '30 Days') {
         for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 6));
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else {
         const count = range === '6 Months' ? 6 : range === '1 Year' ? 12 : range === '3 Months' ? 3 : 4;
         for (let i = count - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('default', { month: 'short' }));
         }
      }
      return labels;
   };

   const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
   const [adminNoteInput, setAdminNoteInput] = useState('');

   // Sorting State
   const [sortField, setSortField] = useState<keyof SafetyReport>('date');
   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

   const handleSort = (field: keyof SafetyReport) => {
      if (sortField === field) {
         setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
         setSortField(field);
         setSortDirection('asc');
      }
   };

   // Filters
   const [filterSeverity, setFilterSeverity] = useState('All');
   const [filterStaff, setFilterStaff] = useState('');
   const [filterStatus, setFilterStatus] = useState('All');
   const [filterCategory, setFilterCategory] = useState('All Types');
   const [filterReporter, setFilterReporter] = useState('');
   const [filterSubject, setFilterSubject] = useState('');

   const handleSaveReport = () => {
      if (selectedReport) {
         setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, adminNotes: adminNoteInput, status: selectedReport.status } : r));
         setSelectedReport(null);
      }
   };

   // Mock Data for Charts
   const filteredReports = reports.filter(r => {
      const d = new Date(r.date);
      const now = new Date();
      let cutoff = new Date();
      let matchRange = true;
      if (timeFrame === '7 Days') cutoff.setDate(now.getDate() - 7);
      else if (timeFrame === '30 Days') cutoff.setDate(now.getDate() - 30);
      else if (timeFrame === '3 Months') cutoff.setMonth(now.getMonth() - 3);
      else if (timeFrame === '6 Months') cutoff.setMonth(now.getMonth() - 6);
      else if (timeFrame === '1 Year') cutoff.setFullYear(now.getFullYear() - 1);
      else if (timeFrame === 'All Time') matchRange = true;
      else matchRange = false;

      if (timeFrame !== 'All Time' && d < cutoff) matchRange = false;

      const matchSev = filterSeverity === 'All' || r.severity.toUpperCase() === filterSeverity.toUpperCase();
      const matchStaff = !filterStaff || (r.assignedStaff && r.assignedStaff.toLowerCase().includes(filterStaff.toLowerCase()));
      const matchStatus = filterStatus === 'All' || r.status.replace('_', ' ') === filterStatus;
      const matchCat = filterCategory === 'All Types' || r.category === filterCategory;
      const matchReporter = !filterReporter || (r.reporterName && r.reporterName.toLowerCase().includes(filterReporter.toLowerCase()));
      const matchSubject = !filterSubject || (r.subjectName && r.subjectName.toLowerCase().includes(filterSubject.toLowerCase()));
      return matchRange && matchSev && matchStaff && matchStatus && matchCat && matchReporter && matchSubject;
   }).sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
   });

   const catCounts = filteredReports.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
   }, {} as Record<string, number>);
   const categoryData = Object.keys(catCounts).map(name => ({ name, count: catCounts[name] }));

   const concernsOverTimeData = getTimelineLabels(timeFrame).map((label, idx, arr) => {
      const value = Math.floor(Math.random() * 5);
      return { time: label, count: value };
   });

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Safety Oversight & Incident Reporting</h2>
            <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} options={['7 Days', '30 Days', '3 Months', '6 Months', '1 Year', 'All Time']} />
         </div>
         {/* Required Alerts */}
         <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r shadow-sm flex justify-between items-center">
            <div>
               <h4 className="font-bold text-rose-800 flex items-center gap-2"><AlertTriangle size={20} /> Action Required</h4>
               <p className="text-sm text-rose-700">
                  {reports.filter(r => r.status === 'NEW').length} New Safety Concerns • {reports.filter(r => r.severity === 'HIGH' && r.status !== 'RESOLVED').length} High Severity Item Needs Review
               </p>
            </div>
            <Button size="sm" variant="danger" onClick={() => {
               setFilterStatus('NEW');
               setFilterSeverity('HIGH');
               setFilterCategory('All Types');
               setTimeout(() => {
                  const el = document.getElementById('safety-table');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
               }, 150);
            }}>View Alerts</Button>
         </div>

         {/* Charts - Moved Above Filters */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Safety Concerns by Category">
               <ChartContainer>
                  <BarChart data={categoryData}>
                     <StandardGrid />
                     <StandardXAxis dataKey="name" />
                     <StandardYAxis />
                     <StandardTooltip />
                     <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ChartContainer>
            </Card>
            <Card title="Concerns Over Time">
               <ChartContainer>
                  <LineChart data={concernsOverTimeData}>
                     <StandardGrid />
                     <StandardXAxis dataKey="time" />
                     <StandardYAxis />
                     <StandardTooltip />
                     <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
               </ChartContainer>
            </Card>
         </div>

         {/* Filters */}
         <Card className="bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
               <Input label="Date Range" type="date" className="mb-0" />
               <Input label="Concern Type" as="select" className="mb-0" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option>All Types</option>
                  <option>Home Safety Hazard</option>
                  <option>Medical Emergency</option>
                  <option>Client Behavioral Concern</option>
                  <option>Mobility Concern</option>
                  <option>Boundary Issue</option>
                  <option>Aggressive Pet</option>
                  <option>Animal / Pet Issue</option>
                  <option>Volunteer Injury</option>
                  <option>Other</option>
                  <option>Home Hazard</option>
                  <option>Mobility Concern</option>
                  <option>Boundary Issue</option>
                  <option>Aggressive Pet</option>
               </Input>
               <Input label="Status" as="select" className="mb-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="All">All</option>
                  <option value="NEW">New</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RESOLVED">Resolved</option>
               </Input>
               <Input label="Assigned Staff" placeholder="Search..." className="mb-0" value={filterStaff} onChange={e => setFilterStaff(e.target.value)} />
               <Input label="Reporter" placeholder="Search..." className="mb-0" value={filterReporter} onChange={e => setFilterReporter(e.target.value)} />
               <Input label="Subject" placeholder="Search..." className="mb-0" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
            </div>
         </Card>

         <Card title="Safety Concern Log" id="safety-table">
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                     <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('date')}>Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('reporterName')}>Reporter {sortField === 'reporterName' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('subjectName')}>Subject {sortField === 'subjectName' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('category')}>Type {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('severity')}>Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('status')}>Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => handleSort('assignedStaff')}>Staff {sortField === 'assignedStaff' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {filteredReports.map((report) => (
                        <tr key={report.id} className="bg-white hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedReport(report); setAdminNoteInput(report.adminNotes || ''); }}>
                           <td className="px-4 py-3 text-sm">{report.date}</td>
                           <td className="px-4 py-3 text-sm">
                              <div>{report.reporterName}</div>
                              {report.reporterRole === 'VOLUNTEER' ? (
                                 <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1 rounded">VOLUNTEER</span>
                              ) : (
                                 <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1 rounded">CLIENT</span>
                              )}
                           </td>
                           <td className="px-4 py-3 text-sm">{report.subjectName || '-'}</td>
                           <td className="px-4 py-3 text-sm">{report.category}</td>
                           <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${report.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : report.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100'}`}>
                                 {report.severity}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${report.status === 'NEW' ? 'bg-blue-100 text-blue-800' : report.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                 {report.status.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-sm">{report.assignedStaff || '-'}</td>
                           <td className="px-4 py-3 text-sm"><button className="text-blue-600 hover:underline">View/Edit</button></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>

         {selectedReport && (
            <Modal isOpen={true} onClose={() => setSelectedReport(null)} title="Manage Safety Report">
               <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                     <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Original Description (from {selectedReport.reporterRole})</h5>
                     <p className="text-sm text-slate-800">{selectedReport.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Status" as="select" value={selectedReport.status} onChange={e => selectedReport && setSelectedReport({ ...selectedReport, status: e.target.value as any })}>
                        <option value="NEW">New</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="RESOLVED">Resolved</option>
                     </Input>
                     <Input label="Assigned Staff" as="select" value={selectedReport.assignedStaff || ''} onChange={e => selectedReport && setSelectedReport({ ...selectedReport, assignedStaff: e.target.value })}>
                        <option value="">Unassigned</option>
                        <option>Sarah C.</option>
                        <option>Mike D.</option>
                     </Input>
                  </div>

                  <Input
                     label="Admin Notes / Follow-up"
                     as="textarea"
                     rows={4}
                     placeholder="Enter notes about investigation or resolution..."
                     value={adminNoteInput}
                     onChange={e => setAdminNoteInput(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                     <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
                     <Button onClick={handleSaveReport}>Save Changes</Button>
                  </div>
               </div>
            </Modal>
         )}
      </div>
   );
};

const TrainingDashboard: React.FC = () => {
   // State for Filters
   const [nameFilter, setNameFilter] = useState('');
   const [bgFilter, setBgFilter] = useState('');
   const [platformFilter, setPlatformFilter] = useState('');
   const [safetyFilter, setSafetyFilter] = useState('');
   const [statusFilter, setStatusFilter] = useState('');

   // Helper for Dynamic Date Logic
   const now = new Date();
   const getStatus = (expiry?: string) => {
      if (!expiry) return { label: 'Valid', color: 'bg-green-100 text-green-800' };
      const expDate = new Date(expiry);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) return { label: 'Expired', color: 'bg-rose-100 text-rose-800' };
      if (daysUntil < 30) return { label: `Expiring ${daysUntil}d`, color: 'bg-amber-100 text-amber-800' };
      return { label: 'Valid', color: 'bg-green-100 text-green-800' };
   };

   // Mock Compliance Logs
   const complianceLogs = [
      { id: 1, name: 'John Doe', bgCheck: 'Approved', platform: 'Complete', safety: 'Complete', lastDate: 'Oct 10, 2023', expires: '2023-11-20', status: 'Active' },
      { id: 2, name: 'Jane Smith', bgCheck: 'Pending', platform: 'Complete', safety: 'Incomplete', lastDate: 'Nov 01, 2023', expires: '2024-06-01', status: 'Onboarding' },
      { id: 3, name: 'Bob Wilson', bgCheck: 'Approved', platform: 'Complete', safety: 'Complete', lastDate: 'Sep 15, 2023', expires: '2024-09-15', status: 'Inactive' },
      { id: 4, name: 'Alice Brown', bgCheck: 'Approved', platform: 'Incomplete', safety: 'Incomplete', lastDate: 'Nov 05, 2023', expires: '2023-05-10', status: 'Onboarding' }, // Expired
   ];

   const filteredLogs = complianceLogs.filter(log => {
      const matchName = !nameFilter || log.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchBg = !bgFilter || log.bgCheck === bgFilter;
      const matchPlat = !platformFilter || log.platform === platformFilter;
      const matchSafe = !safetyFilter || log.safety === safetyFilter;
      const matchStatus = !statusFilter || log.status === statusFilter;
      return matchName && matchBg && matchPlat && matchSafe && matchStatus;
   });

   return (
      <div className="space-y-6">
         {/* Compliance Alerts */}
         <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm">
            <h4 className="font-bold text-amber-900 flex items-center gap-2"><AlertTriangle size={20} /> Compliance Alerts</h4>
            <ul className="list-disc pl-8 mt-2 text-sm text-amber-800 space-y-1">
               <li>{complianceLogs.filter(c => getStatus(c.expires).label.includes('Expiring')).length} Volunteers have training expiring in 30 days.</li>
               <li>{complianceLogs.filter(c => c.bgCheck === 'Pending').length} Background check pending.</li>
               <li><strong>Alert:</strong> Volunteer Jane Smith attempted to accept request without completed safety training.</li>
            </ul>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatWidget label="Pending Bg Checks" value={complianceLogs.filter(c => c.bgCheck === 'Pending').length} icon={<Shield />} color="bg-blue-500" />
            <StatWidget label="Training Complete" value="88%" icon={<CheckCircle size={20} />} color="bg-emerald-500" />
            <StatWidget label="Expiring Soon" value={complianceLogs.filter(c => getStatus(c.expires).label.includes('Expiring')).length} icon={<Clock />} color="bg-amber-500" />
         </div>

         <Card title="Volunteer Compliance Log">
            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3">
               <Input label="Volunteer Name" placeholder="Search..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="mb-0" />
               <Input label="Bg Check" as="select" value={bgFilter} onChange={e => setBgFilter(e.target.value)} className="mb-0">
                  <option value="">All</option><option>Approved</option><option>Pending</option>
               </Input>
               <Input label="Platform Training" as="select" value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="mb-0">
                  <option value="">All</option><option>Complete</option><option>Incomplete</option>
               </Input>
               <Input label="Safety Training" as="select" value={safetyFilter} onChange={e => setSafetyFilter(e.target.value)} className="mb-0">
                  <option value="">All</option><option>Complete</option><option>Incomplete</option>
               </Input>
               <Input label="Status" as="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mb-0">
                  <option value="">All</option><option>Active</option><option>Onboarding</option><option>Inactive</option>
               </Input>
            </div>

            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-4 py-3 text-left font-bold uppercase">Volunteer</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Bg Check</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Background File</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Platform Training</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Safety Training</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Date Verified</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {filteredLogs.map(log => (
                        <tr key={log.id}>
                           <td className="px-4 py-3 font-medium">{log.name}</td>
                           <td className={`px-4 py-3 font-bold ${log.bgCheck === 'Approved' ? 'text-green-600' : 'text-amber-600'}`}>
                              {log.bgCheck === 'Approved' ? '✓ Approved' : '⧖ Pending'}
                           </td>
                           <td className="px-4 py-3">
                              {log.bgCheck === 'Pending' ? (
                                 <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                       // Simulate file upload
                                       const input = document.createElement('input');
                                       input.type = 'file';
                                       input.accept = '.pdf,.jpg,.png';
                                       input.onchange = () => {
                                          // Auto-approve on upload
                                          alert(`Background check uploaded for ${log.name}. Status updated to Approved.`);
                                          // In real app: update log.bgCheck to 'Approved' and log.lastDate to today
                                       };
                                       input.click();
                                    }}
                                 >
                                    Upload File
                                 </Button>
                              ) : (
                                 <span className="text-xs text-green-600">✓ On File</span>
                              )}
                           </td>
                           <td className={`px-4 py-3 font-bold ${log.platform === 'Complete' ? 'text-green-600' : 'text-slate-400'}`}>
                              {log.platform === 'Complete' ? '✓ Complete' : 'Incomplete'}
                           </td>
                           <td className={`px-4 py-3 font-bold ${log.safety === 'Complete' ? 'text-green-600' : 'text-slate-400'}`}>
                              {log.safety === 'Complete' ? '✓ Complete' : 'Incomplete'}
                           </td>
                           <td className="px-4 py-3">
                              <div>{log.lastDate}</div>
                              {log.expires && (
                                 <div className={`text-[10px] font-bold mt-1 px-1 rounded inline-block ${getStatus(log.expires).color}`}>
                                    {getStatus(log.expires).label}
                                 </div>
                              )}
                           </td>
                           <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${log.status === 'Active' ? 'bg-green-100 text-green-800' : log.status === 'Onboarding' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100'}`}>
                                 {log.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {filteredLogs.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No records match filters.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      </div>
   );
};

// --- Volunteer Oversight ---

const StrengthRadar: React.FC = () => {
   const data = [
      { subject: 'Reliability', A: 120, fullMark: 150 },
      { subject: 'Empathy', A: 98, fullMark: 150 },
      { subject: 'Punctuality', A: 86, fullMark: 150 },
      { subject: 'Communication', A: 99, fullMark: 150 },
      { subject: 'Skills', A: 85, fullMark: 150 },
      { subject: 'Teamwork', A: 65, fullMark: 150 },
   ];

   return (
      <ChartContainer>
         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
            <Radar name="Cluster Avg" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
         </RadarChart>
      </ChartContainer>
   );
};

const VolunteerTable = () => {
   const [timeFrame, setTimeFrame] = useState('6 Months');
   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
   const [searchName, setSearchName] = useState('');
   const [dateStart, setDateStart] = useState('');
   const [dateEnd, setDateEnd] = useState('');
   const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
   const [modalType, setModalType] = useState<'flags' | 'reports' | 'background' | null>(null);

   const getTimelineLabels = (range: string) => {
      const now = new Date();
      const labels = [];
      if (range === '7 Days') {
         for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else if (range === '30 Days') {
         for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 6));
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
         }
      } else {
         const count = range === '6 Months' ? 6 : range === '1 Year' ? 12 : range === '3 Months' ? 3 : 4;
         for (let i = count - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('default', { month: 'short' }));
         }
      }
      return labels;
   };

   // Mock data with categories and activity
   const volunteers = [
      { id: 'v1', name: 'John Doe', hours: 124.5, visits: 42, reliability: '98%', lastActive: '2023-11-01', badges: ['yellow', 'blue'], categories: [RequestCategory.RIDE, RequestCategory.HOME_HELP], intakeDate: '2023-01-15', safetyFlags: 0, reportsFiled: 2, bgStatus: 'Approved' },
      { id: 'v2', name: 'Alice Moore', hours: 12.0, visits: 5, reliability: '100%', lastActive: '2023-10-20', badges: ['amber'], categories: [RequestCategory.SHOPPING], intakeDate: '2023-06-20', safetyFlags: 1, reportsFiled: 0, bgStatus: 'Approved' },
      { id: 'v3', name: 'Bob Smith', hours: 55.0, visits: 20, reliability: '95%', lastActive: '2023-10-31', badges: ['green'], categories: [RequestCategory.SOCIAL, RequestCategory.RIDE], intakeDate: '2023-03-10', safetyFlags: 0, reportsFiled: 0, bgStatus: 'Pending' },
   ];

   const filteredVolunteers = volunteers.filter(v => {
      const matchCat = selectedCategories.length === 0 || v.categories.some(c => selectedCategories.includes(c));
      const matchName = !searchName || v.name.toLowerCase().includes(searchName.toLowerCase());

      const lastActive = new Date(v.lastActive);
      const matchStart = !dateStart || lastActive >= new Date(dateStart);
      const matchEnd = !dateEnd || lastActive <= new Date(dateEnd);

      return matchCat && matchName && matchStart && matchEnd;
   });

   const toggleCategory = (cat: string) => {
      if (selectedCategories.includes(cat)) {
         setSelectedCategories(prev => prev.filter(c => c !== cat));
      } else {
         setSelectedCategories(prev => [...prev, cat]);
      }
   };

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card title="Volunteer Oversight">
                  <div className="mb-4 space-y-4 bg-slate-50 p-4 rounded border border-slate-200">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Search Volunteer" placeholder="Name..." value={searchName} onChange={e => setSearchName(e.target.value)} className="mb-0" />
                        <Input label="Active From" type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="mb-0" />
                        <Input label="Active To" type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="mb-0" />
                     </div>

                     <CategoryFilterBar selected={selectedCategories} onToggle={(cat) => toggleCategory(cat)} />
                  </div>

                  <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                           <tr>
                              <th className="px-4 py-3 text-left font-bold uppercase">Volunteer</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Reliability</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Total Hours</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Bg Check</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Safety Flags</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Reports Filed</th>
                              <th className="px-4 py-3 text-left font-bold uppercase">Badges</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {filteredVolunteers.map((vol, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                 <td className="px-4 py-3 font-medium text-slate-900">
                                    <div>{vol.name}</div>
                                    <div className="text-xs text-slate-400">Last: {vol.lastActive}</div>
                                 </td>
                                 <td className="px-4 py-3 text-green-600 font-bold">{vol.reliability}</td>
                                 <td className="px-4 py-3 font-mono">{vol.hours}</td>
                                 <td className="px-4 py-3">
                                    <button
                                       onClick={() => { setSelectedVolunteer(vol); setModalType('background'); }}
                                       className={`px-2 py-1 rounded text-xs font-bold hover:opacity-80 transition-opacity ${vol.bgStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                                    >
                                       {vol.bgStatus === 'Approved' ? '✓ Valid' : '⧖ Pending'}
                                    </button>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span
                                       className={`text-xs flex items-center gap-1 ${vol.safetyFlags > 0 ? "cursor-pointer hover:text-amber-700 transition-colors underline decoration-dotted decoration-amber-300" : "text-slate-400 opacity-50"}`}
                                       onClick={() => {
                                          if (vol.safetyFlags > 0) {
                                             setSelectedVolunteer(vol);
                                             setModalType('flags');
                                          }
                                       }}
                                    >
                                       <AlertTriangle size={12} className="text-amber-600" />
                                       {vol.safetyFlags > 0 ? vol.safetyFlags : "-"}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span
                                       className={vol.reportsFiled > 0 ? "cursor-pointer hover:text-blue-700 transition-colors" : ""}
                                       onClick={() => {
                                          if (vol.reportsFiled > 0) {
                                             setSelectedVolunteer(vol);
                                             setModalType('reports');
                                          }
                                       }}
                                    >
                                       {vol.reportsFiled > 0 ? vol.reportsFiled : <span className="text-slate-300">-</span>}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                       {vol.badges.map(b => (
                                          <div key={b} className={`w-3 h-3 rounded-full bg-${b}-500`} title={b} />
                                       ))}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>
            <div>
               <div>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-800">Engagement Metrics</h3>
                     <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} options={['7 Days', '30 Days', '3 Months', '6 Months', '1 Year', 'All Time']} />
                  </div>
                  <Card title="Volunteer Strength Profile">
                     <p className="text-sm text-slate-500 mb-4">Aggregate skill and trait assessment based on post-service surveys.</p>
                     <StrengthRadar />
                  </Card>

                  <div className="mt-6">
                     <Card title="Engagement Trends">
                        <ChartContainer height={192}>
                           <AreaChart data={getTimelineLabels(timeFrame).map((time, idx) => ({
                              time,
                              volunteers: 60 + (idx * 4) + Math.floor(Math.random() * 5)
                           }))}>
                              <StandardGrid />
                              <StandardXAxis dataKey="time" />
                              <StandardYAxis />
                              <StandardTooltip />
                              <Area type="monotone" dataKey="volunteers" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                           </AreaChart>
                        </ChartContainer>
                        <p className="text-center text-xs text-slate-500 mt-2">Active Volunteers ({timeFrame})</p>
                     </Card>
                  </div>
               </div>
            </div>
         </div>

         {/* Safety & Background Details Modal */}
         {selectedVolunteer && modalType && (
            <Modal
               isOpen={true}
               onClose={() => {
                  setSelectedVolunteer(null);
                  setModalType(null);
               }}
               title={
                  modalType === 'flags' ? `Safety Flags: ${selectedVolunteer.name}` :
                     modalType === 'background' ? `Background Check: ${selectedVolunteer.name}` :
                        `Reports Filed by ${selectedVolunteer.name}`
               }
            >
               <div className="space-y-4">
                  {modalType === 'flags' ? (
                     <div>
                        <p className="text-sm text-slate-600 italic mb-4">Concise summary of safety flags. More detail available in the Safety tab.</p>
                        <div className="space-y-2">
                           {selectedVolunteer.safetyFlags > 0 ? (
                              <>
                                 <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                    <p className="font-bold text-sm">Client reported boundary issue</p>
                                    <p className="text-xs text-slate-600 mt-1">Date: Nov 15, 2023 • <span className="font-bold text-green-700">Status: Resolved</span></p>
                                 </div>
                                 {selectedVolunteer.safetyFlags > 1 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                       <p className="font-bold text-sm">Late arrival without notice</p>
                                       <p className="text-xs text-slate-600 mt-1">Date: Oct 3, 2023 • <span className="font-bold text-blue-700">Status: Coaching Provided</span></p>
                                    </div>
                                 )}
                              </>
                           ) : (
                              <p className="text-xs text-slate-400 italic py-4 text-center">No active flags for this volunteer.</p>
                           )}
                        </div>
                     </div>
                  ) : modalType === 'background' ? (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Status</p>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${selectedVolunteer.bgStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                 {selectedVolunteer.bgStatus}
                              </span>
                           </div>
                           <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Expiry Date</p>
                              <p className="text-sm font-bold">2025-11-20</p>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="text-sm font-bold flex items-center gap-2"><Shield size={16} /> Verification Documents</h4>
                           <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
                              <p className="text-xs text-slate-500 mb-3">No documents uploaded yet.</p>
                              <Button variant="outline" size="sm" className="flex items-center gap-2 mx-auto">
                                 <Download size={14} /> Upload PDF/Image
                              </Button>
                           </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                           <h4 className="text-sm font-bold mb-3">Admin Override</h4>
                           <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900 rounded-lg">
                              <div>
                                 <p className="text-sm font-bold">Manual Approval</p>
                                 <p className="text-xs text-slate-600">Force approve without external check</p>
                              </div>
                              <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                                 <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <Button variant="primary" className="flex-1">Save Changes</Button>
                           <Button variant="danger" className="flex-1">Revoke Access</Button>
                        </div>
                     </div>
                  ) : (
                     <div>
                        <p className="text-sm text-slate-600 mb-4">Safety reports filed by this volunteer:</p>
                        <div className="space-y-2">
                           <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="font-bold text-sm">Home hazard: Loose carpet</p>
                              <p className="text-xs text-slate-600 mt-1">Client: Martha S. • Date: Nov 20, 2023</p>
                           </div>
                           <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="font-bold text-sm">Aggressive pet concern</p>
                              <p className="text-xs text-slate-600 mt-1">Client: John D. • Date: Oct 12, 2023</p>
                           </div>
                        </div>
                     </div>
                  )}
                  <Button variant="outline" className="w-full mt-4" onClick={() => {
                     setSelectedVolunteer(null);
                     setModalType(null);
                  }}>Close</Button>
               </div>
            </Modal>
         )}
      </div>
   );
};



// --- Communication Dashboard (NEW) ---
const CommunicationDashboard: React.FC = () => {
   const [logs, setLogs] = useState<CommunicationLog[]>(MOCK_COMM_LOGS as any); // Type assertion for mock
   const [filterType, setFilterType] = useState<string>('All');
   const [searchTerm, setSearchTerm] = useState('');

   const filteredLogs = logs.filter(l => {
      const matchType = filterType === 'All' || l.type === filterType;
      const matchSearch = !searchTerm || l.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) || l.subject.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
   });

   // Metrics
   const totalSent = logs.length;
   const openRate = Math.round((logs.filter(l => l.opened).length / totalSent) * 100) || 0;
   const failedCount = logs.filter(l => l.status === 'FAILED').length;

   return (
      <div className="space-y-6 animate-in fade-in">
         {/* KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatWidget label="Total Messages (30d)" value={totalSent.toString()} icon={<Send size={20} />} color="bg-blue-500" />
            <StatWidget label="Engagement Rate" value={`${openRate}%`} icon={<Activity size={20} />} color="bg-emerald-500" />
            <StatWidget label="Delivery Failures" value={failedCount.toString()} icon={<AlertTriangle size={20} />} color={failedCount > 0 ? "bg-rose-500" : "bg-slate-400"} />
         </div>

         {/* Logs Table */}
         <Card title="Communication Log">
            <div className="flex flex-col md:flex-row gap-4 mb-4 border-b pb-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                     type="text"
                     placeholder="Search Recipient or Subject..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 border rounded text-sm w-full focus:ring-2 focus:ring-brand-500 outline-none"
                  />
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setFilterType('All')} className={`px-3 py-1 rounded-full text-xs font-bold border ${filterType === 'All' ? 'bg-slate-800 text-white' : 'bg-white'}`}>All</button>
                  <button onClick={() => setFilterType('EMAIL')} className={`px-3 py-1 rounded-full text-xs font-bold border ${filterType === 'EMAIL' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Email</button>
                  <button onClick={() => setFilterType('SMS')} className={`px-3 py-1 rounded-full text-xs font-bold border ${filterType === 'SMS' ? 'bg-green-600 text-white' : 'bg-white'}`}>SMS</button>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="min-w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
                     <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Recipient</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Subject / Message</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Opened</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                           <td className="px-4 py-3 text-xs font-mono">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                           <td className="px-4 py-3">
                              {log.type === 'EMAIL' ? <Mail size={16} className="text-blue-500" /> : <Smartphone size={16} className="text-green-500" />}
                           </td>
                           <td className="px-4 py-3 font-medium text-slate-900">{log.recipientName}</td>
                           <td className="px-4 py-3 text-xs">{log.recipientRole}</td>
                           <td className="px-4 py-3 max-w-xs truncate" title={log.subject}>{log.subject}</td>
                           <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : log.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                 {log.status}
                              </span>
                           </td>
                           <td className="px-4 py-3">
                              {log.opened ? <CheckCircle size={14} className="text-green-500" /> : <span className="text-slate-300">-</span>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>
      </div>
   );
};

export const AdminDashboard: React.FC<AdminProps> = ({ requests, onUpdateRequest, initialTab = 'Overview' }) => {
   const { t } = useTheme();
   const [activeTab, setActiveTab] = useState(initialTab);

   // Keep English keys for logic, translate for display
   const tabConfig = [
      { key: 'Overview', label: t('admin.overview') },
      { key: 'Requests', label: t('admin.requests') },
      { key: 'Clients', label: t('admin.clients') },
      { key: 'Volunteers', label: t('admin.volunteers') },
      { key: 'Safety', label: t('admin.safety') },
      { key: 'Training', label: t('admin.training') },
      { key: 'Communications', label: t('admin.communications') }
   ];
   const tabs = tabConfig.map(t => t.label);
   const handleTabChange = (label: string) => {
      const config = tabConfig.find(t => t.label === label);
      if (config) setActiveTab(config.key);
   };

   return (
      <div className="space-y-6">
         <Tabs tabs={tabs} activeTab={tabConfig.find(t => t.key === activeTab)?.label || tabs[0]} onChange={handleTabChange} />

         {activeTab === 'Overview' && <ExecutiveDashboard requests={requests} onNavigate={setActiveTab} />}
         {activeTab === 'Requests' && (
            <div className="space-y-8 animate-in fade-in">
               <AllRequestsTable requests={requests} onUpdateRequest={onUpdateRequest} />
               <RequestReportingDashboard requests={requests} />
            </div>
         )}
         {activeTab === 'Clients' && <ClientTable />}
         {activeTab === 'Safety' && <SafetyDashboard requests={requests} />}
         {activeTab === 'Volunteers' && <VolunteerTable />}
         {activeTab === 'Training' && <TrainingDashboard />}
         {activeTab === 'Communications' && <CommunicationDashboard />}
      </div>
   );
};
