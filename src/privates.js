const privateMap = new WeakMap
export const privates = {
    set: (instance, privateObj) => privateMap.set(instance, Object.assign(privates.get(instance), privateObj)),
    get: instance => privateMap.get(instance) || {}
}