import { Component } from "./base.js"
import { transition, shake, typewriter, smoothScrollIntoView } from './helpers.js'
import { privates } from "./privates.js"

const tenses = ["past", "present", "future"]
export default class Signature extends Component {
    constructor({ user, getUser = () => ({}), setTrap, preSigningCheck = () => true, postSigningCallback = () => { } }) {
        super({ setTrap })
        this.signedByUser = undefined
        this.signingReason = ""
        this.textClass = ""
        this.tense = "future"
        privates.set(this, { getUser, preSigningCheck, postSigningCallback })
    }
    get textClass() {
        return privates.get(this).textClass
    }
    set textClass(textClass) {
        privates.set(this, { textClass })
        this.renderIfBound()
    }
    async onclick(e) {
        if (this.sign({ render: false })) {
            await transition(this.checkbox, "opacity", 0, 500, () => {
                this.renderIfBound()
                smoothScrollIntoView(this.signature)
            })
            await typewriter(({ element: this.signature.querySelector("p") }))
        } else {
            await shake({ element: this.checkbox, callback: () => e.target.checked = false })
        }
        privates.get(this).postSigningCallback()
    }
    get signed() {
        return this.tense === "future" ? false : this.tense === "past" && this.signedByUser ? true : !!this.signedByUser || false
    }
    sign({ user, render = true } = {}) {
        const { getUser, preSigningCheck } = privates.get(this)
        if (this.signed || !preSigningCheck()) return false
        this.signedByUser = user || getUser()
        render && this.renderIfBound()
        return true
    }
    unsign({ render = true } = {}) {
        //ToDo - Are there further actions that should be performed when a signature is unsigned?
        this.signedByUser = undefined
        render && this.renderIfBound()
    }
    set tense(tense) {
        if (!tenses.includes(tense)) this.throwError(`Bad tense set [${tense}]. Tense muse be one of [${tenses.join(", ")}]`)
        privates.set(this, { tense })
        this.renderIfBound()
    }
    get tense() {
        return privates.get(this).tense
    }
    get signature() {
        const { employeeName, novellId, employeeId, email, signedDate } = (this.signedByUser || {})
        const details = this.wire(this, ":details")`<div class="text-muted">
			<p class="m-0 small">${`Novell: ${novellId}, Employee Id: ${employeeId}, Signed on: ${signedDate}`}</p>
		</div>`

        return this.wire(this, ":signature")`<div>
            <div class="d-inline-block"><p class="font-weight-bold signature pt-4 d-inline-block" style="vertical-align: top;">${employeeName}</p></div>
			<p class="m-0">${this.signingReason}</p>
			<p class="m-0"><a href="${email}">${email}</a></p>
			${details}
		</div>`
    }
    get checkbox() {
        return this.wire(this, ":checkbox")`<div class="form-check">
            <label class="${`form-check-label ${this.textClass}`}">
                <input type="checkbox" onclick=${this} class="form-check-input" checked=${this.signed}>
                I am signing this as ${this.signingReason}
            </label>
		</div>`
    }
    get title() {
        return this.wire(this, ":title")`<h4>${this.signed ? "Signed" : "Signing Required"}</h4>`
    }
    get view() {
        return {
            content: this.wire(this, ":main")`
				${this.title}
				${this.payload}
				${this.signed || ["future", "past"].includes(this.tense) ? "" : this.checkbox}
                ${this.tense === "future" ? `To be signed by ${this.signingReason}` : this.signed ? this.signature : ""}`
        }
    }
}