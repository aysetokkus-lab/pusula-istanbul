import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../hooks/use-tema';
import { HomeIcon, SirenIcon, ChatIcon, SearchIcon, UserIcon } from '../../components/tab-icons';
import { useOkunmamisMesaj } from '../../hooks/use-okunmamis-mesaj';

function TabIcon({ children, focused, badge }: { children: React.ReactNode; focused: boolean; badge?: boolean }) {
  return (
    <View style={[si.iconWrap, focused && si.iconWrapActive]}>
      {children}
      {badge && !focused && (
        <View style={si.badge} />
      )}
    </View>
  );
}

const si = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#0077B615',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#D62828',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default function TabLayout() {
  const { t } = useTema();
  const insets = useSafeAreaInsets();
  const { okunmamisVar } = useOkunmamisMesaj();

  const aktif = '#0077B6';
  const pasif = '#94A3B8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingLeft: Platform.OS === 'web' ? 0 : insets.left,
          paddingRight: Platform.OS === 'web' ? 0 : insets.right,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: aktif,
        tabBarInactiveTintColor: pasif,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <HomeIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="acil"
        options={{
          title: 'Acil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <SirenIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="sohbet"
        options={{
          title: 'Sohbet',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} badge={okunmamisVar}>
              <ChatIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="ara"
        options={{
          title: 'Ara',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <SearchIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <UserIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      {/* Grid ikonlarından erişilen ekranlar — tab bar'da gizli */}
      <Tabs.Screen name="muzeler" options={{ href: null }} />
      <Tabs.Screen name="bogaz" options={{ href: null }} />
      <Tabs.Screen name="ulasim" options={{ href: null }} />
      <Tabs.Screen name="muzeKart" options={{ href: null }} />
    </Tabs>
  );
}
