
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, Request, OnboardingStep, RequestStatus } from './types';
import { MOCK_USERS, MOCK_REQUESTS } from './services/mockData';
import { updateUserProfile } from './services/userService';
import { getRequests } from './services/requestService';
import { PublicHome, LoginScreen, AboutPage, RegisterScreen, DonatePage } from './screens/Public';
import { ClientDashboard, CreateRequestFlow, DualDashboard } from './screens/Client';
import { TrainingCenter } from './screens/TrainingCenter';
import { VolunteerDashboard, VolunteerOnboarding, OpportunityBoard, VolunteerResources, VolunteerHistory, SafetyReportingPage, CommunityResources, DualHistory, VolunteerSettings } from './screens/Volunteer';
import { AdminDashboard, AdminAssignments } from './screens/Admin';
import { UserProfile } from './screens/Profile';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TermsOfService } from './screens/TermsOfService';
import { PrivacyPolicy } from './screens/PrivacyPolicy';

const AppContent: React.FC = () => {
  const { user, signOut, refreshProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [requests, setRequests] = useState<Request[]>(MOCK_REQUESTS);

  // Load requests from Supabase on mount and when user changes
  useEffect(() => {
    const loadRequests = async () => {
      const supabaseRequests = await getRequests();
      if (supabaseRequests.length > 0) {
        setRequests(supabaseRequests);
      }
    };

    if (user) {
      loadRequests();
    }
  }, [user]);

  // Simple Router Logic
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Auto-redirect to dashboard on login
  React.useEffect(() => {
    if (user && (currentPage === 'login' || currentPage === 'register' || currentPage === 'home')) {
      setCurrentPage('dashboard');
    }
  }, [user]);

  /* REMOVED: handleLogin and handleRegister are now handled inside LoginScreen/RegisterScreen */

  const handleLogout = () => {
    signOut();
    handleNavigate('home');
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (user) {
      // Optimistic update or wait? Let's just update backend and refresh
      try {
        await updateUserProfile(user.id, updates);
        await refreshProfile();
      } catch (err) {
        console.error("Failed to update user", err);
      }
    }
  };

  // --- Client Actions ---
  const handleCreateRequest = async (requestData: Partial<Request>) => {
    if (!user) return;

    // Import request service
    const { createRequest, getRequests } = await import('./services/requestService');

    // Create request in Supabase
    const newRequest = await createRequest({
      ...requestData,
      clientId: user.id,
      clientName: user.name || 'Unknown',
      status: RequestStatus.PENDING,
      date: requestData.date || new Date().toISOString().split('T')[0],
      category: requestData.category!,
      subcategory: requestData.subcategory || 'General',
      description: requestData.description || '',
      timeWindow: requestData.timeWindow || '',
      location: requestData.location || '',
      geozone: requestData.geozone || 'North Plains - Central',
    });

    if (newRequest) {
      console.log('✅ Request created successfully:', newRequest.id);
      // Reload all requests from Supabase to get the latest data
      const allRequests = await getRequests();
      setRequests(allRequests);
      console.log('📊 Loaded requests:', allRequests.length);

      // Small delay to ensure state updates before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.error('❌ Failed to create request');
    }

    handleNavigate('dashboard');
  };

  const handleCompleteSurvey = (reqId: string, data: any) => {
    setRequests(prev => prev.map(r =>
      r.id === reqId
        ? { ...r, clientSurveyCompleted: true, adminNotes: (r.adminNotes ? r.adminNotes + '\n' : '') + `Client Survey: ${data.rating}/5` }
        : r
    ));
  };

  // --- Volunteer Actions ---
  const handleAcceptRequest = (id: string) => {
    // Notify Client Logic
    const targetReq = requests.find(r => r.id === id);
    if (targetReq && user) {
      const clientUser = Object.values(MOCK_USERS).find(u => u.id === targetReq.clientId);
      if (clientUser) {
        const prefs = clientUser.notificationPreferences || { email: true, sms: false, calendar: false };
        const msg = `Good news! ${user.name} has signed up for your request '${targetReq.category}' on ${targetReq.date}.`;

        // Simulate notifications based on preferences
        if (prefs.email) {
          console.log(`[EMAIL SENT] To: ${clientUser.email}`);
          console.log(`Subject: Volunteer Match Confirmed`);
          console.log(`Body: ${msg}`);
          if (prefs.calendar) console.log(`[ATTACHMENT] Calendar Event (.ics) included.`);
        }
        if (prefs.sms) {
          console.log(`[SMS SENT] To: ${clientUser.phone || 'Unknown'}: ${msg}`);
        }

        // Add In-App Notification
        clientUser.notifications = [{
          id: `n_${Date.now()}`,
          type: 'INFO',
          message: msg,
          date: new Date().toISOString(),
          read: false,
          requestId: id
        }, ...(clientUser.notifications || [])];
      }
    }

    setRequests(requests.map(r => {
      if (r.id !== id) return r;

      // Group Event Logic
      if (r.isGroupEvent) {
        const currentEnrolled = r.enrolledVolunteers || [];
        // Prevent double enrollment
        if (user?.id && currentEnrolled.includes(user.id)) return r;

        const newEnrolled = user?.id ? [...currentEnrolled, user.id] : currentEnrolled;
        // Check if now full
        const isFull = newEnrolled.length >= (r.maxVolunteers || 1);

        return {
          ...r,
          enrolledVolunteers: newEnrolled,
          // If full, mark MATCHED (closed). If not, keep PENDING (open).
          status: isFull ? RequestStatus.MATCHED : r.status,
          // Note: volunteerId left undefined for groups to indicate "multi-user"
        };
      }

      // Standard Single Volunteer Logic
      return { ...r, status: RequestStatus.MATCHED, volunteerId: user?.id, volunteerName: user?.name };
    }));
    handleNavigate('dashboard');
  };

  const handleCompleteRequest = (reqId: string, data: any) => {
    const hoursLogged = parseFloat(data.hours) || 0;
    const isHighHours = hoursLogged > 5;

    setRequests(prev => prev.map(r =>
      r.id === reqId
        ? {
          ...r,
          status: RequestStatus.COMPLETED,
          volunteerSurveyCompleted: true,
          adminNotes: isHighHours
            ? (r.adminNotes || '') + `\n[AUTO-FLAG] High Hours: ${hoursLogged}. Verify accuracy.`
            : r.adminNotes,
          alertResolved: isHighHours ? false : r.alertResolved
        }
        : r
    ));
    if (user) {
      updateUserProfile(user.id, { totalHours: (user.totalHours || 0) + hoursLogged }).then(() => refreshProfile());
    }
  };

  const handleWithdraw = (reqId: string, reason: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;

      const baseUpdates = {
        adminNotes: (r.adminNotes ? r.adminNotes + '\n' : '') + `Withdrawn: ${reason}`
      };

      if (r.isGroupEvent) {
        const newEnrolled = (r.enrolledVolunteers || []).filter(vid => vid !== user?.id);
        return {
          ...r,
          ...baseUpdates,
          enrolledVolunteers: newEnrolled,
          status: RequestStatus.PENDING // Group events always PENDING until full
        };
      }

      return {
        ...r,
        ...baseUpdates,
        status: RequestStatus.PENDING,
        volunteerId: undefined,
        volunteerName: undefined
      };
    }));
  };

  const handleCancelRequest = (reqId: string, reason: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;

      // Notifications Logic
      if (r.status === RequestStatus.MATCHED || (r.isGroupEvent && (r.enrolledVolunteers?.length || 0) > 0)) {
        const volunteersToNotify = r.isGroupEvent ? (r.enrolledVolunteers || []) : [r.volunteerId!];

        volunteersToNotify.forEach(volId => {
          // Find the user in MOCK_USERS to update their state "in the cloud"
          const volUser = Object.values(MOCK_USERS).find(u => u.id === volId);
          if (volUser) {
            const newNotif: any = { // Using any to bypass strict type check for now or import Notification type
              id: `n${Date.now()}`,
              type: 'INFO',
              message: `Request '${r.category}' on ${r.date} was cancelled by the client. Reason: ${reason}`,
              date: new Date().toISOString(),
              read: false
            };
            volUser.notifications = [newNotif, ...(volUser.notifications || [])];
          }
        });

        // Simulating sending notification by console log
        console.log(`Notification sent to volunteers ${volunteersToNotify}: "Request ${r.category} on ${r.date} was cancelled. Reason: ${reason}"`);
      }

      return {
        ...r,
        status: RequestStatus.CANCELLED,
        cancellationReason: reason
      };
    }));
  };

  // --- Admin Actions ---
  const handleUpdateRequest = (reqId: string, updates: Partial<Request>) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;

      // Check for modification of MATCHED request (Logic also allows CLIENT updates to trigger this)
      if (r.status === RequestStatus.MATCHED && (updates.date || updates.timeWindow || updates.location)) {
        // Detect if changed
        const isChanged = (updates.date && updates.date !== r.date) ||
          (updates.timeWindow && updates.timeWindow !== r.timeWindow) ||
          (updates.location && updates.location !== r.location);

        if (isChanged) {
          const volId = r.volunteerId;
          if (volId) {
            const volUser = Object.values(MOCK_USERS).find(u => u.id === volId);
            if (volUser) {
              const newNotif: any = {
                id: `n${Date.now()}`,
                type: 'ACTION_REQUIRED',
                actionType: 'KEEP_DROP',
                requestId: r.id,
                message: `Modification Alert: The request '${r.category}' has been updated. New details: ${updates.date || r.date} @ ${updates.timeWindow || r.timeWindow}. Do you want to keep this assignment?`,
                date: new Date().toISOString(),
                read: false
              };
              volUser.notifications = [newNotif, ...(volUser.notifications || [])];
            }
          }
        }
      }

      return { ...r, ...updates };
    }));
  };

  // Render Logic based on Route & Role
  const renderContent = () => {
    if (currentPage === 'about') return <AboutPage openContact={false} />;
    if (currentPage === 'contact') return <AboutPage openContact={true} />;
    if (user && currentPage === 'profile') return <UserProfile user={user} onUpdate={handleUpdateUser} />;

    if (!user) {
      switch (currentPage) {
        case 'login': return <LoginScreen onNavigate={handleNavigate} />;
        case 'register': return <RegisterScreen onNavigate={handleNavigate} />;
        case 'donate': return <DonatePage />;
        case 'terms-of-service': return <TermsOfService onBack={() => handleNavigate('home')} />;
        case 'privacy-policy': return <PrivacyPolicy onBack={() => handleNavigate('home')} />;
        default: return <PublicHome onNavigate={handleNavigate} />;
      }
    }

    // Authenticated generic pages
    if (currentPage === 'terms-of-service') return <TermsOfService onBack={() => handleNavigate('dashboard')} />;
    if (currentPage === 'privacy-policy') return <PrivacyPolicy onBack={() => handleNavigate('dashboard')} />;

    if (user.role === UserRole.CLIENT) {
      switch (currentPage) {
        case 'create-request':
          return <CreateRequestFlow onSubmit={handleCreateRequest} onCancel={() => handleNavigate('dashboard')} />;
        case 'resources': return <CommunityResources />;
        case 'report-safety': return <SafetyReportingPage user={user!} onNavigate={handleNavigate} />;
        case 'client-resources': return <TrainingCenter user={user} onUpdateUser={handleUpdateUser} />;
        default: return (
          <ClientDashboard
            user={user}
            requests={requests.filter(r => r.clientId === user.id)}
            onCreateRequest={() => handleNavigate('create-request')}
            onUpdateRequest={handleUpdateRequest}
            onUpdateUser={handleUpdateUser}
            onNavigate={handleNavigate}
            onCompleteSurvey={handleCompleteSurvey}
            onCancelRequest={handleCancelRequest}
          />
        );
      }
    }

    if (user.role === UserRole.VOLUNTEER) {
      switch (currentPage) {
        case 'opportunities':
          if (user.backgroundCheckStatus === 'PENDING' || user.backgroundCheckStatus === 'NOT_STARTED' || !user.trainingComplete) {
            return (
              <VolunteerDashboard
                user={user}
                requests={requests}
                onAccept={handleAcceptRequest}
                onNavigate={handleNavigate}
                onUpdateUser={handleUpdateUser}
                onCompleteRequest={handleCompleteRequest}
                onWithdraw={handleWithdraw}
              />
            );
          }
          return <OpportunityBoard requests={requests} onAccept={handleAcceptRequest} />;
        case 'history':
          return <VolunteerHistory user={user} requests={requests} />;
        case 'volunteer-resources':
          return <VolunteerResources user={user} onUpdate={handleUpdateUser} />;
        case 'report-safety':
          return <SafetyReportingPage user={user} onNavigate={handleNavigate} />;
        case 'community-resources':
          return <CommunityResources />;
        case 'settings':
          return <VolunteerSettings />;
        default: return (
          <VolunteerDashboard
            user={user}
            requests={requests}
            onAccept={handleAcceptRequest}
            onNavigate={handleNavigate}
            onUpdateUser={handleUpdateUser}
            onCompleteRequest={handleCompleteRequest}
            onWithdraw={handleWithdraw}
          />
        );
      }
    }

    if (user.role === UserRole.CLIENT_VOLUNTEER) {
      switch (currentPage) {
        case 'create-request':
          return <CreateRequestFlow onSubmit={handleCreateRequest} onCancel={() => handleNavigate('dashboard')} />;
        case 'opportunities':
          if (user.backgroundCheckStatus === 'PENDING' || user.backgroundCheckStatus === 'NOT_STARTED' || !user.trainingComplete) {
            // Redirect to resources/dashboard logic if they shouldn't see opps
            // For Dual Role, we might want to let them see their Client stuff, 
            // so redirection to DualDashboard is appropriate.
            return (
              <DualDashboard
                user={user}
                requests={requests}
                actions={{
                  onCreateRequest: () => handleNavigate('create-request'),
                  onUpdateUser: handleUpdateUser,
                  onNavigate: handleNavigate,
                  onCompleteSurvey: handleCompleteSurvey,
                  onAccept: handleAcceptRequest,
                  onCompleteRequest: handleCompleteRequest,
                  onWithdraw: handleWithdraw,
                  onUpdateRequest: handleUpdateRequest,
                  onCancelRequest: handleCancelRequest
                }}
              />
            );
          }
          return <OpportunityBoard requests={requests} onAccept={handleAcceptRequest} />;
        case 'history':
          return <DualHistory user={user} requests={requests} />;
        case 'volunteer-resources':
          return <VolunteerResources user={user} onUpdate={handleUpdateUser} />;
        case 'client-resources':
          return <TrainingCenter user={user} onUpdateUser={handleUpdateUser} />;
        case 'report-safety':
          return <SafetyReportingPage user={user} onNavigate={handleNavigate} />;
        case 'community-resources':
          return <CommunityResources />;
        case 'resources':
          return <CommunityResources />;
        default: return (
          <DualDashboard
            user={user}
            requests={requests}
            actions={{
              onCreateRequest: () => handleNavigate('create-request'),
              onUpdateUser: handleUpdateUser,
              onNavigate: handleNavigate,
              onCompleteSurvey: handleCompleteSurvey,
              onAccept: handleAcceptRequest,
              onCompleteRequest: handleCompleteRequest,
              onWithdraw: handleWithdraw,
              onUpdateRequest: handleUpdateRequest,
              onCancelRequest: handleCancelRequest
            }}
          />
        );
      }
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.COORDINATOR) {
      if (currentPage === 'opportunities') return <OpportunityBoard requests={requests} onAccept={handleAcceptRequest} user={user} />;
      if (currentPage === 'my-assignments') return <AdminAssignments user={user} requests={requests} onCompleteRequest={handleCompleteRequest} onWithdraw={handleWithdraw} />;
      return <AdminDashboard requests={requests} onUpdateRequest={handleUpdateRequest} />;
    }

    // Handle GUEST role (users who just registered but profile isn't fully set up)
    if (user.role === UserRole.GUEST) {
      // Show a loading or onboarding prompt
      return (
        <div className="max-w-2xl mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
          <p className="text-slate-600">Please wait while we prepare your dashboard.</p>
        </div>
      );
    }

    return <div>Unknown State</div>;
  };

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
