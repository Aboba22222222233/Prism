import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
    }),
});

export const useNotifications = () => {
    useEffect(() => {
        registerForPushNotificationsAsync();
        scheduleDailyReminder();
    }, []);

    async function registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                // console.log('Failed to get push token for push notification!');
                return;
            }
        } else {
            // console.log('Must use physical device for Push Notifications');
        }
    }

    async function scheduleDailyReminder() {
        // Prevent scheduling if already scheduled
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        if (scheduled.length > 0) return;

        // Schedule a daily reminder at 19:00 (7 PM)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Клаудик скучает... ☁️",
                body: "Как прошел твой день? Запиши свои мысли в дневник, это займет всего 10 секунд!",
                sound: true,
            },
            trigger: {
                type: 'daily',
                hour: 19,
                minute: 0,
                channelId: 'default',
            } as any,
        });
    }
};
