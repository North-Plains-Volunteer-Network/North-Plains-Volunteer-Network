

export enum UserRole {
  GUEST = 'GUEST',
  CLIENT = 'CLIENT',
  VOLUNTEER = 'VOLUNTEER',
  CLIENT_VOLUNTEER = 'CLIENT_VOLUNTEER', // New Dual Role
  COORDINATOR = 'COORDINATOR',
  ADMIN = 'ADMIN'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum RequestCategory {
  RIDE = 'Ride',
  SHOPPING = 'Errand',
  SOCIAL = 'Social/Emotional Support',
  HOME_HELP = 'Home Help/Safety',
  TECHNOLOGY = 'Technology',
  OTHER = 'Other'
}

export enum OnboardingStep {
  PROFILE = 1,
  SKILLS = 2,
  BACKGROUND_CHECK = 3,
  TRAINING = 4,
  COMPLETE = 5
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string; // Prefilled North Plains

  // Onboarding State
  onboardingStep: OnboardingStep;
  intakeDate?: string; // Date of program entry
  justFinishedOnboarding?: boolean; // Transient flag to trigger welcome modal
  emailVerified?: boolean; // Email verification status (required before full access)

  // Client Specific - HUD & Safety
  preferredName?: string;
  dob?: string;
  gender?: string;
  preferredLanguage?: string;
  preferredContactMethod?: 'Call' | 'Text' | 'Email';

  // HUD: Demographics
  race?: string; // HUD standard
  ethnicity?: 'Hispanic/Latino' | 'Not Hispanic/Latino'; // HUD specific
  veteranStatus?: boolean;
  maritalStatus?: string;

  // HUD: Household
  householdType?: string; // Single adult, Family w/ children, etc.
  householdSize?: number;
  hasMinors?: boolean;
  hasSeniors?: boolean;

  // HUD: Income & Benefits
  incomeRange?: string; // HUD picklist
  incomeSources?: string[]; // Wages, SSI, SSDI, Pension, etc.
  nonCashBenefits?: string[]; // SNAP, TANF, WIC, etc.

  // HUD: Disability
  disabilityStatus?: boolean; // HUD basic requirement
  disabilityType?: string; // Functional limitation
  affectsIndependence?: boolean; // Does it affect ability to live independently?

  // Service Info
  // referralSource removed

  emergencyContact?: {
    name: string;
    phone: string;
    relation?: string;
  };

  pets?: string; // Types and names
  interestingFacts?: string;
  hobbies?: string[]; // Shared field for both roles now

  accessibility?: {
    hearing: string; // "Yes", "No", "Unknown"
    vision: string;
    mobility: string; // "Walker", "Wheelchair", "Stairs difficult"
    notes?: string;
  };

  // Volunteer Specific
  totalHours?: number;
  badges?: string[];
  newBadges?: string[]; // Badges earned but not yet acknowledged by user (triggers popup)
  backgroundCheckStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_STARTED';
  backgroundCheckQuestionsComplete?: boolean; // Track if intake form background questions are completed
  trainingComplete?: boolean;
  languages?: string[];
  isDriver?: boolean;

  // Admin/Reporting
  lastActiveDate?: string;

  // Compliance
  signature?: string;
  waiverAcceptedDate?: string;

  // Notifications
  notifications?: Notification[];
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  calendar: boolean; // Opt-in for calendar downloads/attachments
}

export interface Notification {
  id: string;
  type: 'INFO' | 'ACTION_REQUIRED';
  message: string;
  date: string;
  read: boolean;
  requestId?: string;
  actionType?: 'KEEP_DROP';
}

export interface Request {
  id: string;
  clientId: string;
  clientName: string;
  category: RequestCategory;
  subcategory: string;
  description: string;
  date: string; // ISO date string

  // Legacy single time string, kept for compatibility
  timeWindow: string;

  // New Transportation Logic
  appointmentTime?: string; // When they need to be there
  pickupTime?: string; // When volunteer arrives
  returnTime?: string; // Optional return

  // Location / Geozone
  location: string; // Destination name/address
  geozone: string; // "North Plains - Central", "Glencoe Area" - shown to volunteers pre-match

  status: RequestStatus;
  volunteerId?: string;
  volunteerName?: string;
  clientLanguage?: string; // Client's preferred language for volunteer matching

  // Logistics
  isRecurring?: boolean;
  frequency?: string;
  endDate?: string;

  // Cancellation
  cancellationReason?: string;

  // Group Events
  isGroupEvent?: boolean;
  maxVolunteers?: number;
  enrolledVolunteers?: string[]; // List of volunteer IDs

  // Ride Specifics
  pickupAddress?: string;
  destinationAddress?: string;

  // Safety & Notes
  safetyAlert?: boolean;
  safetyNotes?: string;
  adminNotes?: string;
  alertResolved?: boolean;

  // Admin Review
  adminReviewRequired?: boolean; // Flag for requests needing admin approval (e.g., "Other" category)
  adminReviewReason?: string; // Why it needs review

  // Survey Status
  clientSurveyCompleted?: boolean;
  volunteerSurveyCompleted?: boolean;

  // Flexible Schedule
  isFlexible?: boolean;
  flexStartDate?: string;
  flexEndDate?: string;
  flexTimes?: string; // "Morning", "Afternoon", or custom range text

}

export interface SafetyReport {
  id: string;
  requestId?: string;
  reporterId: string;
  reporterName: string;
  reporterRole: 'CLIENT' | 'VOLUNTEER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  description: string;
  adminNotes?: string;
  status: 'NEW' | 'IN_REVIEW' | 'RESOLVED';
  date: string;
  assignedStaff?: string;
  subjectName?: string; // Person the report is about
}

export interface BadgeDef {
  id: string;
  labelKey: string; // Updated to match usage in Volunteer.tsx (t(badge.labelKey)) - Wait, let me check usage first.
  icon: string;
  color: string;
  descriptionKey: string; // Updated to match usage in Volunteer.tsx
}

export type CommunicationType = 'EMAIL' | 'SMS';

export interface CommunicationLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  type: CommunicationType;
  subject: string; // or Message Snippet for SMS
  date: string; // ISO
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  opened: boolean; // Engagement metric
}
