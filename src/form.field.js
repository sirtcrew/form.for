import { Component } from "./base.js"
import { mergeDeep } from "./mergeDeep.js"

export const suppressValue = (field, value) => field.visible && !field.disabled && !field.redacted ? value : undefined
export const evaluateDependencies = (dependencies, field) => {
    for (const dependency of dependencies.filter(d => d.propertyName === field.property)) {
        let satisfied
        if (dependency.condition && typeof dependency.condition === "function") {
            satisfied = dependency.condition(field) && field.validate().valid
        } else if (dependency.condition) {
            satisfied = dependency.condition === field.value && field.validate().valid
        } else {
            satisfied = field.validate().valid
        }
        dependency.satisfied = satisfied && field.visible
    }
}

const clickHandlers = new WeakMap
const blurHandlers = new WeakMap
const changeHandlers = new WeakMap

export default class Field extends Component {
    constructor({ property, schema, options, type, fieldType, customFieldType, container, setTrap }) {
        super({ setTrap })
        this.property = property
        this.schema = mergeDeep({ type: "string" }, schema)
        this.options = Object.assign({ callbacks: {}, modifiers: {}, domHandlers: {}, classes: "" }, options, { required: schema.required })
        this.type = type
        this.fieldType = fieldType
        this.customFieldType = customFieldType
        this.dependencies = []
        this.container = container

        this.valueSetCount = 0
    }
    get context() {
        return this.container.context
    }
    get dataToFieldMap() {
        return { _fieldPath: this.fieldPath }
    }
    get fieldPath() {
        return this.container ? `${this.container.fieldPath}.fields.${this.property}` : "$"
    }
    get dataPath() {
        return this.container ? `${this.container.dataPath}.${this.property}` : "$"
    }
    get validation() {
        return this._validation
    }
    set validation(validation) {
        const valid = this.disabled || this.redacted || !this.visible || validation.valid

        let message = validation.message

        if (!validation.valid && valid) message = `Field is valid due to one the following conditions: disabled [${this.disabled}], redacted [${this.redacted}], visible [${this.visible}]`
        this._validation = Object.assign(validation, { valid, message })
    }
    dependencyChange(field) {
        evaluateDependencies(this.dependencies, field)

        this.validate()

        //Call the reveal or conceal
        const visible = this.visible
        if (visible && this.options.reveal) this.options.reveal(this)
        if (!visible && this.options.conceal) this.options.conceal(this)
        if (visible) this.valueSetCount = 0
        this.renderIfBound()
    }
    get visible() {
        return !this.hidden && (!this.dependencies || this.dependencies.every(d => d.satisfied))
    }
    get editable() {
        if (this._editable === undefined) this._editable = true
        return this._editable
    }
    set editable(bool) {
        this._editable = !!bool
        this.validate()
        this.renderIfBound()
    }
    get readonly() {
        //If a field is to be readonly intipendent of its parent, it MUST be set in the modifiers in the options.
        return !this.editable || this.options.modifiers.readonly === true ? true : this.container.readonly || this._readonly
    }
    set readonly(readonly) {
        this._readonly = readonly
        this.renderIfBound()
    }
    get hidden() {
        return this.options.modifiers.hidden === true ? true : this._hidden
    }
    set hidden(bool) {
        this._hidden = !!bool
        this.validate()
        this.renderIfBound()
    }
    get disabled() {
        return this.options.modifiers.disabled === true ? true : this._disabled
    }
    set disabled(bool) {
        this._disabled = this._readonly = !!bool
        this.validate()
        this.renderIfBound()
    }
    get redacted() {
        return this._redacted
    }
    set redacted(redacted) {
        this._redacted = redacted
        this.renderIfBound()
    }
    triggerOnChange() {
        this.formElement && this.formElement.dispatchEvent(new Event('change', { bubbles: true }))
    }
    get onchange() {
        if (!changeHandlers.has(this)) changeHandlers.set(this, e => {
            this.value = this.elementValue
            if (this.options.domHandlers.onchange) this.options.domHandlers.onchange.call(this, e)
        })
        return changeHandlers.get(this)
    }
    get onblur() {
        if (!blurHandlers.has(this)) blurHandlers.set(this, e => {
            this.value = this.elementValue
            if (this.options.domHandlers.onblur) this.options.domHandlers.onblur.call(this, e)
        })
        return blurHandlers.get(this)
    }
    get onclick() {
        if (!clickHandlers.has(this)) clickHandlers.set(this, e => {
            this.value = this.elementValue
            if (this.options.domHandlers.onclick) this.options.domHandlers.onclick.call(this, e)
        })
        return clickHandlers.get(this)
    }
    onconnected(e) {
        super.onconnected(e)
        this.options.callbacks.connected && this.options.callbacks.connected(this)
    }
    get id() {
        return `${this.property}_${this.container.uniqueId}`
    }
    get name() {
        return this.property
    }
    get attributes() {
        this.throwError("defunct code")
    }
    get formElement() {
        return this.element ? this.element.querySelector(`#${this.id}`) : undefined
    }
    //This is our DOM bridge. It gets a value from an element regardless of its type.
    get elementValue() {
        return this.element ? this.element.querySelector(`[name="${this.name}"]`).value : undefined
    }
    get defaultSelectOption() {
        return this.options.defaultSelectOption
    }
    get helper() {
        return this.options.helper
    }
    get label() {
        return this.options.label
    }
    get domValue() {
        return this.value === undefined ? "" : this.value
    }
    get suppressedSerialValue() {
        return this.suppressValue(this.serialValue)
    }
    get serialValue() {
        return this.value === undefined ? "" : this.value
    }
    suppressValue(value) {
        return suppressValue(this, value)
    }
    get value() {
        return this._value
    }
    changed() {
        this.options.callbacks.change && this.options.callbacks.change(this)
        this.container && this.container.changed(this)
    }
    set value(value) {
        let parsedValue = this.validate({ newValue: value }).value
        if (!this.valid) {
            this._value = null
            this.log(`Bad value [${value}] set on field [${this.property}]: ${this.message}`)
        } else {
            this._value = parsedValue
        }
        this.valueSetCount++
        this.renderIfBound()
        this.changed()
    }
    get valid() {
        return this.validation && this.validation.valid
    }
    validate({ newValue } = {}) {
        let valid = true, message = "Field is valid", value = newValue === undefined ? this.serialValue : newValue

        if (this.options.validate) {
            let { valid: customValid, message: customMessage } = this.options.validate(this, value)
            if (customValid === false) {
                valid = customValid
                message = customMessage
            }
        }
        return this.validation = { valid, message, value }
    }

