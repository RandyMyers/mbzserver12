const Bull = require('bull');
const { syncProductJob } = require('./syncProductWorker');

const redisConfig = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 5,
};

const syncProductQueue = new Bull('sync-products', { redis: redisConfig });
console.log(syncProductQueue );

syncProductQueue.process(syncProductJob);

syncProductQueue.on('waiting', (jobId) => {
  console.log(`Job waiting: ${jobId}`);
});

syncProductQueue.on('active', (job) => {
  console.log(`Job ${job.id} is active`);
  console.log(`Job details: ${JSON.stringify(job.data, null, 2)}`);
});

syncProductQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

syncProductQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed.`);
  console.error(`Error details: ${err.message}`);
  console.error(`Stack trace: ${err.stack}`);
  console.error(`Job data: ${JSON.stringify(job.data, null, 2)}`);
});

module.exports = { syncProductQueue };
