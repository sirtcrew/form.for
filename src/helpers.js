import { bind as hyperBind } from './libraries/hyperHTML.js'
import { JSONPath } from "./libraries/JSONPath.js"

export const bind = (instance, element, newElementType, newElementClasses) => {
    if (newElementType) element = element.appendChild(document.createElement(newElementType))
    if (Array.isArray(newElementClasses)) element.classList.add(...newElementClasses)
    hyperBind(element)`${instance}`
    return instance
}

export const getObserver = (instance, setTrap, getTrap) => {
    const handler = {}
    if (setTrap) handler.set = function (target, property, value, receiver, proxyPolyfillThis) {
        const initialValue = Reflect.get(target, property, receiver)
        return Reflect.set(target, property, value, receiver) &&
            (!setTrap || setTrap(property, value, proxyPolyfillThis || receiver, initialValue) !== false)
    }
    if (getTrap) handler.get = function (target, name, receiver) {
        return getTrap(target, name, receiver)
    }

    return new Proxy(instance, handler)
}

export const nativeDate = (() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'date')
    input.setAttribute('value', 1)
    return input.value !== 1
})()

const twoDigit = n => (n < 10 ? '0' : '') + n,
    intlDate = new Intl.DateTimeFormat([], { year: "numeric", month: "numeric", day: "numeric" }),
    intlTime = new Intl.DateTimeFormat([], { hour12: false, hour: '2-digit', minute: '2-digit' })
export const dateISOLocale = date => `${date.getFullYear()}-${twoDigit(date.getMonth() + 1)}-${twoDigit(date.getDate())}`
export const dateTimeISOLocale = date => `${dateISOLocale(date)}T${twoDigit(date.getHours())}:${twoDigit(date.getMinutes())}`
export const dateTimeLocale = date => isFinite(date) ? `${intlDate.format(date)} ${intlTime.format(date)}` : ""
export const dateDiffHours = (start, end, precision = 0) => ((end - start) / 1000 / 60 / 60).toFixed(precision)


export const getPropertyByString = (o, s) => JSONPath(s, o)[0]

export const throwError = message => {
    const error = new Error(`Incident(${getRandomNumber()}) - ${message}`)
    if (typeof window !== 'undefined' && typeof window.PromiseRejectionEvent === "undefined") {
        const errorEvent = new CustomEvent("unhandledrejection", { error, message: error.message })
        errorEvent.reason = error
        window.dispatchEvent(errorEvent)
    }
    throw error
}

export const getRandomNumber = () => {
    let id = Math.random().toString(36).substr(2, 6).toUpperCase().replace("O", "0")
    return `${id.slice(0, 3)}-${id.slice(3)}`
}

export const transition = async (element, property, value, duration, callback) => {
    const css = `transition: ${property} ${duration}ms ease 0s; ${property}: ${value};`
    await applyCssAndWait({ element, callback, duration, css })
}

const applyCssAndWait = async ({ element, callback, duration, css }) => {
    return new Promise(resolve => {
        const originalStyle = element.dataset.originalStyle = element.dataset.originalStyle || `${element.style.cssText};`
        const transitionCallback = async e => {
            //e && e.target.removeEventListener(event, callback)
            callback && await callback()
            resolve()
            element.style.cssText = originalStyle
        }
        element.style.cssText = `${element.style.cssText};${css}`
        //There are times that the eventListener will not be fired. It appears using setTimeout is more thorough
        //element.addEventListener(event, transitionCallback)
        window.setTimeout(transitionCallback, duration)
    })
}

export const typewriter = async ({ element, duration = 1500, callback } = {}) => {
    const css = `overflow: hidden; white-space: nowrap; -webkit-animation: typing ${duration}ms steps(40, end); animation: typing ${duration}ms steps(40, end);`
    await applyCssAndWait({ element, callback, duration, css })
}

export const shake = async ({ element, callback, duration = 820 }) => {
    const css = `animation: shake ${duration}ms cubic-bezier(0.36,.07,.19,.97) both; transform: translate3d(0, 0, 0); backface-visibility: hidden; perspective: 1000px;`
    await applyCssAndWait({ element, callback, duration, css })
}
const isScrollable = element => element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight
const elementBoundsInsideOtherBounds = (elementBounds, otherBounds, x, y) => {
    const inside = {
        bottom: elementBounds.bottom <= otherBounds.bottom,
        top: elementBounds.top >= otherBounds.top,
        left: elementBounds.left >= otherBounds.left,
        right: elementBounds.right <= otherBounds.right
    }
    return (!y || (inside.bottom && inside.top)) && (!x || (inside.left && inside.right))
}
const elementBoundsInsideWindow = (elementBounds, x, y) => {
    const inside = {
        bottom: elementBounds.bottom <= window.innerHeight,
        top: elementBounds.top >= 0,
        left: elementBounds.left >= 0,
        right: elementBounds.right <= window.innerWidth
    }
    return (!y || (inside.bottom && inside.top)) && (!x || (inside.left && inside.right))
}

export const smoothScrollIntoView = (element, x = false, y = true) => {
    const elementBounds = element.getBoundingClientRect()
    let scrollToElement, currentBounds, currentElement = element, parent = element.parentNode
    while (parent instanceof HTMLElement || parent === document) {
        if (parent === document) {
            if (scrollToElement && !elementBoundsInsideWindow(elementBounds, x, y)) {
                scrollToElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
                return true
            } else {
                return false
            }
        }
        const parentBounds = parent.getBoundingClientRect()
        if (!scrollToElement && elementBoundsInsideOtherBounds(elementBounds, currentBounds || parentBounds, x, y)) scrollToElement = currentElement
        if (!elementBoundsInsideOtherBounds(elementBounds, parentBounds, x, y) && isScrollable(parent)) {
            scrollToElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
            return true
        }
        currentBounds = parentBounds
        currentElement = parent
        parent = currentElement.parentNode
    }
    return false
}
export const fade = async (element, duration_ms, callback) => await transition(element, "opacity", 0, duration_ms, callback)

export const documentPositionComparator = (a, b) => {
    if (a === b) return 0
    const position = a.compareDocumentPosition(b)

    if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        return -1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
        return 1;
    } else {
        return 0;
    }

}