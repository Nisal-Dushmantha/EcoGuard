import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { AvailableRangerSelection } from '../screens/AvailableRangerSelection';
import { ConfirmAssignmentScreen } from '../screens/ConfirmAssignmentScreen';
import { DispatchSuccessScreen } from '../screens/DispatchSuccessScreen';
import { ConflictActivityScreen } from '../screens/ConflictActivityScreen';
import { OfficerProfileScreen } from '../screens/OfficerProfileScreen';
import { ActiveIncidentTrackingScreen } from '../screens/ActiveIncidentTrackingScreen';
import { CommunityMemberDashboard } from '../screens/CommunityMemberDashboard';
import { ReportWildlifeConflictScreen } from '../screens/ReportWildlifeConflictScreen';
import { ReportSubmittedSuccessScreen } from '../screens/ReportSubmittedSuccessScreen';
import { CommunityMemberReportsScreen } from '../screens/CommunityMemberReportsScreen';
import { authService } from '../services/authService';

export const RangerNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('Splash');
  const [screenParams, setScreenParams] = useState<any>({});
  const [screenHistory, setScreenHistory] = useState<string[]>(['Splash']);

  const getNormalizedRole = (): 'COMMUNITY_MEMBER' | 'COMMUNITY_LIAISON_OFFICER' | 'RANGER' => {
    const raw = (authService.userRole || '').trim().toUpperCase().replace(/\s+/g, '_');
    if (raw === 'COMMUNITY_MEMBER') return 'COMMUNITY_MEMBER';
    if (raw === 'COMMUNITY_LIAISON_OFFICER') return 'COMMUNITY_LIAISON_OFFICER';
    return 'RANGER';
  };

  const getRoleProfileScreen = () => {
    const role = getNormalizedRole();
    if (role === 'COMMUNITY_MEMBER') return 'CommunityMemberProfile';
    if (role === 'COMMUNITY_LIAISON_OFFICER') return 'LiaisonOfficerProfile';
    return 'RangerProfile';
  };

  // Navigation controller passed to screens
  const navigation = {
    navigate: (screen: string, params?: any) => {
      if (params) setScreenParams(params);

      if (screen === 'HomeTab') {
        const role = getNormalizedRole();
        const target =
          role === 'COMMUNITY_MEMBER'
            ? 'CommunityMemberDashboard'
            : role === 'COMMUNITY_LIAISON_OFFICER'
            ? 'ConflictOperationsHome'
            : 'RangerDashboard';
        setScreenHistory((prev) => [...prev, target]);
        setCurrentScreen(target);
      } else if (
        screen === 'ProfileTab' ||
        screen === 'Profile' ||
        screen === 'OfficerProfile' ||
        screen === 'CommunityMemberProfile' ||
        screen === 'LiaisonOfficerProfile' ||
        screen === 'RangerProfile'
      ) {
        const target = getRoleProfileScreen();
        setScreenHistory((prev) => [...prev, target]);
        setCurrentScreen(target);
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
        let targetScreen = screen;
        if (screen === 'RangerMainTabs' || screen === 'RangerHome') {
          const role = getNormalizedRole();
          targetScreen =
            role === 'COMMUNITY_MEMBER'
              ? 'CommunityMemberDashboard'
              : role === 'COMMUNITY_LIAISON_OFFICER'
              ? 'ConflictOperationsHome'
              : 'RangerDashboard';
        }
        setCurrentScreen(targetScreen);
        setScreenHistory([targetScreen]);
      } else if (
        screen === 'Profile' ||
        screen === 'OfficerProfile' ||
        screen === 'CommunityMemberProfile' ||
        screen === 'LiaisonOfficerProfile' ||
        screen === 'RangerProfile'
      ) {
        const target = getRoleProfileScreen();
        setCurrentScreen(target);
        setScreenHistory([target]);
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
        const role = getNormalizedRole();
        const fallback =
          role === 'COMMUNITY_MEMBER'
            ? 'CommunityMemberDashboard'
            : role === 'COMMUNITY_LIAISON_OFFICER'
            ? 'ConflictOperationsHome'
            : 'RangerDashboard';
        setCurrentScreen(fallback);
        setScreenHistory([fallback]);
      }
    },
    addListener: (_event: string, callback: () => void) => {
      callback();
      return () => {};
    },
  };

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
      case 'CommunityMemberProfile':
        return <OfficerProfileScreen navigation={navigation} mode="community-member" />;
      case 'LiaisonOfficerProfile':
        return <OfficerProfileScreen navigation={navigation} mode="liaison-officer" />;
      case 'RangerProfile':
      case 'OfficerProfile':
        return <OfficerProfileScreen navigation={navigation} mode="ranger" />;
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

  const userRole = getNormalizedRole();

  const isCommunityMemberTabScreen =
    userRole === 'COMMUNITY_MEMBER' &&
    ['CommunityMemberDashboard', 'CommunityMemberReports', 'CommunityMemberProfile'].includes(
      currentScreen
    );

  const isLiaisonOfficerTabScreen =
    userRole === 'COMMUNITY_LIAISON_OFFICER' &&
    ['ConflictOperationsHome', 'PendingReports', 'ConflictActivity', 'LiaisonOfficerProfile'].includes(
      currentScreen
    );

  const isRangerTabScreen =
    userRole === 'RANGER' &&
    [
      'RangerDashboard',
      'RangerHome',
      'RangerMainTabs',
      'MyIncidents',
      'Alerts',
      'RangerProfile',
      'OfficerProfile',
    ].includes(currentScreen);

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>{renderScreen()}</View>

      {/* COMMUNITY MEMBER ROLE BOTTOM TAB BAR */}
      {isCommunityMemberTabScreen && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('CommunityMemberDashboard')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'CommunityMemberDashboard' && styles.tabIconActive,
              ]}
            >
              🏠
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'CommunityMemberDashboard' && styles.tabLabelActive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('CommunityMemberReports')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'CommunityMemberReports' && styles.tabIconActive,
              ]}
            >
              📋
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'CommunityMemberReports' && styles.tabLabelActive,
              ]}
            >
              My Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.centerFab}
            onPress={() => navigation.navigate('ReportWildlifeConflict')}
            activeOpacity={0.88}
          >
            <Text style={styles.centerFabIcon}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('CommunityMemberProfile')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'CommunityMemberProfile' && styles.tabIconActive,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'CommunityMemberProfile' && styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* COMMUNITY LIAISON OFFICER ROLE BOTTOM TAB BAR */}
      {isLiaisonOfficerTabScreen && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('ConflictOperationsHome')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'ConflictOperationsHome' && styles.tabIconActive,
              ]}
            >
              🛡️
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'ConflictOperationsHome' && styles.tabLabelActive,
              ]}
            >
              Operations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('PendingReports')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'PendingReports' && styles.tabIconActive,
              ]}
            >
              📋
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'PendingReports' && styles.tabLabelActive,
              ]}
            >
              Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('ConflictActivity')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'ConflictActivity' && styles.tabIconActive,
              ]}
            >
              🕒
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'ConflictActivity' && styles.tabLabelActive,
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('LiaisonOfficerProfile')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'LiaisonOfficerProfile' && styles.tabIconActive,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'LiaisonOfficerProfile' && styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RANGER ROLE BOTTOM TAB BAR */}
      {isRangerTabScreen && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('RangerDashboard')}
          >
            <Text
              style={[
                styles.tabIcon,
                ['RangerDashboard', 'RangerHome', 'RangerMainTabs'].includes(currentScreen) &&
                  styles.tabIconActive,
              ]}
            >
              🏠
            </Text>
            <Text
              style={[
                styles.tabLabel,
                ['RangerDashboard', 'RangerHome', 'RangerMainTabs'].includes(currentScreen) &&
                  styles.tabLabelActive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.centerFab}
            onPress={() => navigation.navigate('LogIncident')}
            activeOpacity={0.85}
          >
            <Text style={styles.centerFabIcon}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('MyIncidents')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'MyIncidents' && styles.tabIconActive,
              ]}
            >
              📋
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'MyIncidents' && styles.tabLabelActive,
              ]}
            >
              Incidents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text
              style={[
                styles.tabIcon,
                currentScreen === 'Alerts' && styles.tabIconActive,
              ]}
            >
              🔔
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentScreen === 'Alerts' && styles.tabLabelActive,
              ]}
            >
              Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('RangerProfile')}
          >
            <Text
              style={[
                styles.tabIcon,
                ['RangerProfile', 'OfficerProfile'].includes(currentScreen) &&
                  styles.tabIconActive,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                ['RangerProfile', 'OfficerProfile'].includes(currentScreen) &&
                  styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

