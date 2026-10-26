// Shared Store for Customer Feedback & Reviews

const STORAGE_KEY = 'autocare_system_feedback';

const defaultFeedback = [
  {
    id: 1,
    clientUsername: 'lucky_garay',
    clientName: 'Lucky Garay',
    name: 'Lucky Garay',
    vehicle: 'Van (GRY-633)',
    rating: 5,
    comment: 'Exceptional body paint and refinishing! My van looks brand new again. Highly professional service and staff!',
    date: '2026-09-16 10:30:00',
    status: 'Approved',
    serviceCategory: 'Body Paint & Refinishing',
  },
  {
    id: 2,
    clientUsername: 'CLT-4',
    clientName: 'Claire Deliman',
    name: 'Claire Deliman',
    vehicle: 'Ford Ranger (GRY-768)',
    rating: 5,
    comment: 'Great work on the engine overhauling. The knocking noise is completely gone and the engine runs smooth now!',
    date: '2026-09-10 14:15:00',
    status: 'Approved',
    serviceCategory: 'Engine Overhauling',
  },
  {
    id: 3,
    clientUsername: 'clt_mikegerald303',
    clientName: 'Mike Gerald Bacasmas',
    name: 'Mike Gerald Bacasmas',
    vehicle: 'Toyota Vios (BCS-303)',
    rating: 5,
    comment: 'Super fast brake pads replacement and hydraulic fluid flush. Highly recommended shop in Bohol!',
    date: '2026-09-08 09:45:00',
    status: 'Approved',
    serviceCategory: 'Brake & Suspension Overhaul',
  },
  {
    id: 4,
    clientUsername: 'david_l',
    clientName: 'David L.',
    name: 'David L.',
    vehicle: '2023 BMW M3',
    rating: 5,
    comment: 'Professional team who genuinely care about performance cars. My go-to shop from now on.',
    date: '2026-08-28 16:20:00',
    status: 'Approved',
    serviceCategory: 'General Maintenance',
  },
];

export const getFeedback = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFeedback));
      return defaultFeedback;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultFeedback;
  } catch (e) {
    console.error('Error reading feedback store:', e);
    return defaultFeedback;
  }
};

export const saveFeedbackList = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('autocare_feedback_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving feedback store:', e);
  }
};

export const addFeedback = (newItem) => {
  const current = getFeedback();
  const feedbackItem = {
    id: Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'Approved',
    ...newItem,
  };
  const updated = [feedbackItem, ...current];
  saveFeedbackList(updated);
  return feedbackItem;
};

export const deleteFeedback = (id) => {
  const current = getFeedback();
  const updated = current.filter((item) => item.id !== id);
  saveFeedbackList(updated);
  return updated;
};
