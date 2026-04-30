import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../hooks/use-tema';
import { HomeIcon, SirenIcon, ChatIcon, SearchIcon, UserIcon } from '../../components/tab-icons';
import { useOkunmamisMesaj } from '../../hooks/use-okunmamis-mesaj';

function TabIcon({ children, focused, badge, tabBg }: { children: React.ReactNode; focused: boolean; badge?: boolean; tabBg?: string }) {
  return (
    <View style={[si.iconWrap, focused && si.iconWrapActive]}>
      {children}
      {badge && !focused && (
        <View style={[si.badge, tabBg ? { borderColor: tabBg } : undefined]} />
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

  const aktif = t.tabActive;
  const pasif = t.tabInactive;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.tabBg,
          borderTopColor: t.tabBorder,
          borderTopWidth: 1,
          height: 65 + (Platform.OS !== 'web' ? insets.bottom : 0),
          paddingBottom: Platform.OS !== 'web' ? Math.max(insets.bottom, 10) : 10,
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
            <TabIcon focused={focused} badge={okunmamisVar} tabBg={t.tabBg}>
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
