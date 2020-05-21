import { FieldContainer } from "./form.fieldContainer.js"
import Field from "./form.field.js"
import { Component } from "./base.js";

class PlusButton extends Component {
    constructor(parent) {
        super()
        this.parent = parent
    }
    onclick(e) {
        this.parent.addRow()
    }
    render() {
        return this.html`<div class="${`text-center mb-3 ${this.parent.readonly || this.parent.disabled || this.parent.rowsMaxed ? "d-none" : ""}`}"><button style="width:30px;height:30px;" onclick=${this} type="button" class="btn btn-sm rounded-circle btn-outline-primary p-0">+</button></div>`
    }
}
class ArrayFieldRow extends FieldContainer {
    constructor({
        container, property, template, handlers, schema, options, uniqueId, name, context,
        readonly, fieldTypes, customFieldTypes, templateHelpers, setTrap, array, value
    }) {
        //Clear out the options from the array. These would be called with an incorrect "row" context
        options = Object.assign({}, options, { callbacks: {}, modifiers: {}, domHandlers: {}, classes: "" })
        super({ container, property, template, handlers, schema, options, uniqueId, name, context, readonly, fieldTypes, customFieldTypes, templateHelpers, setTrap, value })
        this.array = array
    }
    changed(field) {
        this.array.changed(field || this)
    }
    onclick(e) {
        this.handlers.remove(this)
    }
    get fieldPath() {
        return this.container ? `${this.container.fieldPath}.fields.${this.property}.rows[${this.index}]` : "$"
    }
    get dataPath() {
        return this.container ? `${this.container.dataPath}.${this.property}[${this.index}]` : "$"
    }
    get minusButton() {
        return this.wire(this, ":minusButton")`<div class="row h-100 justify-content-center"><button style="width:30px;height:30px;" tabIndex="-1" onclick=${this} type="button" class="${`${this.readonly || !this.editable || this.disabled ? "d-none" : ""} btn btn-sm rounded-circle btn-outline-danger my-auto p-0`}">-</button></div>`
    }
    get view() {
        return {
            content: this.wire(this, ":main")`<div class="col-1">${this.minusButton}</div><div class="col-11">${this.template(this)}</div>`,
            classes: "row mb-3"
        }
    }
}
export class ArrayField extends Field {
    constructor({ property, schema, options, type, fieldType, customFieldType, container, fieldTypes, customFieldTypes, setTrap }) {
        super({ property, schema, options, type, fieldType, customFieldType, container, fieldTypes, customFieldTypes, setTrap })
        this.template = this.options.template
        this.fieldTypes = fieldTypes
        this.customFieldTypes = customFieldTypes

        this.rows = []
        this.plusButton = PlusButton.for(this)
        this.rowDataMap = new WeakMap()
        this.rowData = []
    }
    get dataToFieldMap() {
        return Object.assign(
            this.rows.map(r => r.dataToFieldMap),
            { _fieldPath: this.fieldPath }
        )
    }
    get readonly() {
        return super.readonly
    }
    set readonly(readonly) {
        super.readonly = readonly
        this.plusButton && this.plusButton.render()
        for (const row of this.rows) row.readonly = this.readonly
    }
    get disabled() {
        return super.disabled
    }
    set disabled(disabled) {
        super.disabled = disabled
        this.plusButton && this.plusButton.render()
        for (const row of this.rows) row.disabled = this.disabled
    }
    get editable() {
        return super.editable
    }
    set editable(editable) {
        super.editable = editable
        this.plusButton && this.plusButton.render()
        for (const row of this.rows) row.editable = this.editable
    }
    get childrenLoaded() {
        //ToDo - Remove
        this.throwError("childrenLoaded getter is deprecated")
    }
    get rowsMaxed() {
        return this.schema.maxItems && this.rows.length >= this.schema.maxItems
    }
    addRow(data = {}) {
        if (this.rowsMaxed) return
        let arrayRow
        if (!this.rowDataMap.has(data)) {
            const remove = row => this.removeRow(row)
            const name = `Item${this.rows.length}`
            arrayRow = new ArrayFieldRow(Object.assign({
                handlers: { remove }, uniqueId: `${this.id}_${name}`, name,
                array: this
            }, this))
            this.rowData.push(data)
            this.rowDataMap.set(data, arrayRow)
            arrayRow.index = this.rows.push(arrayRow) - 1
        } else {
            arrayRow = this.rowDataMap.get(data)
        }
        arrayRow.value = data
        this.changed(arrayRow)
        this.renderIfBound()
        return arrayRow
    }
    onchange() { /*Suppress the DOM change getting called in the super class*/ }
    changed(field) {
        super.changed()
        this.validate()
        this.renderIfBound()
        this.plusButton.renderIfBound()
        this.lastFieldChanged = field
    }
    removeRow(row) {
        this.rowData = this.rowData.filter(rd => rd !== row.data)
        this.rows.splice(this.rows.indexOf(row), 1)
        this.changed(row)
    }
    validate({ showMessages = false } = {}) {
        let { valid, message } = super.validate()
        //Run through each of the validations
        if (this.schema.required && this.rows.length < 1) {
            valid = false;
            message = "Field is required";
        }
        if (this.schema.minItems && this.rows.length < this.schema.minItems) {
            valid = false
            message = `Field must have at least [${this.schema.minItems}] items.`
        }
        if (this.schema.maxItems && this.rows.length > this.schema.maxItems) {
            valid = false;
            message = `Field must have at most [${this.schema.maxItems}] items.`
        }
        const arrayValid = valid
        let invalidRows = []
        if (valid) {
            invalidRows = this.rows.filter(r => !r.validate({ showMessages }).valid)
            valid = invalidRows.length === 0
            if (!valid) message = "1 or more array rows are invalid"
        }

        return this.validation = { valid, arrayValid, invalidEditableFields: invalidRows, message }
    }
    get serialValue() {
        return this.rows.map(row => row.suppressedSerialValue)
    }
    get value() {
        return this.rows.map(row => row.value)
    }
    set value(rowData) {
        this.valueSetCount++
        if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const removedRows = this.rowData.filter(r => !rowData.includes(r)).map(r => this.rowDataMap.get(r))
            this.rows = this.rows.filter(r => !removedRows.includes(r))
            for (const row of rowData) this.addRow(row)
        } else {
            this.rows = []
            this.rowData = []
            this.changed()
        }
    }
    get displayValidationErrors() {
        const rowValidationMessages = this.rows.some(r => r.fields && Object.values(r.fields).some(f => f.displayValidationErrors && !f.validation.valid))
        return rowValidationMessages || this.valueSetCount > 0 && !this.validation.arrayValid
    }
}