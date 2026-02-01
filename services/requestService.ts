import { supabase } from './supabase';
import { Request, RequestStatus } from '../types';

export const createRequest = async (requestData: Partial<Request>): Promise<Request | null> => {
    const { data, error } = await supabase
        .from('requests')
        .insert([{
            client_id: requestData.clientId,
            client_name: requestData.clientName,
            client_language: requestData.clientLanguage || 'English',
            category: requestData.category,
            subcategory: requestData.subcategory,
            description: requestData.description,
            date: requestData.date,
            time_window: requestData.timeWindow,
            appointment_time: requestData.appointmentTime,
            pickup_time: requestData.pickupTime,
            return_time: requestData.returnTime,
            location: requestData.location,
            pickup_address: requestData.pickupAddress,
            destination_address: requestData.destinationAddress,
            geozone: requestData.geozone || 'North Plains - Central',
            is_recurring: requestData.isRecurring || false,
            is_flexible: requestData.isFlexible || false,
            flex_start_date: requestData.flexStartDate,
            flex_end_date: requestData.flexEndDate,
            flex_times: requestData.flexTimes,
            is_group_event: requestData.isGroupEvent || false,
            max_volunteers: requestData.maxVolunteers || 1,
            admin_review_required: requestData.adminReviewRequired || false,
            admin_review_reason: requestData.adminReviewReason || null,
            status: RequestStatus.PENDING
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating request:', error);
        return null;
    }

    return data as Request;
};

export const getRequests = async (): Promise<Request[]> => {
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }

    // Transform snake_case from Supabase to camelCase for TypeScript
    return (data || []).map((row: any) => ({
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientLanguage: row.client_language,
        clientPhone: row.client_phone,
        clientEmail: row.client_email,
        category: row.category,
        subcategory: row.subcategory,
        description: row.description,
        date: row.date,
        timeWindow: row.time_window,
        appointmentTime: row.appointment_time,
        pickupTime: row.pickup_time,
        returnTime: row.return_time,
        isRecurring: row.is_recurring,
        recurrencePattern: row.recurrence_pattern,
        isFlexible: row.is_flexible,
        flexStartDate: row.flex_start_date,
        flexEndDate: row.flex_end_date,
        flexTimes: row.flex_times,
        location: row.location,
        pickupAddress: row.pickup_address,
        destinationAddress: row.destination_address,
        geozone: row.geozone,
        volunteerId: row.volunteer_id,
        volunteerName: row.volunteer_name,
        status: row.status,
        completedDate: row.completed_date,
        hoursLogged: row.hours_logged,
        clientRating: row.client_rating,
        volunteerRating: row.volunteer_rating,
        clientSurveyCompleted: row.client_survey_completed,
        volunteerSurveyCompleted: row.volunteer_survey_completed,
        clientFeedback: row.client_feedback,
        volunteerFeedback: row.volunteer_feedback,
        safetyAlert: row.safety_alert,
        alertResolved: row.alert_resolved,
        adminNotes: row.admin_notes,
        isGroupEvent: row.is_group_event,
        maxVolunteers: row.max_volunteers,
        enrolledVolunteers: row.enrolled_volunteers,
        adminReviewRequired: row.admin_review_required,
        adminReviewReason: row.admin_review_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        matchedDate: row.matched_date,
        metadata: row.metadata
    }));
};

export const updateRequest = async (requestId: string, updates: Partial<Request>): Promise<boolean> => {
    const { error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', requestId);

    if (error) {
        console.error('Error updating request:', error);
        return false;
    }

    return true;
};
