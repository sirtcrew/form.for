import { Component } from "./base.js"
import Field from "./form.field.js"

export class CustomField extends Field {
	constructor({ property, schema, options, type, fieldType, customFieldType, container, setTrap }) {
		super({ property, schema, options, type, fieldType, customFieldType, container, setTrap })
		this.customFieldInstance = this.customFieldType.function(this)

		if (!(this.customFieldInstance instanceof Component))
			this.throwError("Only functions that return a component instance are currently supported for custom field types")

		if (!this.customFieldType.valueGetter || !this.customFieldType.valueSetter)
			this.throwError("Custom field implementation must have valueGetter and valueSetter")
	}
	async configure() {
		this.customFieldInstance.asyncConfigure && await this.customFieldInstance.asyncConfigure()
	}
	set disabled(bool) {
		this._disabled = this._readonly = !!bool
		this.customFieldType.disabledSetCallback(this)
		this.validate()
		this.renderIfBound()
	}
	get disabled() {
		return this._disabled
	}
    validate({ newValue } = {}) {
        let { valid, message, value } = super.validate({ newValue })
		if (this.schema.required && (value === undefined || value === null || value === "")) {
			valid = false
			message = "Field is required"
		}
		if (valid && this.customFieldType.validate) {
			({ valid: valid, message: message, value: value } = this.customFieldType.validate(this.customFieldInstance, value))
		}
		return this.validation = { valid, message }
	}
	set readonly(readonly) {
		this._readonly = !!readonly
		this.customFieldType.readonlySetCallback(this)
		this.renderIfBound()
	}

	get readonly() {
		return !!this._readonly
	}
	get value() {
		return this.customFieldInstance ? this.customFieldType.valueGetter(this.customFieldInstance, this) : undefined
	}
	set value(value) {
        this.validate({ newValue: value })
		this.customFieldType.valueSetter(this.customFieldInstance, value, this)
		if (this.customFieldInstance.element) this.customFieldInstance.render()
		this.changed()
	}
	get serialValue() {
		return this.customFieldInstance && this.customFieldType.serialValueGetter ? this.customFieldType.serialValueGetter(this.customFieldInstance, this) : this.value
	}
}