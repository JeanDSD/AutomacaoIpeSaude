import * as Haptics from 'expo-haptics';

import { useAppStore } from '../store/useAppStore';

type Kind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/** Feedback tátil respeitando a preferência do usuário. */
export function haptic(kind: Kind = 'light'): void {
  if (!useAppStore.getState().settings.hapticsEnabled) return;
  const run = async () => {
    switch (kind) {
      case 'success':
      case 'warning':
      case 'error':
        await Haptics.notificationAsync(
          kind === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : kind === 'warning'
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Error,
        );
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(
          kind === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : kind === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light,
        );
    }
  };
  run().catch(() => undefined);
}
