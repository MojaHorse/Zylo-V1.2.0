import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { styles } from './OnboardingScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  BarChart3,
  Sparkles,
  Receipt,
  Package,
  Wallet,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const visualScale = Math.min(screenWidth / 400, 1);

type SlideItem = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  soft: string;
  Icon: any;
  Visual: ({ accent, soft, active }: { accent: string; soft: string; active: boolean }) => React.ReactElement;
};

function FloatingCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.visualCard, style]}>{children}</View>;
}

function WelcomeVisual({ accent, soft, active }: { accent: string; soft: string; active: boolean }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!active) return;

    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(floatA, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatA, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(floatB, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatB, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const c = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [active]);

  const y1 = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const y2 = floatB.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={styles.visualStage}>
      <Animated.View style={[styles.orb, { backgroundColor: soft, transform: [{ scale: pulse }] }]} />

      <Animated.View style={{ transform: [{ translateY: y1 }], position: 'absolute', top: 24, left: 10 * visualScale }}>
        <FloatingCard style={{ width: 112 * visualScale }}>
          <View style={styles.rowBetween}>
            <Sparkles color={accent} size={18 * visualScale} strokeWidth={2.2} />
            <Text style={[styles.visualSmall, { fontSize: 11 * visualScale }]}>Fast</Text>
          </View>
          <Text style={[styles.visualValue, { fontSize: 16 * visualScale }]}>Launch</Text>
        </FloatingCard>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY: y2 }], position: 'absolute', top: 72, right: 6 * visualScale }}>
        <FloatingCard style={{ width: 126 * visualScale }}>
          <View style={styles.rowBetween}>
            <Wallet color={accent} size={18 * visualScale} strokeWidth={2.2} />
            <Text style={[styles.visualSmall, { fontSize: 11 * visualScale }]}>Daily</Text>
          </View>
          <Text style={[styles.visualValue, { fontSize: 16 * visualScale }]}>Sales Up</Text>
        </FloatingCard>
      </Animated.View>

      <View style={[styles.centerDevice, { borderColor: accent + '22' }]}>
        <View style={[styles.deviceTop, { backgroundColor: soft }]}>
          <ShoppingBag color={accent} size={24} strokeWidth={2.2} />
          <View style={styles.deviceDots}>
            <View style={[styles.deviceDot, { backgroundColor: accent }]} />
            <View style={styles.deviceDot} />
            <View style={styles.deviceDot} />
          </View>
        </View>
        <View style={styles.deviceContent}>
          <View style={styles.deviceGridRow}>
            <View style={[styles.tileLarge, { backgroundColor: soft }]} />
            <View style={[styles.tileLarge, { backgroundColor: '#F8FAFC' }]} />
          </View>
          <View style={styles.deviceGridRow}>
            <View style={[styles.tileSmall, { backgroundColor: '#F8FAFC' }]} />
            <View style={[styles.tileSmall, { backgroundColor: soft }]} />
            <View style={[styles.tileSmall, { backgroundColor: '#F8FAFC' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CheckoutVisual({ accent, soft, active }: { accent: string; soft: string; active: boolean }) {
  const move = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!active) return;
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(move, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(move, { toValue: 0, duration: 10, useNativeDriver: true }),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pop, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }),
        Animated.timing(pop, { toValue: 0.7, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    seq.start();
    pulse.start();
    return () => {
      seq.stop();
      pulse.stop();
    };
  }, [active]);

  const range = (Math.min(screenWidth * 0.75, 280) - 86) / 2 - 10;
  const cardX = move.interpolate({ inputRange: [0, 1], outputRange: [-range, range] });
  const fade = move.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.visualStage}>
      <View style={[styles.checkoutShell, { borderColor: accent + '22' }]}>
        <View style={styles.checkoutTop}>
          <Text style={styles.checkoutTitle}>Quick Sale</Text>
          <Receipt color={accent} size={18} strokeWidth={2.2} />
        </View>

        <View style={styles.checkoutRow}>
          <View style={[styles.checkoutLine, { backgroundColor: soft }]} />
          <Text style={styles.checkoutPrice}>R45</Text>
        </View>
        <View style={styles.checkoutRow}>
          <View style={[styles.checkoutLine, { backgroundColor: '#F1F5F9', width: '54%' }]} />
          <Text style={styles.checkoutPrice}>R28</Text>
        </View>
        <View style={styles.checkoutRow}>
          <View style={[styles.checkoutLine, { backgroundColor: '#F1F5F9', width: '62%' }]} />
          <Text style={styles.checkoutPrice}>R13</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { backgroundColor: accent, opacity: fade, transform: [{ translateX: cardX }] }]} />
        </View>

        <View style={[styles.payButtonMock, { backgroundColor: accent }]}>
          <Text style={styles.payButtonText}>Tap to pay</Text>
        </View>
      </View>

      <Animated.View style={[styles.successBadge, { backgroundColor: soft, transform: [{ scale: pop }] }]}>
        <Check color={accent} size={22} strokeWidth={2.8} />
      </Animated.View>
    </View>
  );
}

