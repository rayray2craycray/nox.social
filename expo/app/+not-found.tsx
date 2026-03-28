import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Home size={64} color="#ff0080" />
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>This screen doesn&apos;t exist in VibeLink</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Feed</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  link: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#ff0080',
    borderRadius: 24,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
});
