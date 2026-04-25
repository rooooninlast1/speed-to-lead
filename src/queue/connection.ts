import Bull from 'bull';

export const connectQueue = async () => {
  try {
    const queue = new Bull('speed-to-lead', process.env.REDIS_URL || 'redis://localhost:6379');
    console.log('✅ Queue connected');
    return queue;
  } catch (err) {
    console.warn('⚠️ Redis / Bull not available, continuing without queue:', (err as Error).message);
    return null;
  }
};