function InsightsVisual({ accent, soft, active }: { accent: string; soft: string; active: boolean }) {
  const bars = [useRef(new Animated.Value(0.25)).current, useRef(new Animated.Value(0.45)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.7)).current];

  useEffect(() => {
    if (!active) return;
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: [0.65, 0.9, 0.58, 1][i],
            duration: 1100 + i * 120,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: [0.35, 0.55, 0.4, 0.75][i],
            duration: 1100 + i * 120,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
        ])
      )
    );

    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={styles.visualStage}>
      <View style={[styles.analyticsPanel, { borderColor: accent + '22' }]}>
        <View style={styles.analyticsHeader}>
          <View>
            <Text style={styles.analyticsEyebrow}>Today</Text>
            <Text style={styles.analyticsHeadline}>Sales Overview</Text>
          </View>
          <BarChart3 color={accent} size={22} strokeWidth={2.2} />
        </View>

        <View style={styles.chartArea}>
          {bars.map((bar, i) => (
            <Animated.View
              key={i}
              style={[
                styles.chartBar,
                {
                  backgroundColor: i === 3 ? accent : i % 2 === 0 ? soft : '#E2E8F0',
                  height: bar.interpolate({ inputRange: [0, 1], outputRange: [30, 118] }),
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.statsRow}>
          <FloatingCard style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>R12.4k</Text>
          </FloatingCard>
          <FloatingCard style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Text style={styles.statLabel}>Stock</Text>
            <Text style={styles.statValue}>Stable</Text>
          </FloatingCard>
        </View>
      </View>
    </View>
  );
}

function ReadyVisual({ accent, soft, active }: { accent: string; soft: string; active: boolean }) {
  const ring = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!active) return;
    const a = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(check, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }),
        Animated.timing(check, { toValue: 0.86, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [active]);

  const rotate = ring.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.visualStage}>
      <View style={[styles.readyCore, { backgroundColor: soft }]}>
        <Animated.View style={[styles.readyRing, { borderColor: accent + '35', transform: [{ rotate }] }]} />
        <Animated.View style={[styles.readyCheck, { backgroundColor: '#fff', transform: [{ scale: check }] }]}>
          <ShieldCheck color={accent} size={34} strokeWidth={2.2} />
        </Animated.View>
      </View>

      <View style={styles.readyCardsWrap}>
        <FloatingCard style={{ width: 132 * visualScale }}>
          <View style={styles.rowBetween}>
            <Package color={accent} size={17 * visualScale} strokeWidth={2.2} />
            <Text style={[styles.visualSmall, { fontSize: 11 * visualScale }]}>Inventory</Text>
          </View>
          <Text style={[styles.visualValue, { fontSize: 16 * visualScale }]}>Synced</Text>
        </FloatingCard>

        <FloatingCard style={{ width: 132 * visualScale }}>
          <View style={styles.rowBetween}>
            <ShieldCheck color={accent} size={17 * visualScale} strokeWidth={2.2} />
            <Text style={[styles.visualSmall, { fontSize: 11 * visualScale }]}>Security</Text>
          </View>
          <Text style={[styles.visualValue, { fontSize: 16 * visualScale }]}>Ready</Text>
        </FloatingCard>
      </View>
    </View>
  );
}

