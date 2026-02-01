import { supabase } from './supabase';

export interface SafetyReport {
    id?: string;
    reporter_id: string;
    reporter_name: string;
    reporter_role: 'VOLUNTEER' | 'CLIENT';
    category: string;
    incident_date: string;
    description: string;
    request_id?: string;
    status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
    admin_notes?: string;
    created_at?: string;
}

export const createSafetyReport = async (reportData: Omit<SafetyReport, 'id' | 'created_at'>): Promise<SafetyReport | null> => {
    const { data, error } = await supabase
        .from('safety_reports')
        .insert([{
            reporter_id: reportData.reporter_id,
            reporter_name: reportData.reporter_name,
            reporter_role: reportData.reporter_role,
            report_type: reportData.category, // Map category to report_type
            title: reportData.category, // Use category as title
            description: reportData.description,
            related_request_id: reportData.request_id,
            status: reportData.status || 'PENDING',
            severity: 'MEDIUM', // Default severity
            priority: 'NORMAL', // Default priority
            admin_notes: reportData.admin_notes
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating safety report:', error);
        return null;
    }

    return data as SafetyReport;
};

export const getSafetyReports = async (): Promise<SafetyReport[]> => {
    const { data, error } = await supabase
        .from('safety_reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching safety reports:', error);
        return [];
    }

    return data as SafetyReport[];
};

export const updateSafetyReport = async (reportId: string, updates: Partial<SafetyReport>): Promise<boolean> => {
    const { error } = await supabase
        .from('safety_reports')
        .update(updates)
        .eq('id', reportId);

    if (error) {
        console.error('Error updating safety report:', error);
        return false;
    }

    return true;
};