    get view() {
        return {
            content: this.visible ? this.fieldType.template(this) : ""
        }
    }
    get displayValidationErrors() {
        return this.editable && this.valueSetCount > 0
    }
}

export const alwaysValid = { valid: true, message: "This field is always valid" }
class AlwaysValidField extends Field {
    get elementValue() { }
    get defaultSelectOption() { }
    get helper() { }
    get label() { return this.visible ? this.options.label : undefined }
    get domValue() { }
    get serialValue() { }
    get value() { }
    set value(value) { if (value !== undefined) this.throwError(`Setters are not used on AlwaysValid fields`) }
    get validation() { return alwaysValid }
    validate({ newValue } = {}) { return this.validation }
}
export class Button extends AlwaysValidField { }
export class Label extends AlwaysValidField { }

export class StringField extends Field {
    validate({ newValue } = {}) {
        let { valid, message, value } = super.validate({ newValue })

        //Run through each of the validations
        if (this.schema.required && (value === undefined || value === null || value === "")) {
            valid = false
            message = "Field is required"
        }
        return this.validation = { valid, message, value }
    }
}

export class EnumField extends Field {
    constructor({ property, uniqueId, schema, options, type, fieldType, customFieldType, container, setTrap }) {
        super({ property, uniqueId, schema, options, type, fieldType, customFieldType, container, setTrap })
        if (!this.enum) this.throwError(`Enum field [${property}] has been constructed without a enum specified in schema or options`)
        this.buildList()
    }
    buildList() {
        const useOptionLabels = this.options.optionLabels && this.options.optionLabels.length === this.enum.length
        this.list = this.enum.map((value, index) => ({
            name: useOptionLabels ? this.options.optionLabels[index] : value,
            value: value
        }))
        this.renderIfBound()
    }
    get enum() {
        //Sometimes we want to control the values availabel to a field but we do not want to restrict the values that can exist in the object.
        //Putting an enum in options only, allows for this.
        return (this.schema.items && this.schema.items.enum) || this.schema.enum || this.options.enum
    }
    validate({ newValue } = {}) {
        let { valid, message, value } = super.validate({ newValue })

        //Run through each of the validations
        if (this.schema.required && (value === undefined || value === null || value === "")) {
            valid = false
            message = "Field is required"
        } else if (Array.isArray(value)) {
            if (!value.every(v => this.enum.find(i => i === v))) {
                valid = false
                message = "One or more selected values is invalid"
            } else for (const i of this.list) i.selected = value.includes(i.value)
        } else {
            if (!this.enum.find(i => i === value)) {
                valid = false
                message = "Selected value is invalid"
            } else for (const i of this.list) i.selected = i.checked = i.value === value
        }
        return this.validation = { valid, message, value }
    }
}

