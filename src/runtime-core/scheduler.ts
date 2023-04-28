const quene: any[] = [];
let isFlushPending = false;
const p = Promise.resolve();

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queneJobs(fn) {
  if (!quene.includes(fn)) {
    quene.push(fn);
  }
  queneFlush();
}

function queneFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flubJobs);
}
function flubJobs() {
  isFlushPending = false;

  let job;
  while ((job = quene.shift())) {
    // job && job();
    if (job) {
      job();
    }
  }
}
