//https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/50242896
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = item => (item && typeof item === 'object' && !Array.isArray(item))

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target
    let output = Object.assign({}, target)
    const source = sources.shift()

    if (isObject(output) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] })
                else
                    output[key] = mergeDeep(output[key], source[key])
            } else {
                Object.assign(output, { [key]: source[key] })
            }
        }
    }
    return mergeDeep(output, ...sources)
}