import { FieldContainer } from "./form.fieldContainer.js"
import Signature from "./user.signature.js"
import { getRandomNumber } from "./helpers.js"

export class ApprovalSectionField extends FieldContainer {
    constructor({ container, templateHelpers, property, template, handlers, schema, options, uniqueId = getRandomNumber(), name = uniqueId, context = {}, readonly, fieldTypes, customFieldTypes, setTrap, value }) {
        Object.assign(schema.properties, { user: { required: true } })
        Object.assign(options.fields, {
            user: {
                type: "field",
                validate: (fieldInstance, value) => {
                    let valid = true, message = "Field is valid"

                    if (value === undefined || value === null || value === "" || !value.email) {
                        valid = false
                        message = "Signing Required"
                    }

                    return { valid, message, value }
                }
            }
        })
        super({ container, templateHelpers, property, template, handlers, schema, options, uniqueId, name, context, readonly, fieldTypes, customFieldTypes, setTrap })
        if (!this.context.user) this.throwError("A user object must be supplied in this field's context or a parent's context!")
        this.signature = new Signature({
            preSigningCheck: () => this.validate({ showMessages: true, showSignatureMessages: false }).allVisibleFieldsValid,
            postSigningCallback: () => this.goToFirstInvalidField(),
            getUser: () => this.context.user,
            setTrap: (property, value) => {
                if (property === 'signedByUser' && value && (!this.value.user || value.email !== this.value.user.email)) {
                    this.setModifierOnChildren("readonly", true, false)
                    this.value = { user: value }
                }
            }
        })
        //We need to construct a signature before setting value, hold value away from super() and set it manually later...
        this.value = value
    }
    get visibleFields() {
        return Object.values(this.fields).filter(f => f.property !== "user" && f.visible && !f.redacted)
    }
    set value(value) {
        super.value = value
        this.applySignatureTense()
        if (this.fields.user.validation && this.fields.user.validation.valid) {
            this.signature.sign(this.value)
        } else {
            this.signature.unsign()
        }
    }
    get value() {
        return super.value
    }
    validate({ showMessages = false, showSignatureMessages = showMessages } = {}) {
        super.validate({ showMessages })
        if (this.signature)
            this.signature.textClass = !this.fields.user.validation.valid && showSignatureMessages ? "text-danger" : ""
        return this.validation
    }
    setModifierOnChildren(modifier, bool, doSignatureTense = true) {
        super.setModifierOnChildren(modifier, bool)
        if (doSignatureTense && this.signature) this.applySignatureTense()
    }
    applySignatureTense() {
        const tense = this.editable ?
            !this.hidden && !this.disabled && !this.redacted ? "present" : "future" :
            this.visibleFields.length > 0 && (this.validation || this.validate()).allVisibleFieldsValid && !!this.value.user ? "past" : "future"
        this.signature.tense = tense
    }
    get serialValue() {
        const user = this.signature.signedByUser || {}
        return ["present", "past"].includes(this.signature.tense) ? Object.assign(super.serialValue, { user }) : undefined
    }
    get view() {
        this.signature.payload = this.template(this)
        this.signature.signingReason = this.templateHelpers.requestSubjectToSigningAs(this.context.updator)
        return {
            content: this.visible ? this.wire(this, ":main")`<div onchange=${this}>${this.signature}${this.fields.user}</div>` : "",
            style: !this.editable ? "background-color: rgba(84, 84, 84, 0.06); opacity: 0.7;" : ""
        }
    }
}