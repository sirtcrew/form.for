import { Component } from "./base.js"
import { dynamicTemplateWire } from "./dynamicTemplate.js"
import { getRandomNumber, documentPositionComparator } from "./helpers.js"
import { FieldTypes } from "./form.fieldTypes.js"
import { FieldFactory } from "./form.fieldFactory.js"
import { JSONPath } from "./libraries/JSONPath.js"
import { suppressValue, evaluateDependencies } from "./form.field.js"

const getFields = container => container.fields && Object.values(container.fields) || container.rows
const getFirstField = (container, getChildFields = getFields) => {
    const childFields = getChildFields(container)
    if (!childFields) return false
    const firstField = childFields.filter(f => f.element.parentElement).sort((a, b) => {
        return documentPositionComparator(a.element, b.element)
    })[0]
    return firstField ? getFirstField(firstField, getChildFields) || firstField : false
}
const doModifier = (instance, modifier, bool) => {
    instance[`_${modifier}`] = bool
    instance.setModifierOnChildren(modifier, bool)
    instance.validate()
    instance.renderIfBound()
}

export class FieldContainer extends Component {
    constructor({
        schema, options, container, property, template = options.template, handlers, uniqueId = getRandomNumber(), name = uniqueId, context = {},
        readonly, fieldTypes, customFieldTypes, templateHelpers, setTrap, value
    }) {
        super({ setTrap })
        /** @type {FieldTypes.prototype} */
        this.fieldTypes = fieldTypes
        this.customFieldTypes = customFieldTypes
        this.schema = schema
        this.options = Object.assign({ callbacks: {} }, options)
        this.templateHelpers = templateHelpers
        this.template = template
        this.handlers = handlers
        this.container = container
        this.property = property
        this.context = context
        this.uniqueId = uniqueId
        this.name = name
        this.readonly = readonly
        this.fields = new FieldFactory({ container: this }).generateFields()
        if (value !== undefined) this.value = value
    }
    onconnected(e) {
        super.onconnected(e)
        this.options.callbacks.connected && this.options.callbacks.connected(this)
    }
    get context() {
        return Object.assign({}, this.container && this.container.context, this._context || {})
    }
    set context(context) {
        this._context = Object.assign(this.context, context)
        if (this.fields) for (const field of Object.values(this.fields).filter(f => f.fields)) field.context = this.context
    }
    get dataToFieldMap() {
        return Object.assign(
            { _fieldPath: this.fieldPath },
            Object.values(this.fields).reduce((obj, f) => Object.assign(obj, { [f.property]: f.dataToFieldMap }), {})
        )
    }
    get fieldPath() {
        return this.container ? `${this.container.fieldPath}.fields.${this.property}` : "$"
    }
    get dataPath() {
        return this.container ? `${this.container.dataPath}.${this.property}` : "$"
    }
    get formElement() {
        //ToDo
        this.throwError("The formElement getter on a fieldContainer is deprecated")
    }
    async configure(value) {
        //ToDo - Remove
        this.throwError("Stop calling asyncConfigure()")
    }
    fieldsByDataPath(dataPath) {
        return JSONPath(dataPath, this.dataToFieldMap).filter(r => r._fieldPath).map(r =>
            JSONPath({ path: r._fieldPath, json: this, wrap: false })
        )
    }
    changed(field) {
        this.options.callbacks.change && this.options.callbacks.change(this)
        this.lastFieldChanged = field
        this.container && this.container.changed && this.container.changed(this)
    }
    dependencyChange(field) {

        evaluateDependencies(this.dependencies, field)

        this.validate()

        //Call the reveal or conceal
        const visible = this.visible
        if (visible && this.options.reveal) this.options.reveal(this)
        if (!visible && this.options.conceal) this.options.conceal(this)
        this.renderIfBound()
    }
    get visible() {
        return !this.hidden && (!this.dependencies || this.dependencies.every(d => d.satisfied))
    }
    setModifierOnChildren(modifier, bool) {
        if (!["readonly", "disabled", "redacted", "hidden", "editable"].includes(modifier)) this.throwError(`The modifier [${modifier}] does not exist.`)
        if (this.fields) for (const field of Object.values(this.fields)) field[modifier] = !!bool
    }
    get editable() {
        if (this._editable === undefined) this._editable = true
        return this._editable
    }
    set editable(bool) {
        doModifier(this, "editable", !!bool)
    }
    get readonly() {
        return !this.editable || this._readonly
    }
    set readonly(bool) {
        doModifier(this, "readonly", !!bool)
    }
    get hidden() {
        return this._hidden
    }
    set hidden(bool) {
        doModifier(this, "hidden", !!bool)
    }
    get disabled() {
        return this._disabled
    }
    set disabled(bool) {
        doModifier(this, "disabled", !!bool)
    }
    get redacted() {
        return this._redacted
    }
    set redacted(bool) {
        doModifier(this, "redacted", !!bool)
    }
    set template(template) {
        this._template = dynamicTemplateWire(template, this.templateHelpers)
    }
    get template() {
        return this._template || (() => "No Template Supplied")
    }
    validate({ showMessages = false, scrollToInvalid = false, refreshChildValidation = true } = {}) {
        if (!this.fields) return this.validation = { valid: false }
        const invalidFields = Object.values(this.fields).filter(f => !(refreshChildValidation || !f.validation ? f.validate({ showMessages }) : f.validation).valid)
        const invalidEditableFields = this.editableFields.filter(f => !f.validation.valid)
        const invalidVisibleFields = this.visibleFields.filter(f => !f.validation.valid)
        if (showMessages) for (const field of invalidEditableFields) {
            field.valueSetCount++
            field.render()
        }
        this.validation = {
            allFieldsValid: invalidFields.length === 0,
            valid: invalidEditableFields.length === 0 || this.disabled || this.redacted || !this.visible,
            allVisibleFieldsValid: invalidVisibleFields.length === 0,
            invalidEditableFields,
            invalidVisibleFields,
            messages: invalidEditableFields.map(f => `${f.property}: ${f.validation.message || f.validation.messages}`)
        }
        if (scrollToInvalid) this.goToFirstInvalidField()
        return this.validation
    }
    get visibleFields() {
        return Object.values(this.fields).filter(f => f.visible && !f.redacted)
    }
    get editableFields() {
        return Object.values(this.fields).filter(f => f.editable && !f.disabled && !f.redacted && f.visible)
    }
    get firstField() {
        return getFirstField(this)
    }
    get firstInvalidField() {
        const getChildFields = container =>
            container.validation && container.validation.invalidEditableFields && container.validation.invalidEditableFields.length !== 0 && container.validation.invalidEditableFields
        return getFirstField(this, getChildFields)
    }
    goToFirstInvalidField() {
        const firstInvalidField = this.firstInvalidField
        firstInvalidField && firstInvalidField.focusInView()
    }
    set value(value) {
        if (typeof value !== "object") return
        for (const prop of Object.keys(value)) {
            const field = this.fields[prop]
            if (field) {
                const fieldValue = field.serialValue
                //ToDo - Why is the null and undefined here?
                if (fieldValue === undefined || fieldValue === null || fieldValue !== value[prop]) field.value = value[prop]
            }
        }
        this.validate({ refreshChildValidation: false })
    }
    get value() {
        return Object.values(this.fields).map(
            //Do this so that the underlying fields getter isn't called multiple times
            f => ({ property: f.property, value: f.value })
        ).filter(f => f.value !== undefined).reduce((obj, f) => Object.assign(obj, { [f.property]: f.value }), {})
    }
    get suppressedSerialValue() {
        return suppressValue(this, this.serialValue)
    }
    get serialValue() {
        return this.fields ?
            Object.values(this.fields).map(
                //Do this so that the underlying fields getter isn't called multiple times
                f => ({ property: f.property, suppressedSerialValue: f.suppressedSerialValue })
            ).filter(f => f.suppressedSerialValue !== undefined).reduce((obj, f) => Object.assign(obj, { [f.property]: f.suppressedSerialValue }), {}) :
            undefined
    }
}