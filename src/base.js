import { Component as HyperComponent, wire } from './libraries/hyperHTML.js'
import { throwError, getObserver, transition, bind, smoothScrollIntoView } from './helpers.js'
import { privates } from './privates.js'

export class Component extends HyperComponent {
    constructor({ setTrap, getTrap, responsive } = {}) {
        super()
        //Prevent element from being redefined.
        Object.defineProperty(this, 'element', {
            get() {
                if (!that._wire$) return undefined
                if (that._wire$ instanceof Element) return that._wire$

                const firstChild = that._wire$.firstChild
                return firstChild && firstChild.parentNode
            }
        })
        //WARNING - do not use "this" inside constructor; make sure to use "that".
        //We replace "this" with a proxy if requested and do not want to leak the original "this" accidentally.
        const that = setTrap || getTrap ? getObserver(this, setTrap, getTrap) : this

        that.wire = wire
        that.throwError = throwError
        that.connectedCount = 0
        return that
    }
    get debugging() {
        return window.debugging || privates.get(this).debugging
    }
    set debugging(bool) {
        privates.get(this, { debugging: bool })
    }
    log(...args) {
        args.unshift(`${this.constructor.name}:`)
        if (this.debug) console.log.apply(this, args)
    }
    renderIfBound() {
        if (this.element) this.render()
    }
    async transition(property, value, duration_ms, callback) {
        return await transition(this.element, property, value, duration_ms, callback)
    }
    async fade(duration_ms, callback) {
        return await transition(this.element, "opacity", 0, duration_ms, callback)
    }
    focusInView() {
        return this.element && smoothScrollIntoView(this.element)
    }
    afterRender(e) { }
    onchange(e) { }
    onclick(e) { }
    onreconnected(e) {
        this.render()
    }
    onconnected(e) {
        this.afterRender(e)
        if (this.connectedCount > 0) this.onreconnected(e)
        this.connectedCount++
    }
    ondisconnected(e) {
    }
    bind(element, newElementType, newElementClasses) {
        bind(this, element, newElementType, newElementClasses)
        return this
    }
    get view() {
        this.throwError("If you are using declarative base render, you must provide a [get view()] on your component that returns [{ content, classes, style, elementType }]")
    }
    render() {
        const { content, classes, style, elementType = "div" } = this.view

        switch (elementType) {
            case "div":
                return this.html`<div onconnected=${this} ondisconnected=${this} class="${classes}" style="${style}">${content}</div>`
            case "tr":
                return this.html`<tr onconnected=${this} ondisconnected=${this} class="${classes}" style="${style}">${content}</tr>`
            case "td":
                return this.html`<td onconnected=${this} ondisconnected=${this} class="${classes}" style="${style}">${content}</td>`
            case "th":
                return this.html`<th onconnected=${this} ondisconnected=${this} class="${classes}" style="${style}" onclick=${this}>${content}</th>`
            case "li":
                return this.html`<li onconnected=${this} ondisconnected=${this} class="${classes}">${content}</li>`
            case "button":
                return this.html`<button onconnected=${this} ondisconnected=${this} class="${classes}" onclick=${this} type="button">${content}</button>`
            case "table":
                return this.html`<table ondisconnected=${this} onconnected=${this} class="${[classes, "table"].filter(Boolean).join(" ")}">${content}</table>`
            case "form":
                return this.html`<form ondisconnected=${this} onconnected=${this}>${content}</form>`
        }
    }
}