/**
 * Delays execution for a specified duration in milliseconds.
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Returns a random delay in milliseconds between minSec and maxSec (inclusive).
 */
export function getRandomDelay(minSec, maxSec) {
    const min = Math.min(minSec, maxSec);
    const max = Math.max(minSec, maxSec);
    const randomSeconds = Math.random() * (max - min) + min;
    return Math.round(randomSeconds * 1000);
}
/**
 * Calculates a jittered cycle interval.
 * Adds random variance (default ± 10%) so cycles never fire at the exact predictable second.
 */
export function getJitteredInterval(baseMinutes, variancePercent = 10) {
    const baseMs = baseMinutes * 60 * 1000;
    const maxVarianceMs = baseMs * (variancePercent / 100);
    const randomVariance = (Math.random() * 2 - 1) * maxVarianceMs;
    return Math.max(10000, Math.round(baseMs + randomVariance));
}