export class SelectField extends EnumField {
    get elementValue() {
        const selected = Array.from(this.formElement.options).filter(opt => opt.selected && !(opt.disabled || opt.hidden)).map(
            opt => this.schema.type === "number" ? parseInt(opt.value || opt.text) : opt.value || opt.text
        )
        return selected.length === 1 ? selected[0] : selected
    }
}

export class RadioField extends EnumField {
    get elementValue() {
        const checkedElements = Array.from(this.element.querySelectorAll(`[name="${this.name}"]`)).filter(e => e.checked)
        return checkedElements.length ? checkedElements[0].value : undefined
    }
}

export class NumberField extends Field {
    validate({ newValue } = {}) {
        let { valid, message, value } = super.validate({ newValue })

        //Run through each of the validations
        if (this.schema.required && (value === undefined || value === null || value === "")) {
            valid = false
            message = "Field is required"
        }

        if (value === null || value === "" || value === undefined) {
            value = null
        } else if (isNaN(value)) {
            valid = false
            message = "Value is not a number"
        } else {
            value = Number(value)
        }
        return this.validation = { valid, message, value }
    }
}

export class PercentField extends NumberField {
    validate({ newValue } = {}) {
        let value = newValue === undefined ? this.value : newValue
        if (isNaN(value) || typeof value === "string") {
            if (/^\d*\.?\d*%$/.test(value)) value = value.replace("%", "")
            if (!isNaN(value)) value /= 100
        }
        return this.validation = super.validate({ newValue: value })
    }
    get domValue() {
        return this.value !== undefined && this.value !== null ? `${parseFloat((this.value * 100).toFixed(this.options.decimalPlaces || 2))}%` : ""
    }
}

export class CurrencyField extends NumberField {
    validate({ newValue } = {}) {
        if (/\$[^\]]+/.test(newValue)) newValue = newValue.replace("$", "")

        let value = newValue === undefined ? this.value : newValue
        if (isNaN(value) || typeof value === "string") {
            if (/\$[^\]]+/.test(value)) value = value.replace("$", "")
        }
        return this.validation = super.validate({ newValue: value })
    }
    get domValue() {
        return this.value !== undefined && this.value !== null ? `$${parseFloat(this.value).toFixed(this.options.decimalPlaces || 2)}` : ""
    }
}

export class BooleanField extends Field {
    validate({ newValue } = {}) {
        const { value } = super.validate({ newValue })
        return this.validation = { valid: true, message: "Booleans are always valid", value: (value === "true" || value === true) }
    }
    get elementValue() {
        if (!this.formElement) return
        if (this.formElement.type === "checkbox") return this.formElement.checked
    }
}