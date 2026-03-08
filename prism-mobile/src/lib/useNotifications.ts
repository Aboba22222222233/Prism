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
        registerForPushNotificationsAsync().then(() => {
            scheduleAllReminders();
        });
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
            if (finalStatus !== 'granted') return;
        }
    }

    async function scheduleAllReminders() {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        if (scheduled.length > 0) return;

        // Утреннее настроение — 8:30
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Доброе утро! ☀️",
                body: "Как ты себя чувствуешь сегодня? Пройди утренний чек-ин за 10 секунд.",
                sound: true,
            },
            trigger: {
                type: 'daily',
                hour: 8,
                minute: 30,
                channelId: 'default',
            } as any,
        });

        // Вечернее напоминание — 19:00
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Клаудик скучает... ☁️",
                body: "Как прошёл твой день? Запиши свои мысли — это займёт всего 10 секунд!",
                sound: true,
            },
            trigger: {
                type: 'daily',
                hour: 19,
                minute: 0,
                channelId: 'default',
            } as any,
        });

        // Мотивация — среда 12:00
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Уже середина недели! 💪",
                body: "Ты молодец, что следишь за своим состоянием. Продолжай в том же духе!",
                sound: true,
            },
            trigger: {
                type: 'weekly',
                weekday: 4, // среда
                hour: 12,
                minute: 0,
                channelId: 'default',
            } as any,
        });

        // Дыхательное упражнение — пятница 15:00
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Время расслабиться 🧘",
                body: "Попробуй дыхательное упражнение в разделе Ресурсы — снимает стресс за 1 минуту.",
                sound: true,
            },
            trigger: {
                type: 'weekly',
                weekday: 6, // пятница
                hour: 15,
                minute: 0,
                channelId: 'default',
            } as any,
        });

        // Серия чек-инов — воскресенье 10:00
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Новая неделя — новый старт! 🚀",
                body: "Начни неделю с чек-ина и сохрани свою серию!",
                sound: true,
            },
            trigger: {
                type: 'weekly',
                weekday: 1, // воскресенье
                hour: 10,
                minute: 0,
                channelId: 'default',
            } as any,
        });
    }
};
