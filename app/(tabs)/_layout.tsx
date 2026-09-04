// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Tab bar: aktif ikon t.tabActive + arkasında Palette.kobaltTint daire, etiket 10px Poppins semibold,
// okunmamış mesaj rozeti Palette.kapali (genel sohbet VEYA okunmamış özel mesaj). useOkunmamisMesaj ve tüm Tabs.Screen tanımları birebir korundu.
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../hooks/use-tema';
import { HomeIcon, SirenIcon, ChatIcon, BriefcaseIcon, UserIcon } from '../../components/tab-icons';
import { useOkunmamisMesaj } from '../../hooks/use-okunmamis-mesaj';
import { useDmOkunmamis } from '../../hooks/use-dm';
import { Font, Palette } from '../../constants/theme';

function TabIcon({ children, focused, badge, tabBg }: { children: React.ReactNode; focused: boolean; badge?: boolean; tabBg: string }) {
  return (
    <View style={[si.iconWrap, focused && si.iconWrapActive]}>
      {children}
      {badge && !focused && (
        <View style={[si.badge, { borderColor: tabBg }]} />
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
    backgroundColor: Palette.kobaltTint,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.kapali,
    borderWidth: 1.5,
  },
});

export default function TabLayout() {
  const { t } = useTema();
  const insets = useSafeAreaInsets();
  const { okunmamisVar } = useOkunmamisMesaj();
  const { sayi: dmOkunmamis } = useDmOkunmamis();  // Eyl 2026: özel mesaj rozeti

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
          fontFamily: Font.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabBg={t.tabBg}>
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
            <TabIcon focused={focused} tabBg={t.tabBg}>
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
            <TabIcon focused={focused} badge={okunmamisVar || dmOkunmamis > 0} tabBg={t.tabBg}>
              <ChatIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      {/* Eyl 2026: "İlanlar" sekmesi — "ara" ekranı silinmedi, ana sayfa header'ındaki büyüteçten açılır */}
      <Tabs.Screen
        name="ilanlar"
        options={{
          title: 'Rehber Aranıyor',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabBg={t.tabBg}>
              <BriefcaseIcon size={22} color={focused ? aktif : pasif} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabBg={t.tabBg}>
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
      {/* Ara ekranı korunur; alt bardan gizli, ana sayfadaki büyüteç butonuyla açılır */}
      <Tabs.Screen name="ara" options={{ href: null }} />
    </Tabs>
  );
}