const SLIDES: SlideItem[] = [
  {
    id: '1',
    eyebrow: 'Welcome to Zylo',
    title: 'Run your business\nwith more flow.',
    subtitle: 'A cleaner, faster point-of-sale experience made to help your staff move confidently through every sale.',
    accent: '#2563EB',
    soft: '#DBEAFE',
    Icon: Sparkles,
    Visual: WelcomeVisual,
  },
  {
    id: '2',
    eyebrow: 'Fast Checkout',
    title: 'Move from tap\nto payment fast.',
    subtitle: 'Reduce friction at the counter with clearer actions, fewer taps, and a checkout flow that feels effortless.',
    accent: '#0EA5E9',
    soft: '#E0F2FE',
    Icon: ShoppingBag,
    Visual: CheckoutVisual,
  },
  {
    id: '3',
    eyebrow: 'Live Insights',
    title: 'See sales and stock\nat a glance.',
    subtitle: 'Track performance, monitor inventory, and make smarter decisions from a single calm dashboard.',
    accent: '#7C3AED',
    soft: '#EDE9FE',
    Icon: BarChart3,
    Visual: InsightsVisual,
  },
  {
    id: '4',
    eyebrow: 'Ready to Start',
    title: 'Secure, synced,\nand ready for work.',
    subtitle: 'Log in, load your business, and get selling with a setup designed to feel dependable from the first moment.',
    accent: '#14B8A6',
    soft: '#CCFBF1',
    Icon: ShieldCheck,
    Visual: ReadyVisual,
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const current = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onComplete?.();
    navigation.replace('Auth');
  };

  const goToIndex = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(next);
  };

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
      return;
    }
    goToIndex(currentIndex + 1);
  };

  const handleBack = () => goToIndex(currentIndex - 1);

  const handleSkip = () => {
    Haptics.selectionAsync();
    finishOnboarding();
  };

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, friction: 6, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const progressWidth = useMemo(() => `${((currentIndex + 1) / SLIDES.length) * 100}%` as `${number}%`, [currentIndex]);
  const Visual = current.Visual;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGlowTop} />
        <View style={[styles.backgroundGlowBottom, { backgroundColor: current.soft }]} />

        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>ZYLO</Text>
            <Text style={styles.brandSub}>Point of Sale</Text>
          </View>

          <Pressable onPress={handleSkip} hitSlop={16} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/*<View style={styles.progressWrap}>
          <View style={styles.progressTrackTop}>
            <View style={[styles.progressFillTop, { width: progressWidth, backgroundColor: current.accent }]} />
          </View>
          <Text style={styles.progressLabel}>{currentIndex + 1} of {SLIDES.length}</Text>
        </View>*/}

        <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroWrap}>
              <Visual accent={current.accent} soft={current.soft} active />
            </View>

            <View style={styles.textWrap}>
              <View style={[styles.eyebrowPill, { backgroundColor: current.soft }]}>
                <Text style={[styles.eyebrowText, { color: current.accent }]}>{current.eyebrow}</Text>
              </View>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.subtitle}>{current.subtitle}</Text>
            </View>
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, i) => {
              const active = i === currentIndex;
              return (
                <Pressable
                  key={slide.id}
                  onPress={() => goToIndex(i)}
                  style={[
                    styles.dot,
                    active && { width: 28, backgroundColor: current.accent },
                    !active && styles.dotInactive,
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleBack}
              disabled={currentIndex === 0}
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            >
              <ChevronLeft color={currentIndex === 0 ? '#CBD5E1' : '#0F172A'} size={20} strokeWidth={2.5} />
            </Pressable>

            <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
              <Pressable
                onPress={handleNext}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.ctaButton, { backgroundColor: current.accent }]}
              >
                <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next Slide'}</Text>
                {isLast ? (
                  <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
                ) : (
                  <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
                )}
              </Pressable>
            </Animated.View>

            {/*<Pressable onPress={handleNext} style={styles.navButton}>
              <ChevronRight color="#0F172A" size={20} strokeWidth={2.5} />
            </Pressable>
          </View>*/}
          </View>

          <Text style={styles.bottomCaption}>Built for faster retail flow</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
