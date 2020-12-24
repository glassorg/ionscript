
export default function *range(start: number, end: number, inclusive = false, step?: number) {
    if (step == null) {
        step = Math.sign(end - start) || 1
    }
    if (inclusive) {
        for (let i = start; i <= end; i++) {
            yield i
        }
    }
    else {
        for (let i = start; i < end; i++) {
            yield i
        }
    }
}