// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.

export interface TimeSlot {
    time: string; // "HH:mm"
    available: boolean;
}

// Funzione per generare slot orari per una data specifica
export const generateTimeSlots = (
    date: Date,
    busySlots: { start: string, end: string }[],
    durationMinutes: number = 30
): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Inizia alle 9:00

    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0); // Finisce alle 18:00

    let currentSlotTime = new Date(dayStart);

    while (currentSlotTime < dayEnd) {
        const slotEndTime = new Date(currentSlotTime.getTime() + durationMinutes * 60000);

        let isAvailable = true;
        // Controlla se lo slot si sovrappone con un evento occupato
        for (const busy of busySlots) {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);

            // Logica di sovrapposizione: (StartA < EndB) and (EndA > StartB)
            if (currentSlotTime < busyEnd && slotEndTime > busyStart) {
                isAvailable = false;
                break;
            }
        }

        // Controlla se lo slot è nel passato
        if (currentSlotTime < new Date()) {
            isAvailable = false;
        }

        slots.push({
            time: currentSlotTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            available: isAvailable,
        });

        currentSlotTime = slotEndTime;
    }

    return slots;
};

// Helper per combinare data e ora
export const combineDateAndTime = (date: Date, time: string): Date => {
    // Defensive null check
    if (!time || typeof time !== 'string') {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }

    const timeParts = time.split(':');
    if (timeParts.length < 2) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }

    const [hours, minutes] = timeParts.map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
};