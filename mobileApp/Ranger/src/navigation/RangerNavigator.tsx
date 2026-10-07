import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { RangerDashboardScreen } from '../screens/RangerDashboardScreen';
import { LogIncidentScreen } from '../screens/LogIncidentScreen';
import { IncidentSuccessScreen } from '../screens/IncidentSuccessScreen';
import { MyIncidentsScreen } from '../screens/MyIncidentsScreen';
import { IncidentDetailsScreen } from '../screens/IncidentDetailsScreen';
import { SyncStatusScreen } from '../screens/SyncStatusScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ConflictOperationsHome } from '../screens/ConflictOperationsHome';
import { PendingReportsScreen } from '../screens/PendingReportsScreen';
import { ConflictReportDetailsScreen } from '../screens/ConflictReportDetailsScreen';
import { VerifyConfirmScreen } from '../screens/VerifyConfirmScreen';
import { AvailableRangerSelection } from '../screens/AvailableRangerSelection'; // force reparse
import { ConfirmAssignmentScreen } from '../screens/ConfirmAssignmentScreen';
import { DispatchSuccessScreen } from '../screens/DispatchSuccessScreen';
import { ConflictActivityScreen } from '../screens/ConflictActivityScreen';
import { OfficerProfileScreen } from '../screens/OfficerProfileScreen';
import { ActiveIncidentTrackingScreen } from '../screens/ActiveIncidentTrackingScreen';
import { CommunityMemberDashboard } from '../screens/CommunityMemberDashboard';
import { ReportWildlifeConflictScreen } from '../screens/ReportWildlifeConflictScreen';
import { ReportSubmittedSuccessScreen } from '../screens/ReportSubmittedSuccessScreen';
import { CommunityMemberReportsScreen } from '../screens/CommunityMemberReportsScreen';
import { LocalIncidentRecord } from '../types/incident';
import { authService } from '../services/authService';

