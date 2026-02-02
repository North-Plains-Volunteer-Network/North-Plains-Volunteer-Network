import { supabase } from './supabase';

export interface TrainingProgress {
    id?: string;
    user_id: string;
    // Legacy single-role fields
    platform_video_watched: boolean;
    safety_video_watched: boolean;
    // Role-specific fields for dual users
    volunteer_platform_watched?: boolean;
    volunteer_safety_watched?: boolean;
    client_platform_watched?: boolean;
    client_safety_watched?: boolean;
    quiz_score?: number;
    training_complete: boolean;
    completed_at?: string;
    created_at?: string;
    updated_at?: string;
}

export const saveTrainingProgress = async (userId: string, progress: Partial<TrainingProgress>): Promise<boolean> => {
    console.log('📝 Attempting to save training progress:', { userId, progress });

    // First, check if a record exists
    const { data: existing, error: fetchError } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error checking existing progress:', fetchError);
        return false;
    }

    if (existing) {
        // Update existing record
        console.log('🔄 Updating existing record:', existing.id);
        const { error } = await supabase
            .from('training_progress')
            .update({
                platform_tutorial_watched: progress.platform_video_watched ?? existing.platform_tutorial_watched,
                safety_training_watched: progress.safety_video_watched ?? existing.safety_training_watched,
                // quiz_score: progress.quiz_score ?? existing.quiz_score, // Not in simple schema, ignored for now or map to platform/safety quiz
                training_complete: progress.training_complete ?? existing.training_complete,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Error updating training progress:', error);
            return false;
        }
    } else {
        // Create new record
        console.log('✨ Creating new record for user:', userId);
        const { error } = await supabase
            .from('training_progress')
            .insert([{
                user_id: userId,
                platform_tutorial_watched: progress.platform_video_watched || false,
                safety_training_watched: progress.safety_video_watched || false,
                training_complete: progress.training_complete || false
            }]);

        if (error) {
            console.error('❌ Error creating training progress:', error);
            return false;
        }
    }

    console.log('✅ Successfully saved training progress!');
    return true;
};

export const getTrainingProgress = async (userId: string): Promise<TrainingProgress | null> => {
    const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching training progress:', error);
        }
        return null;
    }

    // Map DB columns back to app interface
    return {
        id: data.id,
        user_id: data.user_id,
        platform_video_watched: data.platform_tutorial_watched,
        safety_video_watched: data.safety_training_watched,
        quiz_score: data.platform_quiz_score, // Simplification
        training_complete: data.training_complete,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
};
