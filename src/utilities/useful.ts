/**
 * Gets a random float between range
 * @param min Is Inclusive
 * @param max Is Exclusive
 */
export function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

/**
 * Gets a random integer between range
 * @param min Is Inclusive
 * @param max Is Inclusive
 */
export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