// Navigation state container supporting standalone and React Navigation environments
export const RangerNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('Splash'); // Default to splash
  const [activeTab, setActiveTab] = useState<'Home' | 'Incidents' | 'Alerts' | 'Profile'>('Home');
  const [screenParams, setScreenParams] = useState<any>({});
  const [screenHistory, setScreenHistory] = useState<string[]>(['Splash']);

  // Navigation controller passed to screens
  const navigation = {
    navigate: (screen: string, params?: any) => {
      if (params) setScreenParams(params);
      if (screen === 'HomeTab') {
        setActiveTab('Home');
        const r = authService.userRole?.trim().toUpperCase().replace(/\s+/g, '_');
        if (r === 'COMMUNITY_MEMBER') setCurrentScreen('CommunityMemberDashboard');
        else if (r === 'COMMUNITY_LIAISON_OFFICER') setCurrentScreen('ConflictOperationsHome');
        else setCurrentScreen('RangerDashboard');
      } else if (screen === 'IncidentsTab') {
        setActiveTab('Incidents');
        setCurrentScreen('MyIncidents');
      } else if (screen === 'AlertsTab') {
        setActiveTab('Alerts');
        setCurrentScreen('Alerts');
      } else if (screen === 'ProfileTab' || screen === 'OfficerProfile') {
        setActiveTab('Profile');
        setScreenHistory((prev) => [...prev, 'OfficerProfile']);
        setCurrentScreen('OfficerProfile');
      } else {
        setScreenHistory((prev) => [...prev, screen]);
        setCurrentScreen(screen);
      }
    },
    replace: (screen: string, params?: any) => {
      if (params) setScreenParams(params);
      if (
        screen === 'RangerMainTabs' ||
        screen === 'RangerHome' ||
        screen === 'RangerDashboard' ||
        screen === 'ConflictOperationsHome' ||
        screen === 'CommunityMemberDashboard'
      ) {
        setActiveTab('Home');
        const targetScreen =
          screen === 'RangerMainTabs' || screen === 'RangerHome'
            ? 'RangerDashboard'
            : screen;
        setCurrentScreen(targetScreen);
        setScreenHistory([targetScreen]);
      } else {
        setCurrentScreen(screen);
      }
    },
    goBack: () => {
      if (screenHistory.length > 1) {
        const newHistory = [...screenHistory];
        newHistory.pop();
        const prev = newHistory[newHistory.length - 1];
        setScreenHistory(newHistory);
        setCurrentScreen(prev);
      } else {
        const r = authService.userRole?.trim().toUpperCase().replace(/\s+/g, '_');
        if (r === 'COMMUNITY_MEMBER') {
          setCurrentScreen('CommunityMemberDashboard');
        } else if (r === 'COMMUNITY_LIAISON_OFFICER') {
          setCurrentScreen('ConflictOperationsHome');
        } else {
          setCurrentScreen('RangerDashboard');
        }
        setActiveTab('Home');
      }
    },
    addListener: (_event: string, callback: () => void) => {
      callback();
      return () => {};
    },
  };

  // Determine whether bottom tabs should be visible on the current screen
  const isTabScreen = [
    'RangerDashboard',
    'RangerHome',
    'RangerMainTabs',
    'MyIncidents',
    'Alerts',
    'OfficerProfile',
  ].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen navigation={navigation} />;
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} />;
      case 'CommunityMemberDashboard':
        return <CommunityMemberDashboard navigation={navigation} />;
      case 'ReportWildlifeConflict':
        return <ReportWildlifeConflictScreen navigation={navigation} />;
      case 'ReportSubmittedSuccess':
        return (
          <ReportSubmittedSuccessScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'CommunityMemberReports':
        return (
          <CommunityMemberReportsScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'LogIncident':
        return <LogIncidentScreen navigation={navigation} />;
      case 'IncidentSuccess':
        return (
          <IncidentSuccessScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'IncidentDetails':
        return (
          <IncidentDetailsScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'ConflictOperationsHome':
        return <ConflictOperationsHome navigation={navigation} />;
      case 'PendingReports':
        return <PendingReportsScreen navigation={navigation} />;
      case 'ConflictReportDetails':
        return (
          <ConflictReportDetailsScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'VerifyConfirm':
        return (
          <VerifyConfirmScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'AvailableRangerSelection':
        return (
          <AvailableRangerSelection
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'ConfirmAssignment':
        return (
          <ConfirmAssignmentScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'DispatchSuccess':
        return (
          <DispatchSuccessScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'ActiveIncidentTracking':
        return (
          <ActiveIncidentTrackingScreen
            route={{ params: screenParams }}
            navigation={navigation}
          />
        );
      case 'ConflictActivity':
        return <ConflictActivityScreen navigation={navigation} />;
      case 'OfficerProfile':
        return <OfficerProfileScreen navigation={navigation} />;
      case 'SyncStatus':
        return <SyncStatusScreen navigation={navigation} />;
      case 'MyIncidents':
        return <MyIncidentsScreen navigation={navigation} />;
      case 'Alerts':
        return <AlertsScreen navigation={navigation} />;
      case 'RangerHome':
      case 'RangerDashboard':
      case 'RangerMainTabs':
        return <RangerDashboardScreen navigation={navigation} />;
      default:
        return <SplashScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>{renderScreen()}</View>

      {/* BOTTOM TAB NAVIGATION */}
      {isTabScreen ? (
        <View style={styles.bottomTabBar}>
          {/* Home Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Home');
              setCurrentScreen('RangerDashboard');
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Home tab"
            accessibilityState={{ selected: activeTab === 'Home' }}
          >
            <Text style={[styles.tabIcon, activeTab === 'Home' && styles.tabIconActive]}>🏠</Text>
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          {/* Quick Center Action: Log Incident */}
          <TouchableOpacity
            style={styles.centerFab}
            onPress={() => navigation.navigate('LogIncident')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Quick action: Log Incident"
            activeOpacity={0.85}
          >
            <Text style={styles.centerFabIcon}>＋</Text>
          </TouchableOpacity>

          {/* Incidents Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Incidents');
              setCurrentScreen('MyIncidents');
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="My Incidents tab"
            accessibilityState={{ selected: activeTab === 'Incidents' }}
          >
            <Text style={[styles.tabIcon, activeTab === 'Incidents' && styles.tabIconActive]}>📋</Text>
            <Text style={[styles.tabLabel, activeTab === 'Incidents' && styles.tabLabelActive]}>
              Incidents
            </Text>
          </TouchableOpacity>

          {/* Alerts Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Alerts');
              setCurrentScreen('Alerts');
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Alerts tab"
            accessibilityState={{ selected: activeTab === 'Alerts' }}
          >
            <Text style={[styles.tabIcon, activeTab === 'Alerts' && styles.tabIconActive]}>🔔</Text>
            <Text style={[styles.tabLabel, activeTab === 'Alerts' && styles.tabLabelActive]}>
              Alerts
            </Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Profile');
              setCurrentScreen('OfficerProfile');
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Profile tab"
            accessibilityState={{ selected: activeTab === 'Profile' }}
          >
            <Text style={[styles.tabIcon, activeTab === 'Profile' && styles.tabIconActive]}>👤</Text>
            <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 44,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  centerFab: {
    top: -14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: THEME.colors.surface,
  },
  centerFabIcon: {
    fontSize: 26,
    color: THEME.colors.textInverse,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default RangerNavigator;
