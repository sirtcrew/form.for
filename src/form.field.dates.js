import flatpickr from "./libraries/flatpickr.js"
import Field from "./form.field.js"

const pad = (n, length) => ('' + n).padStart(length, 0),
    dateISOLocale = date => `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`,
    dateTimeISOLocale = date => `${dateISOLocale(date)}T${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`,
    intlDate = new Intl.DateTimeFormat([], { year: "numeric", month: "numeric", day: "numeric" }),
    intlTime = new Intl.DateTimeFormat([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
    dateLocale = intlDate.format,
    dateTimeLocale = date => `${intlDate.format(date)} ${intlTime.format(date)}`

export class DateField extends Field {
    constructor({ property, uniqueId, schema, options, type, fieldType, container, setTrap }) {
        super({ property, uniqueId, schema, options, type, fieldType, container, setTrap })
        this.localeStringFormatter = dateLocale
        this.localeISOStringFormatter = dateISOLocale
    }
    validate({ newValue } = {}) {
        let valid = true, message = "Field is valid", value = newValue === undefined ? this.serialValue : newValue

        //Run through each of the validations
        if (this.schema.required && (value === undefined || value === null || value === "")) {
            valid = false
            message = "Field is required"
        }

        if (valid && value) {
            //Is this coming from the database? Is it a well-formed ISO DateTime string?
            if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value)) {
                if (/\d{4}-\d{2}-\d{2}\D\d{2}:\d{2}/.test(value)) {
                } else if (/\d{4}-\d{2}-\d{2}/.test(value)) {
                    value += 'T00:00:00.000'
                } else {
                    valid = false
                    message = "Value is not in ISO date format or simple date format YYYY-MM-DD"
                }
            }
            const date = new Date(value)
            if (isNaN(date)) {
                valid = false
                message = "Date failed to parse"
            } else {
                value = {
                    date,
                    isoString: date.toISOString(),
                    localeISOString: this.localeISOStringFormatter(date),
                    localeString: this.localeStringFormatter(date)
                }
            }
        }

        if (this.options.validate) {
            let { valid: customValid, message: customMessage, value: customValue } = this.options.validate(this, value)
            if (customValid === false) {
                valid = customValid
                message = customMessage
                value = customValue
            }
        }
        return this.validation = { valid, message, value }
    }
    get domValue() {
    return this.value ? this.value.localeISOString : null
    }
    get serialValue() {
        return this.value ? this.value.isoString : null
    }
}
export class DateTimeField extends DateField {
    constructor({ property, uniqueId, schema, options, type, fieldType, container, setTrap }) {
        super({ property, uniqueId, schema, options, type, fieldType, container, setTrap })
        this.localeStringFormatter = dateTimeLocale
        this.localeISOStringFormatter = dateTimeISOLocale
    }
}

export class DateFallbackField extends DateField {
    async configure() {
        await this.doLegacyScripts("flatpickr_css")
    }
  get elementValue() {
        if (!this.formElement || !this.dateFallback.selectedDates[0]) return ""
        return this.localeISOStringFormatter(this.dateFallback.selectedDates[0])
    }
    get value() {
        return super.value
    }
    set value(value) {
        super.value = value
        this.dateFallback && this._value && this.dateFallback.setDate(this._value.date)
  }
  render() {
    const render = super.render()
    if (this.formElement && !this.dateFallback) {
            this.dateFallback = flatpickr(this.formElement, { allowInput: true, formatDate: this.localeStringFormatter, enableTime: this.showTime })
      this.value && this.dateFallback.setDate(this.value.date)
    }
    return render
  }
}

export class DateTimeFallbackField extends DateFallbackField {
    constructor(args) {
    super(args)
    this.localeStringFormatter = dateTimeLocale
    this.localeISOStringFormatter = dateTimeISOLocale
    this.showTime = true
  }
}